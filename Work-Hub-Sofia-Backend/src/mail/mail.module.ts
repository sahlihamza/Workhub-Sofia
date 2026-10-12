import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { User } from 'src/user/entities/user.entity';
import { Equipe } from 'src/equipe/entities/equipe.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
   imports: [
    TypeOrmModule.forFeature([User, Equipe]), // <-- ajouter ici
    MailerModule, // si tu utilises mailerService dans MailService
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
