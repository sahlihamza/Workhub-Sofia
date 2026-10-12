import { IsInt, IsNotEmpty } from 'class-validator';

export class AssignCollaborateurDto {
  @IsInt()
  @IsNotEmpty()
  collaborateurId: number;
}