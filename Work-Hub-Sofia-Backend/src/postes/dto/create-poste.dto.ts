import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreatePosteDto {
  @IsString()
  @IsNotEmpty()
  nomPoste: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  departementId: number;
}