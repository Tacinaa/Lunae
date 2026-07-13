import type { Phase } from '../store/cycleStore';

export const FAVORABLE_PHASES: Phase[] = ['follicular', 'ovulation'];
export const UNFAVORABLE_PHASES: Phase[] = ['menstruation', 'luteal'];

export const PHASE_LABELS: Record<Phase, string> = {
  menstruation: 'menstruelle',
  follicular: 'folliculaire',
  ovulation: 'ovulatoire',
  luteal: 'lutéale',
};

export function isFavorablePhase(phase: Phase | null | undefined): boolean {
  return phase != null && FAVORABLE_PHASES.includes(phase);
}

export function isUnfavorablePhase(phase: Phase | null | undefined): boolean {
  return phase != null && UNFAVORABLE_PHASES.includes(phase);
}
