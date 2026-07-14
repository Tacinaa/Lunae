import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { OnboardingSetupStackParamList } from '../../navigation/types';
import { colors } from '../../utils/theme';

type Props = NativeStackScreenProps<OnboardingSetupStackParamList, 'Consent'>;

export function ConsentScreen({ navigation }: Props) {
  const [accepted, setAccepted] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.emoji}>🔒</Text>
      <Text style={styles.title}>Vos données de cycle</Text>
      <Text style={styles.text}>
        Pour calculer vos phases et vous proposer des créneaux adaptés à votre énergie, Lunae a
        besoin de connaître la date de vos dernières règles et la durée de votre cycle. Ce sont
        des données de santé sensibles : elles sont stockées de façon sécurisée et ne sont jamais
        partagées avec des tiers.
      </Text>

      <Pressable
        style={styles.checkboxRow}
        onPress={() => setAccepted((v) => !v)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        accessibilityLabel="J'accepte le traitement de mes données de cycle"
      >
        <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
          {accepted && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </View>
        <Text style={styles.checkboxLabel}>
          J’ai lu ces informations et j’accepte que Lunae traite mes données de cycle menstruel
          dans ce cadre.
        </Text>
      </Pressable>

      <Pressable
        style={[styles.button, !accepted && styles.buttonDisabled]}
        onPress={() => navigation.navigate('CycleSetup')}
        disabled={!accepted}
        accessibilityRole="button"
        accessibilityLabel="Continuer"
      >
        <Text style={styles.buttonText}>Continuer</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: 24 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 12, textAlign: 'center' },
  text: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    marginBottom: 32,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxLabel: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
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
