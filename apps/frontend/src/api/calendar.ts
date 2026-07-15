import { apiClient } from './client';
import type { Phase } from '../store/cycleStore';

export type CalendarSource = 'local' | 'google' | 'apple' | 'microsoft';

export interface CalendarDto {
  id: string;
  name: string;
  color: string;
  source: CalendarSource;
  createdAt: string;
}

export interface CreateCalendarPayload {
  name: string;
  color?: string;
}

export type EventType =
  | 'meeting'
  | 'class'
  | 'sport_intense'
  | 'sport_leger'
  | 'focus_administratif'
  | 'creation_planification'
  | 'social_enjeu'
  | 'personal'
  | 'other';

export interface EventDto {
  id: string;
  calendarId: string;
  title: string;
  startAt: string;
  endAt: string;
  location: string | null;
  notes: string | null;
  isAllDay: boolean;
  isMovable: boolean;
  eventType: EventType;
  calendar?: CalendarDto;
  phase?: { date: string; phase: Phase; cycleDay: number } | null;
}

export interface CreateEventPayload {
  calendarId: string;
  title: string;
  startAt: string;
  endAt: string;
  location?: string;
  notes?: string;
  isAllDay?: boolean;
  isMovable?: boolean;
  eventType?: EventType;
}

export type UpdateEventPayload = Partial<CreateEventPayload>;

export async function getCalendars(): Promise<CalendarDto[]> {
  const { data } = await apiClient.get<CalendarDto[]>('/calendars');
  return data;
}

export async function createCalendar(payload: CreateCalendarPayload): Promise<CalendarDto> {
  const { data } = await apiClient.post<CalendarDto>('/calendars', payload);
  return data;
}

export interface ImportGoogleCalendarPayload {
  code: string;
  redirectUri: string;
  codeVerifier: string;
  platform: 'android' | 'ios';
}

export interface ImportGoogleCalendarResult {
  calendar: CalendarDto;
  importedEventCount: number;
}

export async function importGoogleCalendar(
  payload: ImportGoogleCalendarPayload,
): Promise<ImportGoogleCalendarResult> {
  const { data } = await apiClient.post<ImportGoogleCalendarResult>(
    '/calendars/import/google',
    payload,
  );
  return data;
}

export interface ImportAppleCalendarPayload {
  appleId: string;
  appSpecificPassword: string;
}

export interface ImportAppleCalendarResult {
  calendars: CalendarDto[];
  importedEventCount: number;
}

export async function importAppleCalendar(
  payload: ImportAppleCalendarPayload,
): Promise<ImportAppleCalendarResult> {
  const { data } = await apiClient.post<ImportAppleCalendarResult>(
    '/calendars/import/apple',
    payload,
  );
  return data;
}

export async function getEvents(from: string, to: string): Promise<EventDto[]> {
  const { data } = await apiClient.get<EventDto[]>('/events', { params: { from, to } });
  return data;
}

export async function createEvent(payload: CreateEventPayload): Promise<EventDto> {
  const { data } = await apiClient.post<EventDto>('/events', payload);
  return data;
}

export async function updateEvent(id: string, payload: UpdateEventPayload): Promise<EventDto> {
  const { data } = await apiClient.patch<EventDto>(`/events/${id}`, payload);
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  await apiClient.delete(`/events/${id}`);
}

export async function searchEvents(query: string): Promise<EventDto[]> {
  const { data } = await apiClient.get<EventDto[]>('/events/search', { params: { q: query } });
  return data;
}
