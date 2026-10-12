import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreatePosteDto } from './dto/create-poste.dto';
import { UpdatePosteDto } from './dto/update-poste.dto';
import { Poste } from './entities/poste.entity';
import { User } from '../user/entities/user.entity';


@Injectable()
export class PostesService {

  constructor(
    @InjectRepository(Poste)
    private readonly postesRepository: Repository<Poste>,
    private readonly dataSource: DataSource


  ) {}

  private toSafePosteResponse(poste: Poste): any {
    if (poste.users && Array.isArray(poste.users)) {
      const safeUsers = poste.users.map(user => {
        const {
          motDePasse,
          numero,
          resetToken,
          resetTokenExpiration,
          ...safeUser
        } = user;
        return safeUser;
      });
      return { ...poste, users: safeUsers };
    }
    return poste;
  }

  create(createPosteDto: CreatePosteDto): Promise<Poste> {
    const newPoste = this.postesRepository.create({
      ...createPosteDto,
      departement: { id: createPosteDto.departementId },
    });
    return this.postesRepository.save(newPoste);
  }

  findAll(): Promise<Poste[]> {
    return this.postesRepository.find({
      relations: ['users', 'departement'],
    });
  }

  async findOne(id: number): Promise<Poste> {
    const poste = await this.postesRepository.findOne({
      where: { id },
      relations: ['users'],
    });
    if (!poste) {
      throw new NotFoundException(`Poste with ID ${id} not found.`);
    }
    return this.toSafePosteResponse(poste);
  }

  async update(id: number, updatePosteDto: UpdatePosteDto): Promise<Poste> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const poste = await transactionalEntityManager.findOne(Poste, {
        where: { id },
        relations: ['departement', 'users'],
      });

      if (!poste) {
        throw new NotFoundException(`Poste with ID ${id} not found.`);
      }

      const originalDepartmentId = poste.departement?.id;
      const newDepartmentId = updatePosteDto.departementId;

      if (newDepartmentId && newDepartmentId !== originalDepartmentId) {
        if (poste.users && poste.users.length > 0) {
          for (const user of poste.users) {
            user.poste = null;
            await transactionalEntityManager.save(user);
          }
        }
        poste.departement = { id: newDepartmentId } as any;
      }

      if (updatePosteDto.nomPoste) {
        poste.nomPoste = updatePosteDto.nomPoste;
      }

      if (typeof updatePosteDto.description !== 'undefined') {
        poste.description = updatePosteDto.description;
      }

      const updatedPoste = await transactionalEntityManager.save(poste);
      return this.toSafePosteResponse(updatedPoste);
    });
  }

  async remove(id: number): Promise<void> {
    const result = await this.postesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Poste with ID ${id} not found.`);
    }
  }

  async findAllByDepartment(departmentId: number): Promise<Poste[]> {
    const postes = await this.postesRepository.find({
      where: { departement: { id: departmentId } },
      relations: ['users'],
    });
    return postes.map(poste => this.toSafePosteResponse(poste));
  }
}