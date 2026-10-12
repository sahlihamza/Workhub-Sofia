import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { UserModule } from './user/user.module';
import { DepartementModule } from './departement/departement.module';
import { EquipeModule } from './equipe/equipe.module';
import { AuthModule } from './auth/auth.module';
import { JwtStrategy } from './auth/jwt.strategy';
import { PostesModule } from './postes/postes.module';
import { MailModule } from './mail/mail.module';
import { PlanningModule } from './planning/planning.module';
import { ScheduleModule } from '@nestjs/schedule';
import { DemandeCongeModule } from './demande-conge/demande-conge.module';
import { CampaignsModule } from './campaigns/campaigns.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: '',
        database: 'WorkHubSofia',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        extra: {
          timezone: 'Z',
        },
        // Keep false in normal runs. Set DB_SYNCHRONIZE=true only to
        // auto-create tables on a fresh dev DB (e.g. for the seed).
        synchronize: config.get('DB_SYNCHRONIZE') === 'true',
        migrationsRun: config.get('DB_MIGRATIONS_RUN') !== 'false',
      }),
    }),

    MailerModule.forRoot({
      transport: {
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false, // STARTTLS
        auth: {
          user: process.env.SENDINBLUE_EMAIL , // mettre dans .env
          pass: process.env.SENDINBLUE_API_KEY, // mettre dans .env
        },
      },
      defaults: {
        from: 'Sofiatech<sehli7hamza@gmail.com>', // adresse d’envoi
      },
    }),

    UserModule,
    DepartementModule,
    EquipeModule,
    AuthModule,
    PostesModule,
    MailModule,
    PlanningModule,
    ScheduleModule.forRoot(),
    DemandeCongeModule,
    CampaignsModule,
  ],
  providers: [JwtStrategy],
})
export class AppModule {}
