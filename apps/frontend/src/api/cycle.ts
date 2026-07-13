import { apiClient } from './client';
import type { PhaseEntry } from '../store/cycleStore';

export interface CreateCyclePayload {
  startDate: string;
  cycleLength: number;
  periodDuration: number;
}

export interface CycleEntry {
  id: string;
  startDate: string;
  cycleLength: number;
  periodDuration: number;
}

export async function createCycle(payload: CreateCyclePayload): Promise<CycleEntry> {
  const { data } = await apiClient.post<CycleEntry>('/cycle', payload);
  return data;
}

export async function getPhasesInRange(from: string, to: string): Promise<PhaseEntry[]> {
  const { data } = await apiClient.get<PhaseEntry[]>('/cycle/phases', { params: { from, to } });
  return data;
}
