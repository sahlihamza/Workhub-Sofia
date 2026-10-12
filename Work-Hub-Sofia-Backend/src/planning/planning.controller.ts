import { Controller, Get, Post, Body, UseGuards, Req, Query, ParseIntPipe, Delete, Res } from '@nestjs/common';
import { PlanningService } from './planning.service';
import { CreatePlanningDto } from './dto/create-planning.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('planning')
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Post()
  upsert(@Body() planningDto: CreatePlanningDto, @Req() req) {
    const userMakingRequest = req.user;
    let targetUserId = userMakingRequest.userId;

    if ((userMakingRequest.role === 'superadmin' || userMakingRequest.role === 'admin') && planningDto.userId) {
      targetUserId = planningDto.userId;
    }

    return this.planningService.upsert(planningDto, targetUserId, userMakingRequest);
  }

  @Delete()
  remove(@Body('date') date: string, @Body('userId') targetUserId: number, @Req() req) {
    const userMakingRequest = req.user;
    let userIdToDeleteFor = userMakingRequest.userId;

    if (userMakingRequest.role === 'superadmin' && targetUserId) {
      userIdToDeleteFor = targetUserId;
    }

    return this.planningService.remove(date, userIdToDeleteFor);
  }

  @Get('export')
  async exportAll(
    @Res() res: Response,
    @Query('searchTerm') searchTerm?: string,
    @Query('departmentId', new ParseIntPipe({ optional: true })) departmentId?: number,
    @Query('teamId', new ParseIntPipe({ optional: true })) teamId?: number,
    @Query('userId', new ParseIntPipe({ optional: true })) userId?: number,

  ) {
    const filters = { searchTerm, departmentId, teamId, userId };
    const { buffer, filenamePart } = await this.planningService.exportPlanningToExcel(filters);
    const date = new Date().toISOString().slice(0, 10);

    const finalFilename = `planning-${filenamePart}${date}.xlsx`;
    const contentDisposition = `attachment; filename=${finalFilename}`;

    console.log('Setting Content-Disposition Header to:', contentDisposition);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', contentDisposition);
    res.send(buffer);
  }

  @Get()
  findByUserAndMonth(
    @Req() req,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @Query('userId', new ParseIntPipe({ optional: true })) targetUserId: number,
  ) {
    const userMakingRequest = req.user;
    if (userMakingRequest.role === 'superadmin' && targetUserId) {
      return this.planningService.findByUserAndMonth(targetUserId, year, month);
    }
    return this.planningService.findByUserAndMonth(userMakingRequest.userId, year, month);
  }


  @Get('test-reminder')
  async testReminder() {
    try {
      await this.planningService.handlePlanningReminders();
      return { message: 'Reminder emails processed (check logs for details)' };
    } catch (err) {
      console.error(err);
      return { error: 'Failed to process reminders' };
    }
  }


}