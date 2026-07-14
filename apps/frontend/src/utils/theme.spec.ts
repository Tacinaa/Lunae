import { getPhaseColor, getPhaseSegmentCount, hexToRgba, phaseColors, phaseSegmentCount } from './theme';

describe('getPhaseColor()', () => {
  it.each(Object.entries(phaseColors))('%s → %s', (phase, color) => {
    expect(getPhaseColor(phase as keyof typeof phaseColors)).toBe(color);
  });
});

describe('getPhaseSegmentCount()', () => {
  it.each(Object.entries(phaseSegmentCount))('%s → %i segment(s)', (phase, count) => {
    expect(getPhaseSegmentCount(phase as keyof typeof phaseSegmentCount)).toBe(count);
  });
});

describe('hexToRgba()', () => {
  it('convertit un hex en rgba avec l’alpha demandé', () => {
    expect(hexToRgba('#6B3FA0', 0.15)).toBe('rgba(107, 63, 160, 0.15)');
  });
});
