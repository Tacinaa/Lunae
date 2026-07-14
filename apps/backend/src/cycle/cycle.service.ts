import { Injectable } from '@nestjs/common';
import type { CycleEntry } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CycleAlgorithmService } from './cycle-algorithm.service.js';
import { decryptCycleNote, encryptCycleNote } from './cycle-encryption.util.js';
import type { CreateCycleDto } from './dto/create-cycle.dto.js';

@Injectable()
export class CycleService {
  constructor(
    private prisma: PrismaService,
    private algo: CycleAlgorithmService,
  ) {}

  async create(userId: string, dto: CreateCycleDto) {
    const entry = await this.prisma.cycleEntry.create({
      data: {
        userId,
        startDate: dto.startDate,
        cycleLength: dto.cycleLength,
        periodDuration: dto.periodDuration,
        notes: dto.notes ? encryptCycleNote(dto.notes) : dto.notes,
      },
    });

    const phases = this.algo.calculatePhases(
      dto.startDate,
      dto.cycleLength,
      dto.periodDuration,
    );

    await this.prisma.cyclePhase.createMany({
      data: phases.map((p) => ({
        userId,
        date: new Date(p.date),
        phase: p.phase,
        cycleDay: p.cycleDay,
      })),
      skipDuplicates: true,
    });

    return this.withDecryptedNotes(entry);
  }

  async findAll(userId: string) {
    const entries = await this.prisma.cycleEntry.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });
    return entries.map((entry) => this.withDecryptedNotes(entry));
  }

  private withDecryptedNotes(entry: CycleEntry): CycleEntry {
    return {
      ...entry,
      notes: entry.notes ? decryptCycleNote(entry.notes) : entry.notes,
    };
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
