import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainCalendarScreen } from '../screens/MainCalendar/MainCalendarScreen';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainCalendar" component={MainCalendarScreen} />
    </Stack.Navigator>
  );
}
