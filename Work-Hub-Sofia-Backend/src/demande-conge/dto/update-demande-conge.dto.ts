import { PartialType } from '@nestjs/mapped-types';
import { CreateDemandeCongeDto } from './create-demande-conge.dto';

export class UpdateDemandeCongeDto extends PartialType(CreateDemandeCongeDto) {}
