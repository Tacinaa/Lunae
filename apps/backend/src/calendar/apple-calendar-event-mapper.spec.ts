import type { VEvent } from 'node-ical';
import { mapAppleEventToEventInput } from './apple-calendar-event-mapper.js';

function vevent(partial: Partial<VEvent>): VEvent {
  return partial as VEvent;
}

describe('mapAppleEventToEventInput', () => {
  const ctx = { calendarId: 'calendar-1', userId: 'user-1' };

  it('mappe un événement horodaté en isAllDay: false', () => {
    const result = mapAppleEventToEventInput(
      vevent({
        uid: 'evt-1',
        summary: 'Rendez-vous',
        datetype: 'date-time',
        start: new Date('2026-08-01T10:00:00Z'),
        end: new Date('2026-08-01T11:00:00Z'),
      }),
      ctx,
    );
    expect(result).not.toBeNull();
    expect(result!.isAllDay).toBe(false);
    expect(result!.startAt).toEqual(new Date('2026-08-01T10:00:00Z'));
    expect(result!.endAt).toEqual(new Date('2026-08-01T11:00:00Z'));
  });

  it('mappe un événement journée entière multi-jours en isAllDay: true', () => {
    const result = mapAppleEventToEventInput(
      vevent({
        uid: 'evt-2',
        summary: 'Vacances',
        datetype: 'date',
        start: new Date('2026-08-01'),
        end: new Date('2026-08-04'),
      }),
      ctx,
    );
    expect(result!.isAllDay).toBe(true);
    expect(result!.startAt).toEqual(new Date('2026-08-01'));
    expect(result!.endAt).toEqual(new Date('2026-08-04'));
  });

  it('utilise startAt comme endAt si end est manquant', () => {
    const result = mapAppleEventToEventInput(
      vevent({
        uid: 'evt-3',
        summary: 'Sans fin',
        datetype: 'date-time',
        start: new Date('2026-08-01T10:00:00Z'),
      }),
      ctx,
    );
    expect(result!.startAt).toEqual(result!.endAt);
  });

  it('retourne null si start est manquant', () => {
    const result = mapAppleEventToEventInput(
      vevent({ uid: 'evt-4', summary: 'Sans début' }),
      ctx,
    );
    expect(result).toBeNull();
  });

  it('utilise "Sans titre" si summary est vide ou absent', () => {
    const result = mapAppleEventToEventInput(
      vevent({
        uid: 'evt-5',
        datetype: 'date-time',
        start: new Date('2026-08-01T10:00:00Z'),
      }),
      ctx,
    );
    expect(result!.title).toBe('Sans titre');
  });

  it('extrait la valeur texte quand summary/location/description portent des paramètres iCalendar', () => {
    const result = mapAppleEventToEventInput(
      vevent({
        uid: 'evt-6',
        datetype: 'date-time',
        start: new Date('2026-08-01T10:00:00Z'),
        summary: { val: 'Réunion', params: { LANGUAGE: 'fr' } },
        location: { val: 'Paris', params: {} },
        description: { val: 'Notes', params: {} },
      }),
      ctx,
    );
    expect(result!.title).toBe('Réunion');
    expect(result!.location).toBe('Paris');
    expect(result!.notes).toBe('Notes');
  });

  it('tronque le titre à 200 caractères', () => {
    const longTitle = 'a'.repeat(250);
    const result = mapAppleEventToEventInput(
      vevent({
        uid: 'evt-7',
        summary: longTitle,
        datetype: 'date-time',
        start: new Date('2026-08-01T10:00:00Z'),
      }),
      ctx,
    );
    expect(result!.title).toHaveLength(200);
  });

  it('retourne null pour un événement annulé', () => {
    const result = mapAppleEventToEventInput(
      vevent({
        uid: 'evt-8',
        status: 'CANCELLED',
        summary: 'Annulé',
        datetype: 'date-time',
        start: new Date('2026-08-01T10:00:00Z'),
      }),
      ctx,
    );
    expect(result).toBeNull();
  });

  it('retourne null si uid est manquant (pas de dédup possible)', () => {
    const result = mapAppleEventToEventInput(
      vevent({
        summary: 'Sans uid',
        datetype: 'date-time',
        start: new Date('2026-08-01T10:00:00Z'),
      }),
      ctx,
    );
    expect(result).toBeNull();
  });

  it("retourne null pour un événement récurrent (pas d'expansion RRULE)", () => {
    const result = mapAppleEventToEventInput(
      vevent({
        uid: 'evt-9',
        summary: 'Cours hebdo',
        datetype: 'date-time',
        start: new Date('2026-08-01T10:00:00Z'),
        rrule: { toString: () => 'FREQ=WEEKLY' } as VEvent['rrule'],
      }),
      ctx,
    );
    expect(result).toBeNull();
  });

  it('force toujours isMovable: false et eventType: "other"', () => {
    const result = mapAppleEventToEventInput(
      vevent({
        uid: 'evt-10',
        summary: 'Test',
        datetype: 'date-time',
        start: new Date('2026-08-01T10:00:00Z'),
      }),
      ctx,
    );
    expect(result!.isMovable).toBe(false);
    expect(result!.eventType).toBe('other');
  });

  it('location/notes sont null si absents', () => {
    const result = mapAppleEventToEventInput(
      vevent({
        uid: 'evt-11',
        summary: 'Test',
        datetype: 'date-time',
        start: new Date('2026-08-01T10:00:00Z'),
      }),
      ctx,
    );
    expect(result!.location).toBeNull();
    expect(result!.notes).toBeNull();
  });

  it('associe calendarId et userId depuis le contexte', () => {
    const result = mapAppleEventToEventInput(
      vevent({
        uid: 'evt-12',
        summary: 'Test',
        datetype: 'date-time',
        start: new Date('2026-08-01T10:00:00Z'),
      }),
      ctx,
    );
    expect(result!.calendarId).toBe(ctx.calendarId);
    expect(result!.userId).toBe(ctx.userId);
  });
});
