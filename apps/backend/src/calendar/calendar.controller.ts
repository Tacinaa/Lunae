import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  CurrentUser,
  type JwtUser,
} from '../auth/decorators/current-user.decorator.js';
import { CalendarService } from './calendar.service.js';
import { CreateCalendarDto } from './dto/create-calendar.dto.js';
import { ImportGoogleCalendarDto } from './dto/import-google-calendar.dto.js';
import { GoogleCalendarService } from './google-calendar.service.js';

@Controller('calendars')
export class CalendarController {
  constructor(
    private calendars: CalendarService,
    private googleCalendar: GoogleCalendarService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.calendars.findAll(user.userId);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateCalendarDto) {
    return this.calendars.create(user.userId, dto);
  }

  @Post('import/google')
  importGoogle(
    @CurrentUser() user: JwtUser,
    @Body() dto: ImportGoogleCalendarDto,
  ) {
    return this.googleCalendar.importPrimaryCalendar(user.userId, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.calendars.remove(user.userId, id);
  }
}
