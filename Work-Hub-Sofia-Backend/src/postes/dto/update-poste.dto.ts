import { PartialType } from '@nestjs/mapped-types';
import { CreatePosteDto } from './create-poste.dto';
import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePosteDto extends PartialType(CreatePosteDto) {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  departementId?: number;
}