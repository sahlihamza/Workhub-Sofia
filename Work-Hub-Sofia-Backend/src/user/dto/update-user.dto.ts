import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères.' })
  nom?: string;

  @IsOptional()
  @IsString({ message: 'Le prénom doit être une chaîne de caractères.' })
  prenom?: string;

  @IsOptional()
  @IsEmail({}, { message: "L'email doit être une adresse valide." })
  email?: string;

  @IsOptional()
  @IsInt({ message: 'Le numéro doit être un entier.' })
  @Min(10000000, { message: 'Le numéro doit contenir exactement 8 chiffres.' })
  @Max(99999999, { message: 'Le numéro doit contenir exactement 8 chiffres.' })
  numero?: number;


  @IsOptional()
  @IsInt({ message: 'Le département doit être un identifiant numérique.' })
  departementId?: number;

  @IsOptional()
  @IsInt({ message: "L'équipe responsable doit être un identifiant numérique." })
  equipeResponsableId?: number;

  @IsOptional()
  @IsInt({ message: "L'équipe doit être un identifiant numérique." })
  equipeId?: number;

  @IsOptional()
  @IsInt()
  posteId: number | null;
}
