import { Injectable, NotFoundException } from '@nestjs/common';
import type { Event } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { RecommendationAlgorithmService } from './recommendation-algorithm.service.js';

@Injectable()
export class RecommendationService {
  constructor(
    private prisma: PrismaService,
    private algo: RecommendationAlgorithmService,
  ) {}

  async generateForEvent(userId: string, event: Event): Promise<void> {
    // Repart toujours d'un état propre : une suggestion pending obsolète
    // (ancien horaire, ancienne catégorie, événement devenu non déplaçable)
    // ne doit pas rester affichable.
    await this.prisma.moveSuggestion.deleteMany({
      where: { eventId: event.id, status: 'pending' },
    });

    const currentPhase = await this.prisma.cyclePhase.findUnique({
      where: { userId_date: { userId, date: this.dateOnly(event.startAt) } },
    });

    if (!this.algo.shouldSuggestMove(event, currentPhase?.phase ?? null)) {
      return;
    }

    const rangeStart = this.dateOnly(event.startAt);
    const rangeEnd = this.addDays(rangeStart, this.algo.lookaheadDays);

    const [phases, existingEvents] = await Promise.all([
      this.prisma.cyclePhase.findMany({
        where: { userId, date: { gte: rangeStart, lte: rangeEnd } },
      }),
      this.prisma.event.findMany({
        where: {
          userId,
          startAt: { lte: rangeEnd },
          endAt: { gte: rangeStart },
        },
      }),
    ]);

    const candidates = this.algo.generateSuggestions(event, phases, existingEvents);
    if (candidates.length === 0) return;

    await this.prisma.moveSuggestion.createMany({
      data: candidates.map((c) => ({
        eventId: event.id,
        userId,
        suggestedStart: c.start,
        suggestedEnd: c.end,
        targetPhase: c.phase,
        score: c.score,
      })),
    });
  }

  findPending(userId: string) {
    return this.prisma.moveSuggestion.findMany({
      where: { userId, status: 'pending' },
      orderBy: [{ score: 'desc' }, { suggestedStart: 'asc' }],
      include: { event: true },
    });
  }

  async accept(userId: string, id: string) {
    const suggestion = await this.findOwned(userId, id);

    await this.prisma.event.update({
      where: { id: suggestion.eventId },
      data: {
        startAt: suggestion.suggestedStart,
        endAt: suggestion.suggestedEnd,
      },
    });

    return this.prisma.moveSuggestion.update({
      where: { id },
      data: { status: 'accepted' },
    });
  }

  async dismiss(userId: string, id: string) {
    await this.findOwned(userId, id);
    return this.prisma.moveSuggestion.update({
      where: { id },
      data: { status: 'dismissed' },
    });
  }

  private async findOwned(userId: string, id: string) {
    const suggestion = await this.prisma.moveSuggestion.findUnique({ where: { id } });
    if (!suggestion || suggestion.userId !== userId) {
      throw new NotFoundException('Suggestion introuvable');
    }
    return suggestion;
  }

  private dateOnly(date: Date): Date {
    const result = new Date(date);
    result.setUTCHours(0, 0, 0, 0);
    return result;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }
}
