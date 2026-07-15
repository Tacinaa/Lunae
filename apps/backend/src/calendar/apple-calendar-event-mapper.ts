import type { Prisma } from '@prisma/client';
import type { VEvent } from 'node-ical';

const DEFAULT_TITLE = 'Sans titre';
const MAX_TITLE_LENGTH = 200;

/**
 * Les propriétés textuelles node-ical (summary/description/location) peuvent être une chaîne
 * simple ou un objet { val, params } quand la propriété iCalendar porte des paramètres
 * (ex. SUMMARY;LANGUAGE=fr:Réunion) — on ne garde que la valeur.
 */
function plainText(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'val' in value) {
    const val = value.val;
    return typeof val === 'string' ? val : null;
  }
  return null;
}

export function mapAppleEventToEventInput(
  event: VEvent,
  ctx: { calendarId: string; userId: string },
): Prisma.EventCreateManyInput | null {
  if (!event.uid || event.status === 'CANCELLED') {
    return null;
  }
  // Pas d'expansion RRULE dans ce premier import (cf. limitation documentée) : on ignore les
  // événements récurrents plutôt que de n'importer que leur première occurrence silencieusement.
  if (event.rrule) {
    return null;
  }

  const startAt = event.start;
  if (!startAt) {
    return null;
  }
  const endAt = event.end ?? startAt;

  const summary = plainText(event.summary);

  return {
    calendarId: ctx.calendarId,
    userId: ctx.userId,
    externalId: event.uid,
    title: (summary?.trim() || DEFAULT_TITLE).slice(0, MAX_TITLE_LENGTH),
    location: plainText(event.location),
    notes: plainText(event.description),
    startAt,
    endAt,
    isAllDay: event.datetype === 'date',
    isMovable: false,
    eventType: 'other',
  };
}
