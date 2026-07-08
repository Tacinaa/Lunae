import { NavigationContainer } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { hasSeenOnboarding } from '../utils/onboarding';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingSetupNavigator } from './OnboardingSetupNavigator';

export function RootNavigator() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding);
  const [seenOnboardingIntro, setSeenOnboardingIntro] = useState<boolean | null>(null);

  useEffect(() => {
    void hasSeenOnboarding().then(setSeenOnboardingIntro);
  }, []);

  if (seenOnboardingIntro === null) {
    return null;
  }

  return (
    <NavigationContainer>
      {(() => {
        if (!accessToken) {
          return (
            <AuthNavigator
              initialRouteName={seenOnboardingIntro ? 'Welcome' : 'Onboarding'}
            />
          );
        }
        if (!hasCompletedOnboarding) {
          return <OnboardingSetupNavigator />;
        }
        return <AppNavigator />;
      })()}
    </NavigationContainer>
  );
}
