import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { PostesService } from './postes.service';
import { CreatePosteDto } from './dto/create-poste.dto';
import { UpdatePosteDto } from './dto/update-poste.dto';

@Controller('postes')
export class PostesController {
  constructor(private readonly postesService: PostesService) {}

  @Post()
  create(@Body() createPosteDto: CreatePosteDto) {
    return this.postesService.create(createPosteDto);
  }

  @Get()
  findAll() {
    return this.postesService.findAll();
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updatePosteDto: UpdatePosteDto) {
    return this.postesService.update(id, updatePosteDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postesService.remove(id);
  }

  @Get('by-department/:departmentId')
  findAllByDepartment(@Param('departmentId', ParseIntPipe) departmentId: number) {
    return this.postesService.findAllByDepartment(departmentId);
  }
}