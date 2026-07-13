import { isFavorablePhase, isUnfavorablePhase } from './phaseRecommendation';

describe('isFavorablePhase()', () => {
  it.each(['follicular', 'ovulation'] as const)('%s → true', (phase) => {
    expect(isFavorablePhase(phase)).toBe(true);
  });

  it.each(['menstruation', 'luteal', null, undefined] as const)('%s → false', (phase) => {
    expect(isFavorablePhase(phase)).toBe(false);
  });
});

describe('isUnfavorablePhase()', () => {
  it.each(['menstruation', 'luteal'] as const)('%s → true', (phase) => {
    expect(isUnfavorablePhase(phase)).toBe(true);
  });

  it.each(['follicular', 'ovulation', null, undefined] as const)('%s → false', (phase) => {
    expect(isUnfavorablePhase(phase)).toBe(false);
  });
});
