import { mapGoogleEventToEventInput } from './google-calendar-event-mapper.js';

describe('mapGoogleEventToEventInput', () => {
  const ctx = { calendarId: 'calendar-1', userId: 'user-1' };

  it('mappe un événement horodaté en isAllDay: false', () => {
    const result = mapGoogleEventToEventInput(
      {
        id: 'evt-1',
        summary: 'Rendez-vous',
        start: { dateTime: '2026-08-01T10:00:00+02:00' },
        end: { dateTime: '2026-08-01T11:00:00+02:00' },
      },
      ctx,
    );
    expect(result).not.toBeNull();
    expect(result!.isAllDay).toBe(false);
    expect(result!.startAt).toEqual(new Date('2026-08-01T10:00:00+02:00'));
    expect(result!.endAt).toEqual(new Date('2026-08-01T11:00:00+02:00'));
  });

  it('mappe un événement journée entière mono-jour en isAllDay: true', () => {
    const result = mapGoogleEventToEventInput(
      {
        id: 'evt-2',
        summary: 'Anniversaire',
        start: { date: '2026-08-01' },
        end: { date: '2026-08-02' },
      },
      ctx,
    );
    expect(result).not.toBeNull();
    expect(result!.isAllDay).toBe(true);
    expect(result!.startAt).toEqual(new Date('2026-08-01'));
    expect(result!.endAt).toEqual(new Date('2026-08-02'));
  });

  it('mappe un événement journée entière multi-jours tel quel (end exclusif Google)', () => {
    const result = mapGoogleEventToEventInput(
      {
        id: 'evt-3',
        summary: 'Vacances',
        start: { date: '2026-08-01' },
        end: { date: '2026-08-04' },
      },
      ctx,
    );
    expect(result!.startAt).toEqual(new Date('2026-08-01'));
    expect(result!.endAt).toEqual(new Date('2026-08-04'));
  });

  it('utilise startAt comme endAt si end est manquant', () => {
    const result = mapGoogleEventToEventInput(
      {
        id: 'evt-4',
        summary: 'Sans fin',
        start: { dateTime: '2026-08-01T10:00:00Z' },
      },
      ctx,
    );
    expect(result!.startAt).toEqual(result!.endAt);
  });

  it('retourne null si start est manquant', () => {
    const result = mapGoogleEventToEventInput(
      { id: 'evt-5', summary: 'Sans début' },
      ctx,
    );
    expect(result).toBeNull();
  });

  it('utilise "Sans titre" si summary est vide ou absent', () => {
    const result = mapGoogleEventToEventInput(
      { id: 'evt-6', start: { dateTime: '2026-08-01T10:00:00Z' } },
      ctx,
    );
    expect(result!.title).toBe('Sans titre');
  });

  it('tronque le titre à 200 caractères', () => {
    const longTitle = 'a'.repeat(250);
    const result = mapGoogleEventToEventInput(
      {
        id: 'evt-7',
        summary: longTitle,
        start: { dateTime: '2026-08-01T10:00:00Z' },
      },
      ctx,
    );
    expect(result!.title).toHaveLength(200);
  });

  it('retourne null pour un événement annulé', () => {
    const result = mapGoogleEventToEventInput(
      {
        id: 'evt-8',
        status: 'cancelled',
        summary: 'Annulé',
        start: { dateTime: '2026-08-01T10:00:00Z' },
      },
      ctx,
    );
    expect(result).toBeNull();
  });

  it('retourne null si id est manquant (pas de dédup possible)', () => {
    const result = mapGoogleEventToEventInput(
      { summary: 'Sans id', start: { dateTime: '2026-08-01T10:00:00Z' } },
      ctx,
    );
    expect(result).toBeNull();
  });

  it('mappe deux instances récurrentes vers deux externalId distincts', () => {
    const instance1 = mapGoogleEventToEventInput(
      {
        id: 'evt-9_20260801T100000Z',
        summary: 'Cours hebdo',
        start: { dateTime: '2026-08-01T10:00:00Z' },
      },
      ctx,
    );
    const instance2 = mapGoogleEventToEventInput(
      {
        id: 'evt-9_20260808T100000Z',
        summary: 'Cours hebdo',
        start: { dateTime: '2026-08-08T10:00:00Z' },
      },
      ctx,
    );
    expect(instance1!.externalId).not.toBe(instance2!.externalId);
  });

  it('force toujours isMovable: false et eventType: "other"', () => {
    const result = mapGoogleEventToEventInput(
      {
        id: 'evt-10',
        summary: 'Test',
        start: { dateTime: '2026-08-01T10:00:00Z' },
      },
      ctx,
    );
    expect(result!.isMovable).toBe(false);
    expect(result!.eventType).toBe('other');
  });

  it('mappe location et notes depuis location/description, null si absents', () => {
    const withValues = mapGoogleEventToEventInput(
      {
        id: 'evt-11',
        summary: 'Test',
        location: 'Paris',
        description: 'Notes',
        start: { dateTime: '2026-08-01T10:00:00Z' },
      },
      ctx,
    );
    expect(withValues!.location).toBe('Paris');
    expect(withValues!.notes).toBe('Notes');

    const withoutValues = mapGoogleEventToEventInput(
      {
        id: 'evt-12',
        summary: 'Test',
        start: { dateTime: '2026-08-01T10:00:00Z' },
      },
      ctx,
    );
    expect(withoutValues!.location).toBeNull();
    expect(withoutValues!.notes).toBeNull();
  });

  it('associe calendarId et userId depuis le contexte', () => {
    const result = mapGoogleEventToEventInput(
      {
        id: 'evt-13',
        summary: 'Test',
        start: { dateTime: '2026-08-01T10:00:00Z' },
      },
      ctx,
    );
    expect(result!.calendarId).toBe(ctx.calendarId);
    expect(result!.userId).toBe(ctx.userId);
  });
});
