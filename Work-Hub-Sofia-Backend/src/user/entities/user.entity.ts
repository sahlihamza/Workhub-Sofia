import { DemandeConge } from 'src/demande-conge/entities/demande-conge.entity';
import { Departement } from 'src/departement/entities/departement.entity';
import { Equipe } from 'src/equipe/entities/equipe.entity';
import { Poste } from 'src/postes/entities/poste.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { Planning } from '../../planning/entities/planning.entity';
import { Exclude } from 'class-transformer';


@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column({ unique: true })
  email: string;

  @Column()
  motDePasse: string;

  @Column({ type: 'int' })
  numero: number;

  @Column()
  role: string;

  @ManyToOne(() => Departement, (departement) => departement.users, { nullable: true })
  @Exclude({ toPlainOnly: true })
  departement: Departement | null;


  @Column({ nullable: true })
  departementId: number | null;

  @OneToOne(() => Equipe, (equipe) => equipe.responsable)
  @Exclude({ toPlainOnly: true })
  equipeResponsable: Equipe;

  @ManyToOne(() => Equipe, (equipe) => equipe.membres, { nullable: true ,  onDelete: 'SET NULL'})
  @Exclude({ toPlainOnly: true })
  equipe: Equipe | null;


@Column({ type: 'varchar', nullable: true })
resetToken: string | null;


@Column({ type: 'datetime', nullable: true })
resetTokenExpiration?: Date | null;

  @Column({ nullable: true })
  equipeId: number | null;
  @ManyToOne(() => Poste, (poste) => poste.users, { nullable: true, eager: true })

  @ManyToOne(() => Poste, (poste) => poste.users)
  @JoinColumn({ name: 'id_poste' })
  poste: Poste | null;


  @OneToMany(() => DemandeConge, (demandeConge) => demandeConge.user)
demandesConge: DemandeConge[];

@Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
soldeConge: number; // 1 point = 1 jour de congé

@Column({ type: 'boolean', default: false })
isDeleted: boolean;

@Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
soldeCongeMaladie: number;

@Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
soldeCompensation: number;

@OneToMany(() => Planning, planning => planning.user)
plannings: Planning[];
}