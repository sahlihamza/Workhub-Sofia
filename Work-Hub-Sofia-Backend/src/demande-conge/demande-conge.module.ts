import { Module } from '@nestjs/common';
import { DemandeCongeService } from './demande-conge.service';
import { DemandeCongeController } from './demande-conge.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DemandeConge } from './entities/demande-conge.entity';
import { User } from 'src/user/entities/user.entity';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([DemandeConge, User]),MailModule],
  controllers: [DemandeCongeController],
  providers: [DemandeCongeService],
  exports: [DemandeCongeService],
})
export class DemandeCongeModule {}
