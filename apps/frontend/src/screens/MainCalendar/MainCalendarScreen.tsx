import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AppStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../utils/theme';
import { resetOnboardingSeen } from '../../utils/onboarding';

type Props = NativeStackScreenProps<AppStackParamList, 'MainCalendar'>;

export function MainCalendarScreen(_props: Props) {
  const logout = useAuthStore((state) => state.logout);

  const handleResetForTesting = () => {
    void resetOnboardingSeen();
    logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Calendrier</Text>
      {__DEV__ && (
        <View style={styles.devPanel}>
          <Pressable
            style={styles.devButton}
            onPress={handleResetForTesting}
            accessibilityRole="button"
            accessibilityLabel="Réinitialiser le parcours (dev)"
          >
            <Text style={styles.devButtonText}>Réinitialiser le parcours (dev)</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  title: { fontSize: 20, color: colors.text },
  devPanel: { position: 'absolute', bottom: 24, alignSelf: 'center' },
  devButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devButtonText: { color: colors.textMuted, fontSize: 13 },
});
