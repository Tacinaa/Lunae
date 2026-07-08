import { Phase } from '@prisma/client';
import { CycleAlgorithmService } from './cycle-algorithm.service.js';

describe('CycleAlgorithmService', () => {
  let service: CycleAlgorithmService;
  const J0 = new Date('2026-01-01');

  beforeEach(() => {
    service = new CycleAlgorithmService();
  });

  describe('calculatePhases()', () => {
    it('cycle 28j règles 5j → phases correctes (5+8+3+12)', () => {
      const phases = service.calculatePhases(J0, 28, 5);
      expect(phases).toHaveLength(28);

      const counts = phases.reduce(
        (acc, p) => { acc[p.phase] = (acc[p.phase] ?? 0) + 1; return acc; },
        {} as Record<Phase, number>,
      );
      expect(counts[Phase.menstruation]).toBe(5);
      expect(counts[Phase.follicular]).toBe(8);
      expect(counts[Phase.ovulation]).toBe(3);
      expect(counts[Phase.luteal]).toBe(12);
    });

    it('cycle 21j → phases ajustées (ovulation = J7)', () => {
      const phases = service.calculatePhases(J0, 21, 5);
      expect(phases).toHaveLength(21);
      expect(phases[0].phase).toBe(Phase.menstruation);
      expect(phases[5].phase).toBe(Phase.follicular);
    });

    it('cycle 35j → phases ajustées', () => {
      const phases = service.calculatePhases(J0, 35, 5);
      expect(phases).toHaveLength(35);
      const ovulationDay = 35 - 14;
      expect(phases[ovulationDay].phase).toBe(Phase.ovulation);
    });

    it('cycleDay commence à 1', () => {
      const phases = service.calculatePhases(J0, 28, 5);
      expect(phases[0].cycleDay).toBe(1);
      expect(phases[27].cycleDay).toBe(28);
    });
  });

  describe('getPhaseForDate()', () => {
    const cycle = { startDate: J0, cycleLength: 28, periodDuration: 5 };

    it('date en menstruation → menstruation', () => {
      const date = new Date('2026-01-03');
      expect(service.getPhaseForDate(date, [cycle])).toBe(Phase.menstruation);
    });

    it('date hors du cycle prédit → null', () => {
      const date = new Date('2026-02-10');
      expect(service.getPhaseForDate(date, [cycle])).toBeNull();
    });

    it('date en ovulation → ovulation', () => {
      const date = new Date('2026-01-15');
      expect(service.getPhaseForDate(date, [cycle])).toBe(Phase.ovulation);
    });
  });

  describe('predictNextPeriod()', () => {
    it('0 cycle en historique → utilise la valeur par défaut', () => {
      const before = Date.now();
      const next = service.predictNextPeriod([], 28);
      const after = Date.now();
      const diffMin = (next.getTime() - after) / 86_400_000;
      const diffMax = (next.getTime() - before) / 86_400_000;
      expect(diffMin).toBeGreaterThanOrEqual(27.9);
      expect(diffMax).toBeLessThanOrEqual(28.1);
    });

    it('1 cycle → utilise la longueur de ce cycle', () => {
      const next = service.predictNextPeriod([{ startDate: J0, cycleLength: 30 }]);
      const expected = new Date('2026-01-31');
      expect(next.toISOString().split('T')[0]).toBe(expected.toISOString().split('T')[0]);
    });

    it('3 cycles → utilise la moyenne', () => {
      const history = [
        { startDate: new Date('2025-10-01'), cycleLength: 28 },
        { startDate: new Date('2025-10-29'), cycleLength: 30 },
        { startDate: new Date('2025-11-28'), cycleLength: 26 },
      ];
      const next = service.predictNextPeriod(history);
      const expected = new Date('2025-12-26');
      expect(next.toISOString().split('T')[0]).toBe(expected.toISOString().split('T')[0]);
    });
  });
});
