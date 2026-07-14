import { EventType, Phase } from '@prisma/client';
import {
  RecommendationAlgorithmService,
  type PhaseEntry,
  type RecommendableEvent,
} from './recommendation-algorithm.service.js';

function startOfToday(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function makeEvent(
  overrides: Partial<RecommendableEvent> = {},
): RecommendableEvent {
  const startAt = overrides.startAt ?? addDays(startOfToday(), 1);
  return {
    id: 'evt-1',
    startAt,
    endAt: new Date(startAt.getTime() + 60 * 60 * 1000),
    isMovable: true,
    eventType: EventType.sport_intense,
    ...overrides,
  };
}

describe('RecommendationAlgorithmService', () => {
  let service: RecommendationAlgorithmService;

  beforeEach(() => {
    service = new RecommendationAlgorithmService();
  });

  describe('scoreForPhase()', () => {
    it('sport_intense — optimal en ovulation, déconseillé en menstruation', () => {
      expect(
        service.scoreForPhase(EventType.sport_intense, Phase.ovulation),
      ).toBe(3);
      expect(
        service.scoreForPhase(EventType.sport_intense, Phase.menstruation),
      ).toBe(0);
    });

    it('sport_leger — optimal en menstruation, contrairement au sport intense', () => {
      expect(
        service.scoreForPhase(EventType.sport_leger, Phase.menstruation),
      ).toBe(3);
      expect(
        service.scoreForPhase(EventType.sport_leger, Phase.ovulation),
      ).toBe(1);
    });

    it('focus_administratif — optimal en lutéale, pas en ovulation', () => {
      expect(
        service.scoreForPhase(EventType.focus_administratif, Phase.luteal),
      ).toBe(3);
      expect(
        service.scoreForPhase(EventType.focus_administratif, Phase.ovulation),
      ).toBe(1);
    });

    it('catégorie neutre (meeting) — retombe sur la table générique', () => {
      expect(service.scoreForPhase(EventType.meeting, Phase.ovulation)).toBe(3);
      expect(service.scoreForPhase(EventType.meeting, Phase.menstruation)).toBe(
        0,
      );
    });
  });

  describe('maxScore()', () => {
    it('sport_intense → 3 (atteint en ovulation)', () => {
      expect(service.maxScore(EventType.sport_intense)).toBe(3);
    });

    it('focus_administratif → 3 (atteint en lutéale, pas en ovulation)', () => {
      expect(service.maxScore(EventType.focus_administratif)).toBe(3);
    });
  });

  describe('shouldSuggestMove()', () => {
    it('isMovable=false → false, même en phase déconseillée', () => {
      const event = makeEvent({
        isMovable: false,
        eventType: EventType.sport_intense,
      });
      expect(service.shouldSuggestMove(event, Phase.menstruation)).toBe(false);
    });

    it('phase actuelle inconnue (null) → false', () => {
      const event = makeEvent({ eventType: EventType.sport_intense });
      expect(service.shouldSuggestMove(event, null)).toBe(false);
    });

    it('sport_intense en menstruation (score 0 < max 3) → true', () => {
      const event = makeEvent({ eventType: EventType.sport_intense });
      expect(service.shouldSuggestMove(event, Phase.menstruation)).toBe(true);
    });

    it('sport_intense déjà en ovulation (score = max) → false', () => {
      const event = makeEvent({ eventType: EventType.sport_intense });
      expect(service.shouldSuggestMove(event, Phase.ovulation)).toBe(false);
    });

    it('focus_administratif en ovulation (score 1 < max 3) → true, alors que ovulation est "généralement bonne"', () => {
      const event = makeEvent({ eventType: EventType.focus_administratif });
      expect(service.shouldSuggestMove(event, Phase.ovulation)).toBe(true);
    });
  });

  describe('generateSuggestions()', () => {
    it('trie les créneaux par score décroissant', () => {
      const today = startOfToday();
      const event = makeEvent({
        eventType: EventType.sport_intense,
        startAt: addDays(today, 1),
      });
      const phaseCalendar: PhaseEntry[] = [
        { date: addDays(today, 2), phase: Phase.luteal }, // score 1
        { date: addDays(today, 3), phase: Phase.ovulation }, // score 3
        { date: addDays(today, 4), phase: Phase.follicular }, // score 2
      ];

      const candidates = service.generateSuggestions(event, phaseCalendar, []);

      expect(candidates.map((c) => c.score)).toEqual([3, 2, 1]);
      expect(candidates[0].phase).toBe(Phase.ovulation);
    });

    it('exclut les créneaux déjà occupés par un autre événement', () => {
      const today = startOfToday();
      const event = makeEvent({
        eventType: EventType.sport_intense,
        startAt: addDays(today, 1),
      });
      const conflictDay = addDays(today, 3);
      const conflictStart = new Date(conflictDay);
      conflictStart.setUTCHours(event.startAt.getUTCHours(), 0, 0, 0);

      const phaseCalendar: PhaseEntry[] = [
        { date: conflictDay, phase: Phase.ovulation },
        { date: addDays(today, 4), phase: Phase.follicular },
      ];
      const existingEvents: RecommendableEvent[] = [
        makeEvent({
          id: 'evt-conflict',
          startAt: conflictStart,
          endAt: new Date(conflictStart.getTime() + 60 * 60 * 1000),
        }),
      ];

      const candidates = service.generateSuggestions(
        event,
        phaseCalendar,
        existingEvents,
      );

      expect(candidates).toHaveLength(1);
      expect(candidates[0].phase).toBe(Phase.follicular);
    });

    it("exclut les jours passés et le jour d'origine de l'événement", () => {
      const today = startOfToday();
      const event = makeEvent({
        eventType: EventType.sport_intense,
        startAt: addDays(today, 2),
      });
      const phaseCalendar: PhaseEntry[] = [
        { date: addDays(today, -1), phase: Phase.ovulation }, // passé
        { date: addDays(today, 2), phase: Phase.ovulation }, // jour d'origine
        { date: addDays(today, 5), phase: Phase.ovulation }, // valide
      ];

      const candidates = service.generateSuggestions(event, phaseCalendar, []);

      expect(candidates).toHaveLength(1);
      expect(candidates[0].start.getUTCDate()).toBe(
        addDays(today, 5).getUTCDate(),
      );
    });
  });
});
