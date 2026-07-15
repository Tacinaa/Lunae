import { Module } from '@nestjs/common';
import { RecommendationModule } from '../recommendation/recommendation.module.js';
import { CalendarController } from './calendar.controller.js';
import { CalendarService } from './calendar.service.js';
import { EventController } from './event.controller.js';
import { EventService } from './event.service.js';
import { GoogleCalendarService } from './google-calendar.service.js';

@Module({
  imports: [RecommendationModule],
  controllers: [CalendarController, EventController],
  providers: [CalendarService, EventService, GoogleCalendarService],
})
export class CalendarModule {}
