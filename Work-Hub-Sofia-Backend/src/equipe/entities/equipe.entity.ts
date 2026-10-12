import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, OneToOne } from 'typeorm';
import { Departement } from 'src/departement/entities/departement.entity';
import { User } from 'src/user/entities/user.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class Equipe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nomEquipe: string;

  @Column()
  descriptionEquipe: string;

  @Column({ default: 0 })
  nbMembres: number;

  @ManyToOne(() => Departement, (departement) => departement.equipes, {onDelete: 'CASCADE',  nullable: false})


  @OneToOne(() => User, user => user.equipeResponsable, {
    nullable: true,
    onDelete: 'SET NULL'
  })

  @ManyToOne(() => User)
  @JoinColumn({ name: 'responsableEquipeId' })
  responsable: User | null;

  @ManyToOne(() => Departement)
  @JoinColumn({ name: 'departementId' })
  departement: Departement | null;

  @OneToMany(() => User, (user) => user.equipe)
  @Exclude({ toPlainOnly: true })
  membres: User[];
}