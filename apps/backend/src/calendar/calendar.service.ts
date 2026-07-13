import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateCalendarDto } from './dto/create-calendar.dto.js';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.calendar.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  create(userId: string, dto: CreateCalendarDto) {
    return this.prisma.calendar.create({ data: { userId, ...dto } });
  }

  async remove(userId: string, id: string) {
    const calendar = await this.prisma.calendar.findUnique({ where: { id } });
    if (!calendar || calendar.userId !== userId) {
      throw new NotFoundException('Calendrier introuvable');
    }
    await this.prisma.calendar.delete({ where: { id } });
    return { id };
  }
}
