import { apiClient } from './client';

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
