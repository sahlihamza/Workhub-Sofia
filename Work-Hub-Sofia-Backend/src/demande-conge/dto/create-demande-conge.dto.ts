import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TypeConge } from '../entities/TypeConge.enum';


export class CreateDemandeCongeDto {
  @IsDateString()
  dateDebut: string;

  @IsDateString()
  dateFin: string;

  @IsNotEmpty()
  @IsString()
  cause: string;

  @IsEnum(TypeConge, { message: 'Le type de congé est invalide' })
  type: TypeConge;

  @IsBoolean()
  demiJourDebut: boolean;  // true = demi-journée, false = journée entière

  @IsBoolean()
  demiJourFin: boolean;
  
}
