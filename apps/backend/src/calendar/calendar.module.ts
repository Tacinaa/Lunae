import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller.js';
import { CalendarService } from './calendar.service.js';
import { EventController } from './event.controller.js';
import { EventService } from './event.service.js';

@Module({
  controllers: [CalendarController, EventController],
  providers: [CalendarService, EventService],
})
export class CalendarModule {}
