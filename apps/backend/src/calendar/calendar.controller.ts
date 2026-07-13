import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  CurrentUser,
  type JwtUser,
} from '../auth/decorators/current-user.decorator.js';
import { CalendarService } from './calendar.service.js';
import { CreateCalendarDto } from './dto/create-calendar.dto.js';

@Controller('calendars')
export class CalendarController {
  constructor(private calendars: CalendarService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.calendars.findAll(user.userId);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateCalendarDto) {
    return this.calendars.create(user.userId, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.calendars.remove(user.userId, id);
  }
}
