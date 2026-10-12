import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity()
@Unique(['user', 'date'])
export class Planning {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: string;

  @Column({
    type: 'enum',
    enum: ['present', 'remote'],
  })
  status: 'present' | 'remote';

  @Column({ type: 'text', nullable: true })
  notes: string | undefined;

  @ManyToOne(() => User, user => user.plannings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}