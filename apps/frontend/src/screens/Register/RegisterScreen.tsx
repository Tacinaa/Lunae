import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { register } from '../../api/auth';
import type { AuthStackParamList } from '../../navigation/types';
import { colors } from '../../utils/theme';
import { getErrorMessage } from '../../utils/errors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation, route }: Props) {
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.length > 0 && password.length >= 8 && !isSubmitting;

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await register({
        email,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });
      navigation.navigate('OtpVerification', { email, type: 'email_verification' });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inscription</Text>

      <TextInput
        style={styles.input}
        placeholder="Prénom"
        placeholderTextColor={colors.textMuted}
        value={firstName}
        onChangeText={setFirstName}
        accessibilityLabel="Prénom"
      />
      <TextInput
        style={styles.input}
        placeholder="Nom"
        placeholderTextColor={colors.textMuted}
        value={lastName}
        onChangeText={setLastName}
        accessibilityLabel="Nom"
      />
      <TextInput
        style={styles.input}
        placeholder="Adresse email"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        accessibilityLabel="Adresse email"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe (8 caractères min.)"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        autoComplete="password-new"
        value={password}
        onChangeText={setPassword}
        accessibilityLabel="Mot de passe"
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        onPress={() => void handleSubmit()}
        disabled={!canSubmit}
        accessibilityRole="button"
        accessibilityLabel="Continuer"
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Continuer</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 32 },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.text,
    marginBottom: 16,
  },
  error: { color: colors.danger, fontSize: 13, marginBottom: 16 },
  button: {
    backgroundColor: colors.primary,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
