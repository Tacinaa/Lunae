import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/Login/LoginScreen';
import { OnboardingScreen } from '../screens/Onboarding/OnboardingScreen';
import { OtpVerificationScreen } from '../screens/OtpVerification/OtpVerificationScreen';
import { RegisterScreen } from '../screens/Register/RegisterScreen';
import { WelcomeScreen } from '../screens/Welcome/WelcomeScreen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

interface AuthNavigatorProps {
  initialRouteName: keyof AuthStackParamList;
}

export function AuthNavigator({ initialRouteName }: AuthNavigatorProps) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
    </Stack.Navigator>
  );
}
