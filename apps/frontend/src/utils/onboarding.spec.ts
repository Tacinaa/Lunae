import { hasSeenOnboarding, setOnboardingSeen } from './onboarding';

describe('onboarding persistence', () => {
  it('hasSeenOnboarding() → false avant toute écriture', async () => {
    expect(await hasSeenOnboarding()).toBe(false);
  });

  it('setOnboardingSeen() puis hasSeenOnboarding() → true', async () => {
    await setOnboardingSeen();
    expect(await hasSeenOnboarding()).toBe(true);
  });
});
