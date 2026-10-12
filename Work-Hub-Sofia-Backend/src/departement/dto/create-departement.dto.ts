import { IsNotEmpty, IsString, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDepartementDto {
  @IsNotEmpty()
  @IsString()
  nomDepartement: string;

  @IsNotEmpty()
  @IsString()
  descriptionDepartement: string;

  @Type(() => Number)
  @IsNumber()
  nbEquipe: number;

  @IsBoolean()
  statut: boolean;

  @Type(() => Number)
  @IsNumber()
  responsableId: number;
}
