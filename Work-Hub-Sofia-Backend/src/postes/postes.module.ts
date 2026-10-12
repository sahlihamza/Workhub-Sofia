import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostesService } from './postes.service';
import { PostesController } from './postes.controller';
import { Poste } from './entities/poste.entity';
import { User } from '../user/entities/user.entity';
import { DataSource } from 'typeorm';
import { UserModule } from '../user/user.module';


@Module({
  imports: [TypeOrmModule.forFeature([Poste, User, ]),
  ],

  controllers: [PostesController],
  providers: [PostesService],
})
export class PostesModule {}