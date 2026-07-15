import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Platform } from 'react-native';
import {
  importGoogleCalendar,
  type ImportGoogleCalendarResult,
} from '../api/calendar';

WebBrowser.maybeCompleteAuthSession();

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

export function useGoogleCalendarImport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, , promptAsync] = Google.useAuthRequest({
    androidClientId: process.env['EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'],
    iosClientId: process.env['EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'],
    scopes: SCOPES,
    // On échange le code nous-mêmes côté backend (qui doit conserver le refresh
    // token pour une future sync) plutôt que de laisser le hook l'échanger côté client.
    shouldAutoExchangeCode: false,
    extraParams: { access_type: 'offline', prompt: 'consent' },
  });

  const startImport = async (): Promise<ImportGoogleCalendarResult | null> => {
    setError(null);
    setLoading(true);
    try {
      const result = await promptAsync();
      if (result.type !== 'success' || !result.params['code']) {
        if (result.type !== 'cancel' && result.type !== 'dismiss') {
          setError('Connexion Google annulée ou échouée.');
        }
        return null;
      }
      if (!request?.codeVerifier || !request.redirectUri) {
        setError('Erreur interne : requête OAuth non initialisée.');
        return null;
      }
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      return await importGoogleCalendar({
        code: result.params['code'],
        redirectUri: request.redirectUri,
        codeVerifier: request.codeVerifier,
        platform,
      });
    } catch {
      setError("Échec de l'import du calendrier Google.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { startImport, loading, error };
}
