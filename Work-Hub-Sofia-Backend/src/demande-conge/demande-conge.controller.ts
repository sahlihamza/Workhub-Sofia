import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe, Req, InternalServerErrorException } from '@nestjs/common';
import { DemandeCongeService } from './demande-conge.service';
import { CreateDemandeCongeDto } from './dto/create-demande-conge.dto';
import { UpdateDemandeCongeDto } from './dto/update-demande-conge.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('demande-conge')
export class DemandeCongeController {
  constructor(private readonly demandeCongeService: DemandeCongeService,) {}

  @Post()
  @Post()
create(@Body() createDemandeCongeDto: CreateDemandeCongeDto, @Request() req) {
  return this.demandeCongeService.create(createDemandeCongeDto, req.user.userId);
}

  @Get()
async findAll(@Request() req) {
  console.log('User complet JWT:', req.user);
  return this.demandeCongeService.findAllDemande(req.user);
}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.demandeCongeService.findOne(+id);
  }

  @Patch('traiter/:id')
async traiterDemande(
  @Param('id', ParseIntPipe) id: number,
  @Body('statut') statut: 'confirmee' | 'rejettee',
  @Request() req,
) {
  return this.demandeCongeService.traiterDemande(id, statut, req.user);
}

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDemandeCongeDto: UpdateDemandeCongeDto) {
    return this.demandeCongeService.update(+id, updateDemandeCongeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.demandeCongeService.remove(+id);
  }


}
