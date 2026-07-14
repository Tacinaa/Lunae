import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Calendar from 'expo-calendar/legacy';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '../../components/BackButton';
import type { OnboardingSetupStackParamList } from '../../navigation/types';
import { colors } from '../../utils/theme';

type Props = NativeStackScreenProps<OnboardingSetupStackParamList, 'CalendarPermission'>;

export function CalendarPermissionScreen({ navigation }: Props) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestAccess = async () => {
    setIsRequesting(true);
    try {
      await Calendar.requestCalendarPermissionsAsync();
    } finally {
      setIsRequesting(false);
      navigation.navigate('CalendarImport');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={() => navigation.goBack()} />
      <Text style={styles.emoji}>📅</Text>
      <Text style={styles.title}>Autorisation calendrier</Text>
      <Text style={styles.text}>
        Lunae peut importer vos calendriers existants pour vous proposer les meilleurs créneaux
        selon votre cycle. Vous pourrez choisir quels calendriers importer à l’étape suivante.
      </Text>

      <Pressable
        style={[styles.button, isRequesting && styles.buttonDisabled]}
        onPress={() => void handleRequestAccess()}
        disabled={isRequesting}
        accessibilityRole="button"
        accessibilityLabel="Autoriser l'accès"
      >
        {isRequesting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Autoriser l’accès</Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: 24 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 12, textAlign: 'center' },
  text: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: 40, lineHeight: 20 },
  button: {
    backgroundColor: colors.primary,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    alignSelf: 'stretch',
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
