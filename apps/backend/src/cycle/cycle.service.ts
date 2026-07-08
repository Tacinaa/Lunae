import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CycleAlgorithmService } from './cycle-algorithm.service.js';
import type { CreateCycleDto } from './dto/create-cycle.dto.js';

@Injectable()
export class CycleService {
  constructor(
    private prisma: PrismaService,
    private algo: CycleAlgorithmService,
  ) {}

  async create(userId: string, dto: CreateCycleDto) {
    const entry = await this.prisma.cycleEntry.create({
      data: { userId, ...dto },
    });

    const phases = this.algo.calculatePhases(dto.startDate, dto.cycleLength, dto.periodDuration);

    await this.prisma.cyclePhase.createMany({
      data: phases.map((p) => ({
        userId,
        date: new Date(p.date),
        phase: p.phase,
        cycleDay: p.cycleDay,
      })),
      skipDuplicates: true,
    });

    return entry;
  }

  async findAll(userId: string) {
    return this.prisma.cycleEntry.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });
  }

  async getCurrentPhase(userId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const phase = await this.prisma.cyclePhase.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    return phase ?? null;
  }

  async getPhasesInRange(userId: string, from: Date, to: Date) {
    return this.prisma.cyclePhase.findMany({
      where: { userId, date: { gte: from, lte: to } },
      orderBy: { date: 'asc' },
    });
  }

  async getPrediction(userId: string) {
    const history = await this.prisma.cycleEntry.findMany({
      where: { userId },
      orderBy: { startDate: 'asc' },
      select: { startDate: true, cycleLength: true },
    });

    const nextDate = this.algo.predictNextPeriod(history);
    return { predictedNextPeriod: nextDate.toISOString().split('T')[0] };
  }
}
