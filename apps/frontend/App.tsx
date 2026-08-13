import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Sentry from '@sentry/react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';

// Suivi des erreurs applicatives (cf. docs/MAINTENANCE.md section 1.2). Reste inactif tant
// que EXPO_PUBLIC_SENTRY_DSN n'est pas défini — même logique que le SDK backend
// (apps/backend/src/instrument.ts) : pas d'erreur, juste pas de remontée vers Sentry.
const sentryDsn = process.env['EXPO_PUBLIC_SENTRY_DSN'];
if (sentryDsn) {
  Sentry.init({ dsn: sentryDsn, sendDefaultPii: false });
}

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(App);
