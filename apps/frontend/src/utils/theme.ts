export const colors = {
  primary: '#6B3FA0',
  background: '#FFFFFF',
  text: '#1A1A1A',
  textMuted: '#6B6B75',
  border: '#E4DFEC',
  danger: '#C0392B',
};

export const phaseColors = {
  menstruation: '#491D5D',
  follicular: '#8361D1',
  ovulation: '#E1378C',
  luteal: '#A63FA6',
} as const;

export function getPhaseColor(phase: keyof typeof phaseColors): string {
  return phaseColors[phase];
}

/**
 * Repère visuel non-couleur pour distinguer les phases (WCAG 1.4.1) : le nombre de segments
 * correspond à la position de la phase dans le cycle plutôt qu'à un pointillé (`borderStyle:
 * 'dashed'` a un rendu incohérent sur Android).
 */
export const phaseSegmentCount = {
  menstruation: 1,
  follicular: 2,
  ovulation: 3,
  luteal: 4,
} as const;

export function getPhaseSegmentCount(phase: keyof typeof phaseSegmentCount): number {
  return phaseSegmentCount[phase];
}

export function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
