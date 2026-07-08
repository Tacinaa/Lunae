import { Injectable } from '@nestjs/common';
import { Phase } from '../../generated/prisma/enums.js';

export interface PhaseEntry {
  date: string;
  phase: Phase;
  cycleDay: number;
}

export interface CycleInput {
  startDate: Date;
  cycleLength: number;
  periodDuration: number;
}

@Injectable()
export class CycleAlgorithmService {
  calculatePhases(startDate: Date, cycleLength: number, periodDuration: number): PhaseEntry[] {
    const ovulationDay = cycleLength - 14;
    const entries: PhaseEntry[] = [];

    for (let day = 0; day < cycleLength; day++) {
      const date = this.addDays(startDate, day);
      entries.push({
        date: this.toDateString(date),
        phase: this.phaseForDay(day, periodDuration, ovulationDay),
        cycleDay: day + 1,
      });
    }

    return entries;
  }

  getPhaseForDate(date: Date, cycles: CycleInput[]): Phase | null {
    const sorted = [...cycles].sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    const relevant = sorted.find((c) => c.startDate <= date);
    if (!relevant) return null;

    const day = this.diffInDays(relevant.startDate, date);
    if (day >= relevant.cycleLength) return null;

    const ovulationDay = relevant.cycleLength - 14;
    return this.phaseForDay(day, relevant.periodDuration, ovulationDay);
  }

  predictNextPeriod(history: { startDate: Date; cycleLength: number }[], defaultLength = 28): Date {
    const avgLength =
      history.length > 0
        ? Math.round(history.reduce((s, c) => s + c.cycleLength, 0) / history.length)
        : defaultLength;

    const lastStart = history.length > 0 ? history[history.length - 1].startDate : new Date();
    return this.addDays(lastStart, avgLength);
  }

  private phaseForDay(day: number, periodDuration: number, ovulationDay: number): Phase {
    if (day < periodDuration) return Phase.menstruation;
    if (day < ovulationDay - 1) return Phase.follicular;
    if (day <= ovulationDay + 1) return Phase.ovulation;
    return Phase.luteal;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }

  private diffInDays(from: Date, to: Date): number {
    return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
  }

  private toDateString(date: Date): string {
    return date.toISOString().split('T')[0]!;
  }
}
