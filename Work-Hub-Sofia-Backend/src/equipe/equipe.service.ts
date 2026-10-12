import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateEquipeDto } from './dto/create-equipe.dto';
import { UpdateEquipeDto } from './dto/update-equipe.dto';
import { Equipe } from './entities/equipe.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class EquipeService {
  constructor(
    @InjectRepository(Equipe)
    private readonly equipeRepository: Repository<Equipe>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  private toSafeEquipeResponse(equipe: Equipe): any {
    if (equipe.responsable) {
      const safeResponsable = {
        id: equipe.responsable.id,
        nom: equipe.responsable.nom,
        prenom: equipe.responsable.prenom,
        email: equipe.responsable.email,
        role: equipe.responsable.role,

      };
      return { ...equipe, responsable: safeResponsable };
    }
    return equipe;
  }

  async create(createEquipeDto: CreateEquipeDto): Promise<Equipe> {
    const newEquipe = await this.dataSource.transaction(async (transactionalEntityManager) => {
      const { departementId, responsableEquipeId, ...restOfDto } = createEquipeDto;
      const managerToUpdate = await transactionalEntityManager.findOneBy(User, {
        id: responsableEquipeId,
      });

      if (!managerToUpdate) {
        throw new NotFoundException(`User with ID "${responsableEquipeId}" not found to be assigned as lead.`);
      }

      const equipe = transactionalEntityManager.create(Equipe, {
        ...restOfDto,
        departement: { id: departementId },
        responsable: managerToUpdate,
      });
      const savedEquipe = await transactionalEntityManager.save(equipe);

      if (managerToUpdate.role === 'collaborateur') {
        managerToUpdate.role = 'manager';
      }
      managerToUpdate.equipe = savedEquipe;
      await transactionalEntityManager.save(managerToUpdate);

      return savedEquipe;
    });
    return this.toSafeEquipeResponse(newEquipe);
  }

  async findAll(): Promise<Equipe[]> {
    const equipes = await this.equipeRepository.find({ relations: ['departement', 'responsable'] });
    return equipes.map(equipe => this.toSafeEquipeResponse(equipe));
  }

  async findOne(id: number): Promise<Equipe> {
    const equipe = await this.equipeRepository.findOne({
      where: { id },
      relations: ['departement', 'responsable'],
    });
    if (!equipe) {
      throw new NotFoundException(`Equipe with ID "${id}" not found`);
    }
    return this.toSafeEquipeResponse(equipe);
  }

  async findByManagerId(managerId: number): Promise<Equipe[]> {
    const equipes = await this.equipeRepository.find({
      where: { responsable: { id: managerId } },
      relations: ['departement', 'responsable'],
    });
    return equipes.map(equipe => this.toSafeEquipeResponse(equipe));
  }

  async findTeamsByDepartment(departmentId: number): Promise<Equipe[]> {
    const equipes = await this.equipeRepository.find({
      where: { departement: { id: departmentId } },
      relations: ['responsable', 'departement'],
    });
    return equipes.map(equipe => this.toSafeEquipeResponse(equipe));
  }

  async update(id: number, updateEquipeDto: UpdateEquipeDto): Promise<Equipe> {
    const updatedEquipe = await this.dataSource.transaction(async (transactionalEntityManager) => {
      const { responsableEquipeId, departementId, ...restOfDto } = updateEquipeDto;
      const equipe = await transactionalEntityManager.findOne(Equipe, {
        where: { id },
        relations: ['responsable'],
      });
      if (!equipe) {
        throw new NotFoundException(`Equipe with ID "${id}" not found`);
      }
      const oldTeamLead = equipe.responsable;
      if (oldTeamLead && oldTeamLead.id !== responsableEquipeId) {
        if (oldTeamLead.role === 'manager') {
          oldTeamLead.role = 'collaborateur';
        }
        oldTeamLead.equipe = null;
        oldTeamLead.equipeId = null;
        await transactionalEntityManager.save(oldTeamLead);
      }
      if (responsableEquipeId) {
        const newTeamLead = await transactionalEntityManager.findOneBy(User, { id: responsableEquipeId });
        if (!newTeamLead) {
          throw new NotFoundException(`New lead with ID "${responsableEquipeId}" not found.`);
        }
        if (newTeamLead.role === 'collaborateur') {
          newTeamLead.role = 'manager';
        }
        newTeamLead.equipe = equipe;
        equipe.responsable = newTeamLead;
        await transactionalEntityManager.save(newTeamLead);
      } else {
        equipe.responsable = null;
      }
      Object.assign(equipe, restOfDto);
      if (departementId) {
        equipe.departement = { id: departementId } as any;
      }
      return transactionalEntityManager.save(equipe);
    });
    return this.toSafeEquipeResponse(updatedEquipe);
  }

  async remove(id: number): Promise<void> {
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const equipe = await transactionalEntityManager.findOne(Equipe, {
        where: { id },
        relations: ['responsable'],
      });
      if (!equipe) {
        throw new NotFoundException(`Equipe with ID "${id}" not found`);
      }
      if (equipe.responsable) {
        const teamLead = equipe.responsable;
        if (teamLead.role === 'manager') {
          teamLead.role = 'collaborateur';
        }
        teamLead.equipe = null;
        teamLead.equipeId = null;
        await transactionalEntityManager.save(teamLead);
      }
      await transactionalEntityManager.remove(equipe);
    });
  }
}