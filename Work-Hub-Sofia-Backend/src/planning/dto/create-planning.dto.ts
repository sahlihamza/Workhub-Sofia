import { IsNotEmpty, IsString, IsDateString, IsEnum, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlanningDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsEnum(['present', 'remote'])
  @IsNotEmpty()
  status: 'present' | 'remote';

  @IsString()
  @IsOptional()
  notes?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  userId?: number;
}