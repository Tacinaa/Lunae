import { Injectable } from '@nestjs/common';
import { EventType, Phase } from '@prisma/client';

export interface RecommendableEvent {
  id: string;
  startAt: Date;
  endAt: Date;
  isMovable: boolean;
  eventType: EventType;
}

export interface PhaseEntry {
  date: Date;
  phase: Phase;
}

export interface ScoredCandidate {
  start: Date;
  end: Date;
  phase: Phase;
  score: number;
}

const LOOKAHEAD_DAYS = 56;

/**
 * Score générique par phase, repris du CLAUDE.md — sert de repli pour les
 * catégories neutres (meeting/class/personal/other) qui n'ont pas d'affinité
 * de phase particulière selon la littérature.
 */
const GENERIC_PHASE_SCORES: Record<Phase, number> = {
  menstruation: 0,
  follicular: 2,
  ovulation: 3,
  luteal: 1,
};

/**
 * Tables de score par catégorie, basées sur des repères généraux (non
 * cliniques) sur l'évolution de l'énergie et de la cognition au cours du
 * cycle. À terme, ces tables seront remplacées/pondérées par un scoring
 * personnalisé basé sur les symptômes déclarés (backlog post-MVP).
 */
const CATEGORY_PHASE_SCORES: Partial<Record<EventType, Record<Phase, number>>> = {
  sport_intense: { menstruation: 0, follicular: 2, ovulation: 3, luteal: 1 },
  sport_leger: { menstruation: 3, follicular: 1, ovulation: 1, luteal: 2 },
  focus_administratif: { menstruation: 1, follicular: 2, ovulation: 1, luteal: 3 },
  creation_planification: { menstruation: 1, follicular: 3, ovulation: 2, luteal: 1 },
  social_enjeu: { menstruation: 0, follicular: 2, ovulation: 3, luteal: 1 },
};

@Injectable()
export class RecommendationAlgorithmService {
  scoreForPhase(eventType: EventType, phase: Phase): number {
    const table = CATEGORY_PHASE_SCORES[eventType] ?? GENERIC_PHASE_SCORES;
    return table[phase];
  }

  maxScore(eventType: EventType): number {
    const table = CATEGORY_PHASE_SCORES[eventType] ?? GENERIC_PHASE_SCORES;
    return Math.max(...Object.values(table));
  }

  shouldSuggestMove(event: RecommendableEvent, currentPhase: Phase | null): boolean {
    if (!event.isMovable || !currentPhase) return false;
    return this.scoreForPhase(event.eventType, currentPhase) < this.maxScore(event.eventType);
  }

  generateSuggestions(
    event: RecommendableEvent,
    phaseCalendar: PhaseEntry[],
    existingEvents: RecommendableEvent[],
  ): ScoredCandidate[] {
    const durationMs = event.endAt.getTime() - event.startAt.getTime();
    const today = this.startOfDay(new Date());
    const originalDay = this.startOfDay(event.startAt);

    const candidates: ScoredCandidate[] = [];

    for (const entry of phaseCalendar) {
      const day = this.startOfDay(entry.date);
      if (day < today || day.getTime() === originalDay.getTime()) continue;

      const start = new Date(day);
      start.setUTCHours(
        event.startAt.getUTCHours(),
        event.startAt.getUTCMinutes(),
        0,
        0,
      );
      const end = new Date(start.getTime() + durationMs);

      const hasConflict = existingEvents.some(
        (other) =>
          other.id !== event.id && other.startAt < end && other.endAt > start,
      );
      if (hasConflict) continue;

      candidates.push({
        start,
        end,
        phase: entry.phase,
        score: this.scoreForPhase(event.eventType, entry.phase),
      });
    }

    return candidates.sort(
      (a, b) => b.score - a.score || a.start.getTime() - b.start.getTime(),
    );
  }

  get lookaheadDays(): number {
    return LOOKAHEAD_DAYS;
  }

  private startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setUTCHours(0, 0, 0, 0);
    return result;
  }
}
