import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '../../components/BackButton';
import type { OnboardingSetupStackParamList } from '../../navigation/types';
import { colors } from '../../utils/theme';

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

  const handleAddProvider = (provider: Provider, label: string) => {
    setImportedAccounts((accounts) => [
      ...accounts,
      { id: `${provider}-${Date.now()}`, provider, label },
    ]);
  };

  const handleRemoveAccount = (id: string) => {
    setImportedAccounts((accounts) => accounts.filter((account) => account.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Import de calendriers</Text>
        <Text style={styles.subtitle}>
          Connectez vos calendriers existants pour les retrouver directement dans Lunae.
        </Text>

        {PROVIDERS.map(({ id, label }) => (
          <View key={id} style={styles.providerRow}>
            <Text style={styles.providerLabel}>{label}</Text>
            <Pressable
              style={styles.addButton}
              onPress={() => handleAddProvider(id, label)}
              accessibilityRole="button"
              accessibilityLabel={`Ajouter un compte ${label}`}
            >
              <Text style={styles.addButtonText}>+</Text>
            </Pressable>
          </View>
        ))}

        {importedAccounts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Comptes importés</Text>
            {importedAccounts.map((account) => (
              <View key={account.id} style={styles.importedRow}>
                <Text style={styles.importedLabel}>{account.label}</Text>
                <Pressable
                  style={styles.removeButton}
                  onPress={() => handleRemoveAccount(account.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Retirer le compte ${account.label}`}
                >
                  <Text style={styles.removeButtonText}>×</Text>
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', lineHeight: 20 },
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
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: { color: colors.danger, fontSize: 20, fontWeight: '600', lineHeight: 22 },
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
