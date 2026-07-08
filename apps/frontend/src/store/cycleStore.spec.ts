import { useCycleStore } from './cycleStore';

describe('useCycleStore', () => {
  beforeEach(() => {
    useCycleStore.setState({ cycleData: null, phases: [], currentPhase: null });
  });

  it('setCycleData() met à jour cycleData', () => {
    const cycleData = { startDate: '2026-01-01', cycleLength: 28, periodDuration: 5 };
    useCycleStore.getState().setCycleData(cycleData);
    expect(useCycleStore.getState().cycleData).toEqual(cycleData);
  });

  it('setPhases() met à jour phases', () => {
    const phases = [{ date: '2026-01-01', phase: 'menstruation' as const, cycleDay: 1 }];
    useCycleStore.getState().setPhases(phases);
    expect(useCycleStore.getState().phases).toEqual(phases);
  });

  it('setCurrentPhase() met à jour currentPhase', () => {
    const currentPhase = { date: '2026-01-01', phase: 'ovulation' as const, cycleDay: 14 };
    useCycleStore.getState().setCurrentPhase(currentPhase);
    expect(useCycleStore.getState().currentPhase).toEqual(currentPhase);
  });
});
