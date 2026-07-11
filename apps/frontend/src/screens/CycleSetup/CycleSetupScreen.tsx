import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { createCycle } from '../../api/cycle';
import type { OnboardingSetupStackParamList } from '../../navigation/types';
import { useCycleStore } from '../../store/cycleStore';
import { colors } from '../../utils/theme';
import { getErrorMessage } from '../../utils/errors';

type Props = NativeStackScreenProps<OnboardingSetupStackParamList, 'CycleSetup'>;

const CYCLE_LENGTH_MIN = 21;
const CYCLE_LENGTH_MAX = 35;
const CYCLE_LENGTH_DEFAULT = 28;
const PERIOD_DURATION_MIN = 2;
const PERIOD_DURATION_MAX = 8;
const PERIOD_DURATION_DEFAULT = 5;

interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

function Stepper({ label, value, min, max, onChange }: StepperProps) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControl}>
        <Pressable
          style={[styles.stepperButton, value <= min && styles.stepperButtonDisabled]}
          onPress={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          accessibilityRole="button"
          accessibilityLabel={`Diminuer ${label}`}
        >
          <Text style={styles.stepperButtonText}>−</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{value} j</Text>
        <Pressable
          style={[styles.stepperButton, value >= max && styles.stepperButtonDisabled]}
          onPress={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          accessibilityRole="button"
          accessibilityLabel={`Augmenter ${label}`}
        >
          <Text style={styles.stepperButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function CycleSetupScreen({ navigation }: Props) {
  const setCycleData = useCycleStore((state) => state.setCycleData);
  const [startDate, setStartDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [cycleLength, setCycleLength] = useState(CYCLE_LENGTH_DEFAULT);
  const [periodDuration, setPeriodDuration] = useState(PERIOD_DURATION_DEFAULT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDateChange = (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
    setShowPicker(false);
    setStartDate(selectedDate);
  };

  const handleDatePickerDismiss = () => {
    setShowPicker(false);
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const isoDate = startDate.toISOString();
      await createCycle({ startDate: isoDate, cycleLength, periodDuration });
      setCycleData({ startDate: isoDate, cycleLength, periodDuration });
      navigation.navigate('CalendarPermission');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Votre cycle</Text>
      <Text style={styles.subtitle}>
        Ces informations nous permettent de calculer vos phases et de vous proposer les meilleurs
        créneaux.
      </Text>

      <Text style={styles.fieldLabel}>Date de début de vos dernières règles</Text>
      <Pressable
        style={styles.dateInput}
        onPress={() => setShowPicker(true)}
        accessibilityRole="button"
        accessibilityLabel="Date de début de vos dernières règles"
      >
        <Text style={styles.dateInputText}>{startDate.toLocaleDateString('fr-FR')}</Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          maximumDate={new Date()}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onValueChange={handleDateChange}
          onDismiss={handleDatePickerDismiss}
        />
      )}

      <Stepper
        label="Durée du cycle"
        value={cycleLength}
        min={CYCLE_LENGTH_MIN}
        max={CYCLE_LENGTH_MAX}
        onChange={setCycleLength}
      />
      <Stepper
        label="Durée des règles"
        value={periodDuration}
        min={PERIOD_DURATION_MIN}
        max={PERIOD_DURATION_MAX}
        onChange={setPeriodDuration}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={() => void handleSubmit()}
        disabled={isSubmitting}
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
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 24, lineHeight: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  dateInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginBottom: 24,
  },
  dateInputText: { fontSize: 15, color: colors.text },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  stepperLabel: { fontSize: 14, fontWeight: '600', color: colors.text, flexShrink: 1, marginRight: 12 },
  stepperControl: { flexDirection: 'row', alignItems: 'center' },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: { opacity: 0.4 },
  stepperButtonText: { fontSize: 20, color: colors.primary, fontWeight: '600' },
  stepperValue: { fontSize: 15, color: colors.text, width: 48, textAlign: 'center' },
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
