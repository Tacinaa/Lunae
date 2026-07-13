import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  CurrentUser,
  type JwtUser,
} from '../auth/decorators/current-user.decorator.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { EventService } from './event.service.js';

@Controller('events')
export class EventController {
  constructor(private events: EventService) {}

  @Get()
  findInRange(
    @CurrentUser() user: JwtUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.events.findInRange(user.userId, new Date(from), new Date(to));
  }

  @Get('search')
  search(@CurrentUser() user: JwtUser, @Query('q') q: string) {
    return this.events.search(user.userId, q ?? '');
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.events.findOne(user.userId, id);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateEventDto) {
    return this.events.create(user.userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.events.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.events.remove(user.userId, id);
  }
}
