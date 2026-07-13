import type { EventType } from '../api/calendar';
import type { Phase } from '../store/cycleStore';

export const PHASE_LABELS: Record<Phase, string> = {
  menstruation: 'menstruelle',
  follicular: 'folliculaire',
  ovulation: 'ovulatoire',
  luteal: 'lutéale',
};

export interface CategoryOption {
  value: EventType;
  label: string;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'sport_intense', label: 'Sport intense' },
  { value: 'sport_leger', label: 'Sport doux' },
  { value: 'focus_administratif', label: 'Concentration' },
  { value: 'creation_planification', label: 'Création' },
  { value: 'social_enjeu', label: 'Social' },
  { value: 'other', label: 'Autre' },
];

export const CATEGORY_LABELS: Record<EventType, string> = {
  meeting: 'réunion',
  class: 'cours',
  sport_intense: 'sport intense',
  sport_leger: 'sport doux',
  focus_administratif: 'travail de concentration',
  creation_planification: 'création/planification',
  social_enjeu: 'événement social à enjeu',
  personal: 'personnel',
  other: 'autre',
};

/**
 * Score générique par phase (CLAUDE.md) — repli pour les catégories neutres
 * (meeting/class/personal/other) sans affinité de phase particulière.
 * Doit rester synchronisé avec `recommendation-algorithm.service.ts` (backend).
 */
const GENERIC_PHASE_SCORES: Record<Phase, number> = {
  menstruation: 0,
  follicular: 2,
  ovulation: 3,
  luteal: 1,
};

/**
 * Tables de score par catégorie. Doit rester synchronisé avec
 * `recommendation-algorithm.service.ts` (backend) — dupliqué côté client pour
 * éviter un aller-retour réseau pour une table statique.
 */
const CATEGORY_PHASE_SCORES: Partial<Record<EventType, Record<Phase, number>>> = {
  sport_intense: { menstruation: 0, follicular: 2, ovulation: 3, luteal: 1 },
  sport_leger: { menstruation: 3, follicular: 1, ovulation: 1, luteal: 2 },
  focus_administratif: { menstruation: 1, follicular: 2, ovulation: 1, luteal: 3 },
  creation_planification: { menstruation: 1, follicular: 3, ovulation: 2, luteal: 1 },
  social_enjeu: { menstruation: 0, follicular: 2, ovulation: 3, luteal: 1 },
};

export function scoreForPhase(eventType: EventType, phase: Phase): number {
  const table = CATEGORY_PHASE_SCORES[eventType] ?? GENERIC_PHASE_SCORES;
  return table[phase];
}

export function maxScoreForCategory(eventType: EventType): number {
  const table = CATEGORY_PHASE_SCORES[eventType] ?? GENERIC_PHASE_SCORES;
  return Math.max(...Object.values(table));
}

/** Vrai si la phase est la meilleure phase possible pour cette catégorie (score = max). */
export function isOptimalPhase(eventType: EventType, phase: Phase | null | undefined): boolean {
  return phase != null && scoreForPhase(eventType, phase) === maxScoreForCategory(eventType);
}

/** Vrai si l'événement gagnerait à être déplacé (phase actuelle non optimale pour sa catégorie). */
export function isUnfavorablePhase(eventType: EventType, phase: Phase | null | undefined): boolean {
  return phase != null && scoreForPhase(eventType, phase) < maxScoreForCategory(eventType);
}
