import { IsInt, IsOptional } from 'class-validator';

export class AssignPositionDto {
  @IsOptional()
  @IsInt()
  posteId: number | null;
}