import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Equipe } from 'src/equipe/entities/equipe.entity';

@Entity()
export class Departement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nomDepartement: string;

  @Column({ type: 'text' })
  descriptionDepartement: string;

  @Column({ default: 0 })
  nbEquipe: number;

  @Column({ default: true })
  statut: boolean;

  @Column({ nullable: true })
  responsableId: number | null;


  @ManyToOne(() => User, { nullable: false

  })        
  responsable: User | null;

  // ✅ Ce département contient plusieurs équipes
  @OneToMany(() => Equipe, (equipe) => equipe.departement)
  equipes: Equipe[];

  // ✅ Ce département contient plusieurs utilisateurs
  @OneToMany(() => User, (user) => user.departement)
  users: User[];
  onDelete: 'SET NULL'
}
