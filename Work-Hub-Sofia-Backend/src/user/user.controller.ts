import { Controller, Get, Post, Body, Patch,ParseIntPipe,ParseArrayPipe,Query, Param, Delete, Request, BadRequestException, NotFoundException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AssignTeamDto } from './dto/assign-team.dto';
import { AssignPositionDto } from './dto/assign-position.dto';
import { User } from './entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto, @Request() req) {
    const creator = req.user; // l'utilisateur connecté injecté par le middleware d'auth
    return this.userService.create(createUserDto, creator);
  }
  @Get('role/collaborateur/available')
  findAvailableCollaborators(@Request() req) {
    const user = req.user;
    return this.userService.findAvailableCollaborators(user);
  }

 @Get()
findAll(@Request() req) {
  const creator = req.user; // L'utilisateur connecté
  return this.userService.findAll(creator);
}



  @Get('by-roles')
  findUsersByRoles(
    @Query('roles', new ParseArrayPipe({ items: String, separator: ',' })) roles: string[],
  ) {
    return this.userService.findUsersByRole(roles);
  }

  @Get('available-department-heads')
  findAvailableDepartmentHeads() {
    return this.userService.findAvailableDepartmentHeads();
  }

  @Get('available-members')
  findAvailableMembers() {
    return this.userService.findAvailableMembers();
  }

  @Get('collaborators-for-positioning')
  findCollaboratorsForPositioning(@Request() req) {
    const user = req.user;
    return this.userService.findCollaboratorsForPositioning(user);
  }
  @Patch(':userId/assign-department')
  assignDepartment(
    @Param('userId', ParseIntPipe) userId: number,
    @Body('departmentId', ParseIntPipe) departmentId: number,
  ) {
    return this.userService.assignDepartment(userId, departmentId);
  }

  @Get('available-team-leads')
  findAvailableTeamLeads(@Request() req) {
    return this.userService.findAvailableTeamLeads(req.user);
  }

  @Get('department/:departmentId/members')
  findUsersByDepartmentPaginated(
    @Param('departmentId', ParseIntPipe) departmentId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.userService.findUsersByDepartmentPaginated(
      departmentId,
      page,
      limit,
    );
  }

  @Patch(':userId/unassign-department')
  unassignDepartment(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.unassignDepartment(userId);
  }

@Get('available-admins')
findAvailableAdmins() {
    return this.userService.findAvailableAdmins();
  }
@Get('me')
async getProfile(@Request() req) {
  const userId = req.user.userId;
  const user = await this.userService.findById(userId);

  if (!user) {
    throw new NotFoundException('Utilisateur non trouvé');
  }
  // Exclure les champs sensibles
  const { id,motDePasse, resetToken, resetTokenExpiration, ...userSafe } = user;
  return userSafe;
}



  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  // --- NEW ENDPOINT ADDED HERE ---
  @Patch(':userId/assign-team')
  assignTeam(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() assignTeamDto: AssignTeamDto,
    @Request() req,
  ) {
    const editor = req.user;
    return this.userService.assignTeam(userId, assignTeamDto.equipeId, editor);
  }

  // --- END OF NEW ENDPOINT ---






@Patch('me')
async updateProfile(
  @Body() updateUserDto: UpdateUserDto,
  @Request() req,
) {
  const currentUser = req.user;

  console.log('Contenu de req.user:', currentUser);

  if (!currentUser || !currentUser.userId) {
    throw new BadRequestException("L'identifiant utilisateur est manquant dans la requête.");
  }

  const userId = Number(currentUser.userId);
  if (isNaN(userId)) {
    throw new BadRequestException('ID utilisateur invalide dans le token.');
  }

  return this.userService.updateProfile(userId, updateUserDto);
}


  @Patch(':id/assign-position')
  updatePosition(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignPositionDto: AssignPositionDto,
  ) {
    return this.userService.assignPosition(id, assignPositionDto.posteId);
  }

  @Get('all/simple')
  findAllSimple(@Request() req) {
    const user = req.user;
    return this.userService.findAllUsersSimple(user);
  }
  @Get('team/:teamId/members')
  findUsersByTeamPaginated(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.userService.findUsersByTeamPaginated(teamId, page, limit);
  }

  @Patch(':userId/unassign-team')
  unassignTeam(@Param('userId', ParseIntPipe) userId: number) {
    return this.userService.unassignTeam(userId);
  }

  @Get('by-department/:departmentId')
  findUsersByDepartment(@Param('departmentId', ParseIntPipe) departmentId: number) {
    return this.userService.findUsersByDepartment(departmentId);
  }
@Patch('updatePassword')
 async updatePassword(
  @Request() req,
  @Body() body: { ancienMotDePasse: string; nouveauMotDePasse: string }
) {
  const utilisateurId = req.user.id;

  try {
    await this.userService.updatePassword(utilisateurId, body.ancienMotDePasse, body.nouveauMotDePasse);
    return { message: 'La modification est effectuée avec succès' };
  } catch (error) {
    throw new BadRequestException(error.message || 'Erreur lors de la modification');
  }}

  @Get('team/:teamId')
  findAllByTeam(@Param('teamId') teamId: string) {
    return this.userService.findAllByTeam(+teamId);
  }






  @Patch(':id')
async update(
  @Param('id') id: string,
  @Body() updateUserDto: CreateUserDto,
  @Request() req,
) {
  const editor = req.user;

  if (!editor || !editor.userId) {
    throw new BadRequestException("L'utilisateur connecté est invalide.");
  }

  const userId = Number(id);
  if (isNaN(userId)) {
    throw new BadRequestException('ID utilisateur invalide.');
  }

  return this.userService.update(userId, updateUserDto, editor);
}


// @Get('role/:role')
// findUsersByRole(@Param('role') role: string) {
//     return this.userService.findUsersByRole(role);
//   }

  @Delete(':id')
async remove(@Param('id') id: string, @Request() req) {
  const deleter = req.user;

  if (!deleter || !deleter.userId) {
    throw new ForbiddenException("Utilisateur non authentifié.");
  }

  const userId = Number(id);
  if (isNaN(userId)) {
    throw new BadRequestException('ID utilisateur invalide.');
  }

  return this.userService.remove(userId, deleter);
}

// user.controller.ts
 @Post('add-compensation')
  async addCompensation(
    @Request() req,
    @Body() body: { userId: number; jours: number }
  ) {
    const reqUser = req.user;
    if (!reqUser) throw new BadRequestException('Utilisateur non trouvé dans le JWT');

    const { userId, jours } = body;

    return this.userService.addCompensation(reqUser, userId, jours);
  }






  // @Get('departements/:departementId')
  // findByDepartement(@Param('departementId') departementId: number) {
  //   return this.userService.findByDepartement(departementId);
  // }

  // @Get('equipe/:equipeId')
  // findByEquipe(@Param('equipeId') equipeId: number) {
  //   return this.userService.findByEquipe(equipeId);
  // }
 
}
