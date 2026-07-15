import { dateKeysInRange, getMonthMatrix, isSameDay, toDateKey } from './calendarGrid';

describe('getMonthMatrix()', () => {
  it('retourne 6 semaines de 7 jours', () => {
    const weeks = getMonthMatrix(2026, 6);
    expect(weeks).toHaveLength(6);
    weeks.forEach((week) => expect(week).toHaveLength(7));
  });

  it('chaque semaine commence un lundi', () => {
    const weeks = getMonthMatrix(2026, 6);
    weeks.forEach((week) => expect(week[0].getUTCDay()).toBe(1));
  });

  it('la grille couvre le 1er et le dernier jour du mois', () => {
    const weeks = getMonthMatrix(2026, 6);
    const days = weeks.flat().map(toDateKey);
    expect(days).toContain('2026-07-01');
    expect(days).toContain('2026-07-31');
  });
});

describe('isSameDay()', () => {
  it('deux dates du même jour → true', () => {
    expect(isSameDay(new Date('2026-07-13T08:00:00Z'), new Date('2026-07-13T22:00:00Z'))).toBe(
      true,
    );
  });

  it('deux dates de jours différents → false', () => {
    expect(isSameDay(new Date('2026-07-13T08:00:00Z'), new Date('2026-07-14T08:00:00Z'))).toBe(
      false,
    );
  });
});

describe('dateKeysInRange()', () => {
  it('événement horodaté mono-jour → une seule clé', () => {
    const keys = dateKeysInRange(
      new Date('2026-07-13T10:00:00Z'),
      new Date('2026-07-13T11:00:00Z'),
      false,
    );
    expect(keys).toEqual(['2026-07-13']);
  });

  it('événement journée entière multi-jours (fin exclusive) → une clé par jour, sans le jour de fin', () => {
    const keys = dateKeysInRange(new Date('2026-07-01'), new Date('2026-07-04'), true);
    expect(keys).toEqual(['2026-07-01', '2026-07-02', '2026-07-03']);
  });

  it('événement journée entière mono-jour (fin exclusive) → une seule clé', () => {
    const keys = dateKeysInRange(new Date('2026-07-01'), new Date('2026-07-02'), true);
    expect(keys).toEqual(['2026-07-01']);
  });

  it('événement horodaté chevauchant minuit (fin incluse) → deux clés', () => {
    const keys = dateKeysInRange(
      new Date('2026-07-13T23:00:00Z'),
      new Date('2026-07-14T01:00:00Z'),
      false,
    );
    expect(keys).toEqual(['2026-07-13', '2026-07-14']);
  });

  it('plage dégénérée (début = fin, fin exclusive) → repli sur le jour de début', () => {
    const keys = dateKeysInRange(new Date('2026-07-01'), new Date('2026-07-01'), true);
    expect(keys).toEqual(['2026-07-01']);
  });
});
