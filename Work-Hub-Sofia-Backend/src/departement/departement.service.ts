import {
  Injectable, Logger, NotFoundException, ConflictException,
  InternalServerErrorException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateDepartementDto } from './dto/create-departement.dto';
import { UpdateDepartementDto } from './dto/update-departement.dto';
import { Departement } from './entities/departement.entity';
import { Equipe } from '../equipe/entities/equipe.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class DepartementService {
  private readonly logger = new Logger(DepartementService.name);

  constructor(
    @InjectRepository(Departement)
    private readonly departementRepository: Repository<Departement>,
    private readonly dataSource: DataSource,
  ) {}

  private toSafeDepartmentResponse(department: Departement): any {
    if (department.responsable) {

      const safeResponsable = {
        id: department.responsable.id,
        nom: department.responsable.nom,
        prenom: department.responsable.prenom,
        email: department.responsable.email,
        role: department.responsable.role,

      };

      return { ...department, responsable: safeResponsable };
    }
    return department;
  }

  async create(createDepartementDto: CreateDepartementDto): Promise<Departement> {
    const savedDepartment = await this.dataSource.transaction(async (transactionalEntityManager) => {
      const { responsableId, ...restOfDto } = createDepartementDto;
      const existing = await transactionalEntityManager.findOne(Departement, { where: { nomDepartement: restOfDto.nomDepartement } });
      if (existing) {
        throw new ConflictException('Ce nom de département est déjà utilisé.');
      }
      const newDepartment = transactionalEntityManager.create(Departement, restOfDto);
      const saved = await transactionalEntityManager.save(newDepartment);
      if (responsableId) {
        const userToPromote = await transactionalEntityManager.findOneBy(User, { id: responsableId });
        if (userToPromote) {
          userToPromote.role = 'admin';
          userToPromote.departement = saved;
          await transactionalEntityManager.save(userToPromote);
          saved.responsable = userToPromote;
          await transactionalEntityManager.save(saved);
        }
      }
      return saved;
    });

    return this.toSafeDepartmentResponse(savedDepartment);
  }

  async findAll(): Promise<Departement[]> {
    const departments = await this.departementRepository.find({ relations: ['responsable'] });
    return departments.map(dept => this.toSafeDepartmentResponse(dept));
  }

  async findOne(id: number): Promise<Departement> {
    const departement = await this.departementRepository.findOne({
      where: { id },
      relations: ['responsable']
    });
    if (!departement) {
      throw new NotFoundException(`Department with ID "${id}" not found`);
    }
    return this.toSafeDepartmentResponse(departement);
  }

  async update(id: number, updateDepartementDto: UpdateDepartementDto): Promise<Departement> {
    const updatedDepartment = await this.dataSource.transaction(async (transactionalEntityManager) => {
      const { responsableId, ...restOfDto } = updateDepartementDto;
      const department = await transactionalEntityManager.findOne(Departement, { where: { id }, relations: ['responsable'] });
      if (!department) {
        throw new NotFoundException(`Department with ID "${id}" not found`);
      }
      const oldHead = department.responsable;
      if (oldHead && oldHead.id !== responsableId) {
        if (oldHead.role === 'admin') {
          oldHead.role = 'collaborateur';
          await transactionalEntityManager.save(oldHead);
        }
      }
      Object.assign(department, restOfDto);
      if (responsableId) {
        const newHead = await transactionalEntityManager.findOneBy(User, { id: responsableId });
        if (newHead) {
          newHead.role = 'admin';
          newHead.departement = department;
          department.responsable = newHead;
          await transactionalEntityManager.save(newHead);
        }
      } else {
        department.responsable = null;
      }
      return transactionalEntityManager.save(department);
    });

    return this.toSafeDepartmentResponse(updatedDepartment);
  }

  async remove(id: number): Promise<void> {
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const department = await transactionalEntityManager.findOneBy(Departement, { id });
      if (!department) {
        throw new NotFoundException(`Department with ID "${id}" not found`);
      }

      const members = await transactionalEntityManager.find(User, {
        where: { departement: { id: id } },
      });

      for (const member of members) {
        member.departement = null;
        if (member.role === 'admin') {
          member.role = 'collaborateur';
        }
      }
      await transactionalEntityManager.save(members);

      await transactionalEntityManager.delete(Equipe, { departement: { id: id } });
      await transactionalEntityManager.remove(department);
    });
  }

  async setDepartmentHead(departmentId: number, newHeadId: number): Promise<Departement> {
    const updatedDepartment = await this.dataSource.transaction(async (transactionalEntityManager) => {
      const department = await transactionalEntityManager.findOne(Departement, {
        where: { id: departmentId },
        relations: ['responsable'],
      });
      if (!department) {
        throw new NotFoundException(`Department with ID ${departmentId} not found.`);
      }

      const newHead = await transactionalEntityManager.findOneBy(User, { id: newHeadId });
      if (!newHead) {
        throw new NotFoundException(`User with ID ${newHeadId} not found to be promoted.`);
      }

      if (newHead.role === 'manager') {
        throw new BadRequestException('A team lead (manager) cannot be promoted to department head.');
      }

      // --- Start of New Logic ---
      // Check if the user is already a member of a team
      if (newHead.equipeId) {
        throw new BadRequestException('A user who is a member of a team cannot be promoted to department head.');
      }
      // --- End of New Logic ---

      if (newHead.departementId !== departmentId) {
        throw new BadRequestException('The new head must be a member of the department.');
      }

      const oldHead = department.responsable;

      if (oldHead && oldHead.id !== newHead.id) {
        if (oldHead.role === 'admin') {
          oldHead.role = 'collaborateur';
          await transactionalEntityManager.save(oldHead);
        }
      }

      if (newHead.role !== 'admin') {
        newHead.role = 'admin';
      }

      department.responsable = newHead;
      await transactionalEntityManager.save(newHead);
      return transactionalEntityManager.save(department);
    });

    return this.toSafeDepartmentResponse(updatedDepartment);
  }

}