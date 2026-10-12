import { User } from '../../user/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Departement } from 'src/departement/entities/departement.entity';

@Entity('postes')
export class Poste {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'nom_poste' })
  nomPoste: string;

  @Column({ type: 'text', nullable: true })
  description: string;


  @ManyToOne(() => Departement, { nullable: false })
  @JoinColumn({ name: 'departementId' })
  departement: Departement | null;



  @OneToMany(() => User, (user) => user.poste)
  users: User[];


}