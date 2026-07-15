import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '../../components/BackButton';
import type { OnboardingSetupStackParamList } from '../../navigation/types';
import { colors } from '../../utils/theme';
import { getCalendars, type CalendarDto } from '../../api/calendar';
import { useAppleCalendarImport } from '../../hooks/useAppleCalendarImport';
import { useGoogleCalendarImport } from '../../hooks/useGoogleCalendarImport';

type Props = NativeStackScreenProps<OnboardingSetupStackParamList, 'CalendarImport'>;

type Provider = 'apple' | 'google' | 'microsoft';

interface ImportedAccount {
  id: string;
  provider: Provider;
  label: string;
}

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: 'apple', label: 'Apple' },
  { id: 'google', label: 'Google' },
  { id: 'microsoft', label: 'Microsoft' },
];

export function CalendarImportScreen({ navigation }: Props) {
  const [importedAccounts, setImportedAccounts] = useState<ImportedAccount[]>([]);
  const [importedCalendars, setImportedCalendars] = useState<CalendarDto[]>([]);
  const { startImport, loading: googleLoading, error: googleError } = useGoogleCalendarImport();
  const {
    importCalendar: importApple,
    loading: appleLoading,
    error: appleError,
  } = useAppleCalendarImport();

  const [showAppleForm, setShowAppleForm] = useState(false);
  const [appleId, setAppleId] = useState('');
  const [applePassword, setApplePassword] = useState('');

  const refreshImportedCalendars = async () => {
    try {
      const calendars = await getCalendars();
      setImportedCalendars(
        calendars.filter((calendar) => calendar.source === 'google' || calendar.source === 'apple'),
      );
    } catch {
      // Liste laissée vide en cas d'échec réseau — ne bloque pas l'onboarding.
    }
  };

  useEffect(() => {
    refreshImportedCalendars();
  }, []);

  const handleAddProvider = (provider: Provider, label: string) => {
    setImportedAccounts((accounts) => [
      ...accounts,
      { id: `${provider}-${Date.now()}`, provider, label },
    ]);
  };

  const handleGoogleImport = async () => {
    const result = await startImport();
    if (result) {
      await refreshImportedCalendars();
    }
  };

  const handleAppleSubmit = async () => {
    const result = await importApple(appleId.trim(), applePassword.trim());
    if (result) {
      setShowAppleForm(false);
      setAppleId('');
      setApplePassword('');
      await refreshImportedCalendars();
    }
  };

  const handleRemoveAccount = (id: string) => {
    setImportedAccounts((accounts) => accounts.filter((account) => account.id !== id));
  };

  const hasImportedAccounts = importedAccounts.length > 0 || importedCalendars.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Import de calendriers</Text>
        <Text style={styles.subtitle}>
          Connectez vos calendriers existants pour les retrouver directement dans Lunae.
        </Text>

        {PROVIDERS.map(({ id, label }) => (
          <View key={id}>
            <View style={styles.providerRow}>
              <Text style={styles.providerLabel}>{label}</Text>
              {(id === 'google' && googleLoading) || (id === 'apple' && appleLoading) ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Pressable
                  style={styles.addButton}
                  onPress={() => {
                    if (id === 'google') handleGoogleImport();
                    else if (id === 'apple') setShowAppleForm((v) => !v);
                    else handleAddProvider(id, label);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Ajouter un compte ${label}`}
                >
                  <Text style={styles.addButtonText}>{id === 'apple' && showAppleForm ? '−' : '+'}</Text>
                </Pressable>
              )}
            </View>
            {id === 'google' && googleError && (
              <Text style={styles.errorText}>{googleError}</Text>
            )}
            {id === 'apple' && showAppleForm && (
              <View style={styles.appleForm}>
                <Text style={styles.appleFormHelp}>
                  Utilise un mot de passe d’application (pas ton mot de passe Apple habituel),
                  généré gratuitement sur appleid.apple.com.
                </Text>
                <TextInput
                  style={styles.appleFormInput}
                  placeholder="Identifiant Apple"
                  placeholderTextColor={colors.textMuted}
                  value={appleId}
                  onChangeText={setAppleId}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  accessibilityLabel="Identifiant Apple"
                />
                <TextInput
                  style={styles.appleFormInput}
                  placeholder="Mot de passe d’application"
                  placeholderTextColor={colors.textMuted}
                  value={applePassword}
                  onChangeText={setApplePassword}
                  secureTextEntry
                  autoCapitalize="none"
                  accessibilityLabel="Mot de passe d'application"
                />
                {appleError && <Text style={styles.errorText}>{appleError}</Text>}
                <Pressable
                  style={[
                    styles.appleFormSubmit,
                    (!appleId.trim() || !applePassword.trim()) && styles.appleFormSubmitDisabled,
                  ]}
                  onPress={() => void handleAppleSubmit()}
                  disabled={!appleId.trim() || !applePassword.trim()}
                  accessibilityRole="button"
                  accessibilityLabel="Se connecter à Apple Calendar"
                >
                  <Text style={styles.appleFormSubmitText}>Se connecter</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))}

        {hasImportedAccounts && (
          <>
            <Text style={styles.sectionTitle}>Comptes importés</Text>
            {importedCalendars.map((calendar) => (
              <View key={calendar.id} style={styles.importedRow}>
                <Text style={styles.importedLabel}>{calendar.name}</Text>
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              </View>
            ))}
            {importedAccounts.map((account) => (
              <View key={account.id} style={styles.importedRow}>
                <Text style={styles.importedLabel}>{account.label}</Text>
                <Pressable
                  style={styles.removeButton}
                  onPress={() => handleRemoveAccount(account.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Retirer le compte ${account.label}`}
                >
                  <Ionicons name="close" size={22} color={colors.danger} />
                </Pressable>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <Pressable
        style={styles.nextButton}
        onPress={() => navigation.navigate('Ready')}
        accessibilityRole="button"
        accessibilityLabel="Suivant"
      >
        <Text style={styles.nextButtonText}>Suivant</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingTop: 56, paddingHorizontal: 24, paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 24, lineHeight: 20 },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  providerLabel: { fontSize: 15, color: colors.text },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', lineHeight: 20 },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    marginTop: -8,
    marginBottom: 12,
  },
  appleForm: {
    marginTop: -4,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  appleFormHelp: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    marginBottom: 12,
  },
  appleFormInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.text,
    marginBottom: 10,
  },
  appleFormSubmit: {
    backgroundColor: colors.primary,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleFormSubmitDisabled: { opacity: 0.4 },
  appleFormSubmitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 12,
  },
  importedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  importedLabel: { fontSize: 15, color: colors.text },
  removeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: {
    backgroundColor: colors.primary,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    marginBottom: 24,
  },
  nextButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
