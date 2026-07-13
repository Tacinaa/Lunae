export const colors = {
  primary: '#6B3FA0',
  background: '#FFFFFF',
  text: '#1A1A1A',
  textMuted: '#6B6B75',
  border: '#E4DFEC',
  danger: '#C0392B',
};

export const phaseColors = {
  menstruation: '#E05A7E',
  follicular: '#26C485',
  ovulation: '#3A9CFF',
  luteal: '#E87325',
} as const;

export function getPhaseColor(phase: keyof typeof phaseColors): string {
  return phaseColors[phase];
}

export function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
