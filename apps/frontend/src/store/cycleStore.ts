import { create } from 'zustand';

export type Phase = 'menstruation' | 'follicular' | 'ovulation' | 'luteal';

export interface PhaseEntry {
  date: string;
  phase: Phase;
  cycleDay: number;
}

export interface CycleData {
  startDate: string;
  cycleLength: number;
  periodDuration: number;
}

interface CycleState {
  cycleData: CycleData | null;
  phases: PhaseEntry[];
  currentPhase: PhaseEntry | null;
  setCycleData: (cycleData: CycleData) => void;
  setPhases: (phases: PhaseEntry[]) => void;
  setCurrentPhase: (currentPhase: PhaseEntry | null) => void;
}

export const useCycleStore = create<CycleState>((set) => ({
  cycleData: null,
  phases: [],
  currentPhase: null,
  setCycleData: (cycleData) => set({ cycleData }),
  setPhases: (phases) => set({ phases }),
  setCurrentPhase: (currentPhase) => set({ currentPhase }),
}));
