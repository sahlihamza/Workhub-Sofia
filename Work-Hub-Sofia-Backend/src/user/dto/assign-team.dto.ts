import { IsInt, IsNotEmpty } from 'class-validator';

export class AssignTeamDto {
  @IsInt()
  @IsNotEmpty()
  equipeId: number;
}