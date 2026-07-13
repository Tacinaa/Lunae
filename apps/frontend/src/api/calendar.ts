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

export type EventType = 'meeting' | 'class' | 'sport' | 'personal' | 'other';

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

export async function getCalendars(): Promise<CalendarDto[]> {
  const { data } = await apiClient.get<CalendarDto[]>('/calendars');
  return data;
}

export async function createCalendar(payload: CreateCalendarPayload): Promise<CalendarDto> {
  const { data } = await apiClient.post<CalendarDto>('/calendars', payload);
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
