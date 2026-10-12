import { IsInt, IsOptional } from 'class-validator';

export class AssignPositionDto {
  @IsInt()
  @IsOptional()
  posteId: number | null;
}