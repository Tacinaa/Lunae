import type { Prisma } from '@prisma/client';

export interface GoogleCalendarEventInput {
  id?: string | null;
  status?: string | null;
  summary?: string | null;
  location?: string | null;
  description?: string | null;
  start?: { date?: string | null; dateTime?: string | null } | null;
  end?: { date?: string | null; dateTime?: string | null } | null;
}

const DEFAULT_TITLE = 'Sans titre';
const MAX_TITLE_LENGTH = 200;

export function mapGoogleEventToEventInput(
  event: GoogleCalendarEventInput,
  ctx: { calendarId: string; userId: string },
): Prisma.EventCreateManyInput | null {
  if (!event.id || event.status === 'cancelled') {
    return null;
  }

  const isAllDay = Boolean(event.start?.date);
  const startAt = parseGoogleDate(event.start);
  if (!startAt) {
    return null;
  }
  const endAt = parseGoogleDate(event.end) ?? startAt;

  return {
    calendarId: ctx.calendarId,
    userId: ctx.userId,
    externalId: event.id,
    title: (event.summary?.trim() || DEFAULT_TITLE).slice(0, MAX_TITLE_LENGTH),
    location: event.location ?? null,
    notes: event.description ?? null,
    startAt,
    endAt,
    isAllDay,
    isMovable: false,
    eventType: 'other',
  };
}

function parseGoogleDate(
  value: { date?: string | null; dateTime?: string | null } | null | undefined,
): Date | null {
  const raw = value?.dateTime ?? value?.date;
  if (!raw) {
    return null;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
