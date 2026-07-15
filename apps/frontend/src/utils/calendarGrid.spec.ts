import {
  dateKeysInRange,
  getMonthMatrix,
  isSameDay,
  layoutWeekBanners,
  toDateKey,
} from './calendarGrid';

const WEEK = [
  new Date('2026-07-13'),
  new Date('2026-07-14'),
  new Date('2026-07-15'),
  new Date('2026-07-16'),
  new Date('2026-07-17'),
  new Date('2026-07-18'),
  new Date('2026-07-19'),
];

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

describe('layoutWeekBanners()', () => {
  it('ignore les événements mono-jour', () => {
    const banners = layoutWeekBanners(WEEK, [
      { id: '1', startAt: '2026-07-14T10:00:00Z', endAt: '2026-07-14T11:00:00Z', isAllDay: false },
    ]);
    expect(banners).toEqual([]);
  });

  it('positionne un événement multi-jours entièrement dans la semaine', () => {
    const banners = layoutWeekBanners(WEEK, [
      { id: '1', startAt: '2026-07-14', endAt: '2026-07-17', isAllDay: true },
    ]);
    expect(banners).toEqual([{ event: expect.objectContaining({ id: '1' }), row: 0, startCol: 1, span: 3 }]);
  });

  it('découpe un événement qui déborde avant/après la semaine', () => {
    const banners = layoutWeekBanners(WEEK, [
      { id: '1', startAt: '2026-07-10', endAt: '2026-07-22', isAllDay: true },
    ]);
    expect(banners).toEqual([{ event: expect.objectContaining({ id: '1' }), row: 0, startCol: 0, span: 7 }]);
  });

  it('empile sur des lignes distinctes deux événements qui se chevauchent', () => {
    const banners = layoutWeekBanners(WEEK, [
      { id: 'a', startAt: '2026-07-13', endAt: '2026-07-16', isAllDay: true },
      { id: 'b', startAt: '2026-07-14', endAt: '2026-07-18', isAllDay: true },
    ]);
    expect(banners.find((b) => b.event.id === 'a')?.row).toBe(0);
    expect(banners.find((b) => b.event.id === 'b')?.row).toBe(1);
  });

  it("réutilise la même ligne pour deux événements qui ne se chevauchent pas dans le temps", () => {
    const banners = layoutWeekBanners(WEEK, [
      { id: 'a', startAt: '2026-07-13', endAt: '2026-07-15', isAllDay: true },
      { id: 'b', startAt: '2026-07-16', endAt: '2026-07-19', isAllDay: true },
    ]);
    expect(banners.find((b) => b.event.id === 'a')?.row).toBe(0);
    expect(banners.find((b) => b.event.id === 'b')?.row).toBe(0);
  });
});
