import { IsNotEmpty, IsString, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEquipeDto {
  @IsNotEmpty()
  @IsString()
  nomEquipe: string;

  @IsNotEmpty()
  @IsString()
  descriptionEquipe: string;

  @Type(() => Number)
  @IsNumber()
  nbMembres: number;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  departementId: number;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  responsableEquipeId: number;
}