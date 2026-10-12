import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';

import { User } from 'src/user/entities/user.entity';
import { TypeConge } from './TypeConge.enum';
import { StatutDemande } from './StatutDemande.enum';
import { IsBoolean } from 'class-validator';

@Entity()
export class DemandeConge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  dateDebut: Date;

  @Column({ type: 'date' })
  dateFin: Date;

  @Column()
  cause: string;

  @Column({
    type: 'enum',
    enum: TypeConge,
    default: TypeConge.CONGE,
  })
  type: TypeConge;

  // @Column()
  // duree: number;
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
duree: number;



  @Column({
    type: 'enum',
    enum: StatutDemande,
    default: StatutDemande.EN_ATTENTE,
  })
  statut: StatutDemande;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.demandesConge)
  user: User;

  @IsBoolean()
  demiJourDebut: boolean;  // true = demi-journée, false = journée entière

  @IsBoolean()
  demiJourFin: boolean;
}
