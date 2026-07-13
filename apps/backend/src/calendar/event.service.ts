import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RecommendationService } from '../recommendation/recommendation.service.js';
import type { CreateEventDto } from './dto/create-event.dto.js';
import type { UpdateEventDto } from './dto/update-event.dto.js';

@Injectable()
export class EventService {
  constructor(
    private prisma: PrismaService,
    private recommendations: RecommendationService,
  ) {}

  async findInRange(userId: string, from: Date, to: Date) {
    const events = await this.prisma.event.findMany({
      where: { userId, startAt: { lte: to }, endAt: { gte: from } },
      orderBy: { startAt: 'asc' },
      include: { calendar: true },
    });

    const phases = await this.prisma.cyclePhase.findMany({
      where: {
        userId,
        date: { gte: this.dateOnly(from), lte: this.dateOnly(to) },
      },
    });
    const phaseByDate = new Map(phases.map((p) => [this.dateKey(p.date), p]));

    return events.map((event) => ({
      ...event,
      phase: phaseByDate.get(this.dateKey(event.startAt)) ?? null,
    }));
  }

  async findOne(userId: string, id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { calendar: true },
    });
    if (!event || event.userId !== userId) {
      throw new NotFoundException('Événement introuvable');
    }
    return event;
  }

  async create(userId: string, dto: CreateEventDto) {
    const event = await this.prisma.event.create({ data: { userId, ...dto } });
    await this.recommendations.generateForEvent(userId, event);
    return event;
  }

  async update(userId: string, id: string, dto: UpdateEventDto) {
    await this.findOne(userId, id);
    const event = await this.prisma.event.update({ where: { id }, data: dto });
    await this.recommendations.generateForEvent(userId, event);
    return event;
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.event.delete({ where: { id } });
    return { id };
  }

  search(userId: string, query: string) {
    return this.prisma.event.findMany({
      where: { userId, title: { contains: query, mode: 'insensitive' } },
      orderBy: { startAt: 'asc' },
      include: { calendar: true },
    });
  }

  private dateOnly(date: Date): Date {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  private dateKey(date: Date): string {
    return this.dateOnly(date).toISOString().split('T')[0];
  }
}
