import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { requestOtp, verifyOtp } from '../../api/auth';
import { BackButton } from '../../components/BackButton';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/errors';
import { colors } from '../../utils/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerification'>;

const CODE_LENGTH = 6;

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  const visible = name.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(name.length - 2, 1))}@${domain}`;
}

export function OtpVerificationScreen({ route, navigation }: Props) {
  const { email, type } = route.params;
  const setTokens = useAuthStore((state) => state.setTokens);
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleChangeDigit = (value: string, index: number) => {
    const sanitized = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = sanitized;
    setDigits(next);

    if (sanitized && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (next.every((d) => d.length === 1)) {
      void handleSubmit(next.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (fullCode: string) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const tokens = await verifyOtp(email, fullCode, type);
      setTokens(tokens);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResendMessage(null);
    setIsResending(true);
    try {
      await requestOtp(email, type);
      setResendMessage('Un nouveau code a été envoyé.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={() => navigation.goBack()} />
      <Text style={styles.title}>Vérification</Text>
      <Text style={styles.subtitle}>
        Entrez le code à 6 chiffres envoyé à {maskEmail(email)}
      </Text>

      <View style={styles.digitsRow}>
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={styles.digitInput}
            value={digit}
            onChangeText={(value) => handleChangeDigit(value, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            maxLength={1}
            accessibilityLabel={`Chiffre ${index + 1} du code`}
          />
        ))}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {resendMessage && <Text style={styles.success}>{resendMessage}</Text>}

      {isSubmitting && <ActivityIndicator color={colors.primary} style={styles.loader} />}

      <Pressable
        style={styles.resendLink}
        onPress={() => void handleResend()}
        disabled={isResending}
        accessibilityRole="button"
        accessibilityLabel="Renvoyer le code"
      >
        <Text style={styles.resendText}>
          {isResending ? 'Envoi en cours...' : 'Renvoyer le code'}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 32 },
  digitsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 24 },
  digitInput: {
    width: 44,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
  },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center', marginBottom: 12 },
  success: { color: colors.primary, fontSize: 13, textAlign: 'center', marginBottom: 12 },
  loader: { marginBottom: 12 },
  resendLink: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  resendText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
