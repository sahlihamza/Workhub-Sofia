import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Equal, In, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Planning } from './entities/planning.entity';
import { CreatePlanningDto } from './dto/create-planning.dto';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailerService } from '@nestjs-modules/mailer';
import * as ExcelJS from 'exceljs';
import { Departement } from '../departement/entities/departement.entity';
import { Equipe } from '../equipe/entities/equipe.entity';
import { DemandeConge } from '../demande-conge/entities/demande-conge.entity';
import { StatutDemande } from '../demande-conge/entities/StatutDemande.enum';
import { eachDayOfInterval, format } from 'date-fns';



@Injectable()
export class PlanningService {
  constructor(
    @InjectRepository(Planning)
    private planningRepository: Repository<Planning>,
    @InjectRepository(Departement)
    private departmentRepository: Repository<Departement>,
    @InjectRepository(Equipe)
    private teamRepository: Repository<Equipe>,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly mailerService: MailerService,
    @InjectRepository(DemandeConge)
    private demandeCongeRepository: Repository<DemandeConge>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findByUserAndMonth(userId: number, year: number, month: number): Promise<any[]> {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const startDate = format(firstDay, 'yyyy-MM-dd');
    const endDate = format(lastDay, 'yyyy-MM-dd');

    const planningEntries = await this.planningRepository.createQueryBuilder("planning")
      .where("planning.userId = :userId", { userId })
      .andWhere("planning.date BETWEEN :startDate AND :endDate", { startDate, endDate })
      .getMany();

    const leaveRequests = await this.demandeCongeRepository.createQueryBuilder("demande")
      .where("demande.userId = :userId", { userId })
      .andWhere("demande.statut = :statut", { statut: StatutDemande.CONFIRMEE })
      .andWhere("demande.dateDebut <= :endDate", { endDate })
      .andWhere("demande.dateFin >= :startDate", { startDate })
      .getMany();

    const scheduleMap = new Map<string, any>();

    planningEntries.forEach(entry => {
      const dateKey = new Date(entry.date).toDateString();
      scheduleMap.set(dateKey, entry);
    });

    leaveRequests.forEach(leave => {
      let currentDate = new Date(leave.dateDebut);
      const lastDate = new Date(leave.dateFin);

      while (currentDate <= lastDate) {
        if (currentDate >= firstDay && currentDate <= lastDay) {
          const dateKey = currentDate.toDateString();
          scheduleMap.set(dateKey, {
            date: format(currentDate, 'yyyy-MM-dd'),
            status: 'holiday',
            notes: leave.cause,
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return Array.from(scheduleMap.values());
  }

  async upsert(planningDto: CreatePlanningDto, targetUserId: number, userMakingRequest: any): Promise<Planning> {
    const { date, status, notes } = planningDto;

    if (!targetUserId) {
      throw new BadRequestException('User ID is missing.');
    }

    const planningEntry = await this.planningRepository.findOne({
      where: { user: { id: targetUserId }, date: date },
    });

    let savedEntry: Planning;

    if (planningEntry) {
      planningEntry.status = status;
      planningEntry.notes = notes;
      savedEntry = await this.planningRepository.save(planningEntry);
    } else {
      const newEntry = this.planningRepository.create({
        date,
        status,
        notes,
        user: { id: targetUserId },
      });
      savedEntry = await this.planningRepository.save(newEntry);
    }

    const isBeingEditedByAnother = userMakingRequest.userId !== targetUserId;
    if ((userMakingRequest.role === 'superadmin' || userMakingRequest.role === 'admin') && isBeingEditedByAnother) {
      const targetUser = await this.userService.findOne(targetUserId);
      if (targetUser) {
         this.mailService.sendPlanningUpdateNotification(targetUser, savedEntry, userMakingRequest);
      }
    }

    return savedEntry;
  }



  @Cron('0 9 * * 6')
  async handlePlanningReminders() {
    console.log('Running scheduled task: Checking for incomplete plannings...');
    const usersToRemind = await this.userService.findUsersWithIncompletePlanning();

    for (const user of usersToRemind) {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Reminder: Fill in your weekly planning',
        text: `Hello ${user.email}, please remember to fill in your planning for the upcoming week.`,
      });
    }

    console.log(`Sent ${usersToRemind.length} reminder emails.`);
  }



  async remove(date: string, userId: number): Promise<void> {
    if (!userId) {
      throw new BadRequestException('User ID is missing.');
    }
    const result = await this.planningRepository.delete({
      date: date,
      user: { id: userId },
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Planning entry not found.`);
    }
  }

  async exportPlanningToExcel(filters: { searchTerm?: string; departmentId?: number; teamId?: number; userId?: number }): Promise<{ buffer: Buffer; filenamePart: string; }> {
    const query = this.planningRepository.createQueryBuilder("planning")
      .innerJoinAndSelect("planning.user", "user")
      .leftJoinAndSelect("user.departement", "departement")
      .leftJoinAndSelect("user.equipe", "equipe")
      .orderBy({ "user.nom": "ASC", "planning.date": "ASC" });

    if (filters.userId) {
      query.where("user.id = :userId", { userId: filters.userId });
    } else {
      if (filters.searchTerm) {
        query.andWhere("(user.nom LIKE :searchTerm OR user.prenom LIKE :searchTerm)", { searchTerm: `%${filters.searchTerm}%` });
      }
      if (filters.departmentId) {
        query.andWhere("user.departementId = :departmentId", { departmentId: filters.departmentId });
      }
      if (filters.teamId) {
        query.andWhere("user.equipeId = :teamId", { teamId: filters.teamId });
      }
    }

    const allPlanning = await query.getMany();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Filtered Planning');

    worksheet.columns = [
      { header: 'User Name', key: 'userName', width: 30 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Team', key: 'team', width: 20 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Notes', key: 'notes', width: 50 },
    ];

    const allRows: { userName: string; department: string; team: string; date: string; status: string; notes: string; }[] = [];
    const existingEntries = new Set<string>();

    allPlanning.forEach(entry => {
      allRows.push({
        userName: `${entry.user.prenom} ${entry.user.nom}`,
        department: entry.user.departement?.nomDepartement || 'N/A',
        team: entry.user.equipe?.nomEquipe || 'N/A',
        date: entry.date,
        status: entry.status,
        notes: entry.notes || '',
      });
      existingEntries.add(`${entry.user.id}-${entry.date}`);
    });

    const userIds = [...new Set(allPlanning.map(p => p.user.id))];

    if (userIds.length > 0) {
      const confirmedVacations = await this.demandeCongeRepository.find({
        where: {
          user: { id: In(userIds) },
          statut: StatutDemande.CONFIRMEE,
        },
        relations: ['user', 'user.departement', 'user.equipe'],
      });

      confirmedVacations.forEach(vacation => {
        const interval = eachDayOfInterval({
          start: new Date(vacation.dateDebut),
          end: new Date(vacation.dateFin)
        });

        for (const day of interval) {
          const dateString = format(day, 'yyyy-MM-dd');
          const entryKey = `${vacation.user.id}-${dateString}`;

          if (!existingEntries.has(entryKey)) {
            allRows.push({
              userName: `${vacation.user.prenom} ${vacation.user.nom}`,
              department: vacation.user.departement?.nomDepartement || 'N/A',
              team: vacation.user.equipe?.nomEquipe || 'N/A',
              date: dateString,
              status: 'holiday',
              notes: vacation.cause || 'Confirmed Leave',
            });
          }
        }
      });
    }

    allRows.sort((a, b) => {
      if (a.userName < b.userName) return -1;
      if (a.userName > b.userName) return 1;
      return a.date.localeCompare(b.date);
    });

    worksheet.addRows(allRows);
    worksheet.getRow(1).font = { bold: true };

    let filenamePart = '';
    if (filters.userId) {
      const user = await this.userRepository.findOneBy({ id: filters.userId });
      if (user) {
        filenamePart = `${user.prenom}${user.nom}-`;
      }
    } else {
      if (filters.departmentId) {
        const dept = await this.departmentRepository.findOneBy({ id: filters.departmentId });
        if (dept) filenamePart += `${dept.nomDepartement}-`;
      }
      if (filters.teamId) {
        const team = await this.teamRepository.findOneBy({ id: filters.teamId });
        if (team) filenamePart += `${team.nomEquipe}-`;
      }
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
const buffer = Buffer.from(arrayBuffer); // Conversion ArrayBuffer → Buffer Node.js
return { buffer, filenamePart };

  }


}