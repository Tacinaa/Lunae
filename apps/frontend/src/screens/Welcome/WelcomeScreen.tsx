import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AuthStackParamList } from '../../navigation/types';
import { colors } from '../../utils/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function WelcomeScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const isEmailValid = EMAIL_REGEX.test(email.trim());

  const handleContinueWithEmail = () => {
    navigation.navigate('Register', { email: email.trim() });
  };

  const handleLogin = () => {
    navigation.navigate('Login', { email: email.trim() || undefined });
  };

  const handleSsoPlaceholder = (provider: string) => {
    Alert.alert('Bientôt disponible', `La connexion avec ${provider} arrive prochainement.`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoEmoji}>🌙 ✨</Text>
        <Text style={styles.logoText}>Lunae</Text>
        <Text style={styles.logoSubtext}>28</Text>
      </View>

      <View style={styles.ssoButtons}>
        <Pressable
          style={[styles.button, styles.ssoButton]}
          onPress={() => handleSsoPlaceholder('Apple')}
          accessibilityRole="button"
          accessibilityLabel="Continuer avec Apple"
        >
          <Text style={styles.ssoButtonText}>Continuer avec Apple</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.ssoButton]}
          onPress={() => handleSsoPlaceholder('Google')}
          accessibilityRole="button"
          accessibilityLabel="Continuer avec Google"
        >
          <Text style={styles.ssoButtonText}>Continuer avec Google</Text>
        </Pressable>
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou</Text>
        <View style={styles.dividerLine} />
      </View>

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

      <Pressable
        style={[styles.button, styles.primaryButton, !isEmailValid && styles.buttonDisabled]}
        onPress={handleContinueWithEmail}
        disabled={!isEmailValid}
        accessibilityRole="button"
        accessibilityLabel="Continuer avec un email"
      >
        <Text style={styles.primaryButtonText}>Continuer avec un email</Text>
      </Pressable>

      <Pressable
        style={styles.loginLink}
        onPress={handleLogin}
        accessibilityRole="button"
        accessibilityLabel="Vous avez déjà un compte ? Se connecter"
      >
        <Text style={styles.loginLinkText}>
          Vous avez déjà un compte ? <Text style={styles.loginLinkTextBold}>Se connecter</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'center' },
  logo: { alignItems: 'center', marginBottom: 48 },
  logoEmoji: { fontSize: 40, marginBottom: 8 },
  logoText: { fontSize: 32, fontWeight: '700', color: colors.primary },
  logoSubtext: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  ssoButtons: { gap: 12, marginBottom: 24 },
  button: { minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ssoButton: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  ssoButtonText: { color: colors.text, fontSize: 15, fontWeight: '500' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: 12, color: colors.textMuted, fontSize: 13 },
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
  primaryButton: { backgroundColor: colors.primary },
  buttonDisabled: { opacity: 0.4 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  loginLink: { marginTop: 24, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  loginLinkText: { color: colors.textMuted, fontSize: 14 },
  loginLinkTextBold: { color: colors.primary, fontWeight: '600' },
});
