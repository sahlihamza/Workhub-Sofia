import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsIn,
  Matches,
  IsInt,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  Max, IsNumber,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Le nom est requis.' })
  @IsString()
  nom: string;

  @IsNotEmpty({ message: 'Le prénom est requis.' })
  @IsString()
  prenom: string;

  @IsNotEmpty({ message: "L'email est requis." })
  @IsEmail({}, { message: "L'email doit être une adresse valide." })
  email: string;

 @IsNotEmpty({ message: 'Le numéro est requis.' })
@IsInt()
@Min(10000000, { message: 'Le numéro doit contenir exactement 8 chiffres.' })
@Max(99999999,)
numero: number;

  @IsNotEmpty({ message: 'Le rôle est requis.' })
  @IsIn(['superadmin', 'admin', 'manager', 'collaborateur'], {
    message:
      'Le rôle doit être superadmin, admin, manager ou collaborateur.',
  })
  role: string;

  @IsOptional()
  @IsInt({ message: 'Le département doit être un identifiant numérique.' })
  departementId: number;

  @IsOptional()
  @IsInt({ message: "L'équipe responsable doit être un identifiant numérique." })
  equipeResponsableId?: number;

  @IsOptional()
  @IsInt({ message: "L'équipe doit être un identifiant numérique." })
  equipeId?: number;

  @IsOptional()
  @IsNumber()
  posteId?: number;
}
