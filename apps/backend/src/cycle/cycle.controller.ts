import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  CurrentUser,
  type JwtUser,
} from '../auth/decorators/current-user.decorator.js';
import { CycleService } from './cycle.service.js';
import { CreateCycleDto } from './dto/create-cycle.dto.js';

@Controller('cycle')
export class CycleController {
  constructor(private cycle: CycleService) {}

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateCycleDto) {
    return this.cycle.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.cycle.findAll(user.userId);
  }

  @Get('current-phase')
  getCurrentPhase(@CurrentUser() user: JwtUser) {
    return this.cycle.getCurrentPhase(user.userId);
  }

  @Get('phases')
  getPhases(
    @CurrentUser() user: JwtUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.cycle.getPhasesInRange(
      user.userId,
      new Date(from),
      new Date(to),
    );
  }

  @Get('prediction')
  getPrediction(@CurrentUser() user: JwtUser) {
    return this.cycle.getPrediction(user.userId);
  }
}
