import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { OnboardingSetupStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../utils/theme';

type Props = NativeStackScreenProps<OnboardingSetupStackParamList, 'Ready'>;

export function ReadyScreen(_props: Props) {
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.emoji}>🌙 ✨</Text>
      <Text style={styles.title}>Tout est prêt !</Text>
      <Text style={styles.text}>
        Votre agenda Lunae est configuré. On s’occupe du reste.
      </Text>

      <Pressable
        style={styles.cta}
        onPress={completeOnboarding}
        accessibilityRole="button"
        accessibilityLabel="Commencer"
      >
        <Text style={styles.ctaText}>Commencer</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: 24 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 12 },
  text: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: 40 },
  cta: {
    backgroundColor: colors.primary,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
