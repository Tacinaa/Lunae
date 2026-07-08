import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CalendarImportScreen } from '../screens/CalendarImport/CalendarImportScreen';
import { CalendarPermissionScreen } from '../screens/CalendarPermission/CalendarPermissionScreen';
import { CycleSetupScreen } from '../screens/CycleSetup/CycleSetupScreen';
import { ReadyScreen } from '../screens/Ready/ReadyScreen';
import type { OnboardingSetupStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingSetupStackParamList>();

export function OnboardingSetupNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CycleSetup" component={CycleSetupScreen} />
      <Stack.Screen name="CalendarPermission" component={CalendarPermissionScreen} />
      <Stack.Screen name="CalendarImport" component={CalendarImportScreen} />
      <Stack.Screen name="Ready" component={ReadyScreen} />
    </Stack.Navigator>
  );
}
