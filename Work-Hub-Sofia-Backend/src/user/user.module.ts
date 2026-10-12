import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Departement } from '../departement/entities/departement.entity';
import { Equipe } from '../equipe/entities/equipe.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MailModule } from 'src/mail/mail.module';
import { DemandeConge } from 'src/demande-conge/entities/demande-conge.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Departement, Equipe,DemandeConge]),
    MailModule
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
