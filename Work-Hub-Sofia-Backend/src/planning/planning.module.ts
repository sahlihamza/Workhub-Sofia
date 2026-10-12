import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanningService } from './planning.service';
import { PlanningController } from './planning.controller';
import { Planning } from './entities/planning.entity';
import { UserModule } from 'src/user/user.module';
import { MailerModule, MailerService } from '@nestjs-modules/mailer';
import { Departement } from '../departement/entities/departement.entity';
import { Equipe } from '../equipe/entities/equipe.entity';
import { DemandeConge } from '../demande-conge/entities/demande-conge.entity';
import { User } from '../user/entities/user.entity';
import { MailModule } from '../mail/mail.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Planning, Departement, Equipe, DemandeConge, User,]),
    UserModule, MailModule
  ],
  controllers: [PlanningController],
  providers: [PlanningService],
})
export class PlanningModule {}