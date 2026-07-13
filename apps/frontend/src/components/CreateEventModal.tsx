import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createEvent, type CalendarDto, type EventDto } from '../api/calendar';
import { getErrorMessage } from '../utils/errors';
import { colors } from '../utils/theme';

interface Props {
  visible: boolean;
  calendars: CalendarDto[];
  defaultDate: Date;
  onClose: () => void;
  onCreated: (event: EventDto) => void;
}

type ActivePicker = 'date' | 'start' | 'end' | null;

function combineDateAndTime(date: Date, time: Date): Date {
  const combined = new Date(date);
  combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return combined;
}

function withHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(hours, 0, 0, 0);
  return result;
}

export function CreateEventModal({ visible, calendars, defaultDate, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [calendarId, setCalendarId] = useState<string | undefined>(calendars[0]?.id);
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState(() => withHours(defaultDate, 9));
  const [endTime, setEndTime] = useState(() => withHours(defaultDate, 10));
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedCalendarId = calendarId ?? calendars[0]?.id;
  const canSubmit = Boolean(title.trim()) && Boolean(resolvedCalendarId) && !isSubmitting;

  const handlePickerChange = (_event: DateTimePickerChangeEvent, selected: Date) => {
    if (activePicker === 'date') setDate(selected);
    else if (activePicker === 'start') setStartTime(selected);
    else if (activePicker === 'end') setEndTime(selected);
    setActivePicker(null);
  };

  const pickerValue =
    activePicker === 'date' ? date : activePicker === 'start' ? startTime : endTime;

  const handleSubmit = async () => {
    if (!resolvedCalendarId || !title.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const startAt = combineDateAndTime(date, startTime);
      const endAt = combineDateAndTime(date, endTime);
      const event = await createEvent({
        calendarId: resolvedCalendarId,
        title: title.trim(),
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
      });
      setTitle('');
      onCreated(event);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Nouvel événement</Text>

          <TextInput
            style={styles.input}
            placeholder="Titre de l'événement"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            accessibilityLabel="Titre de l'événement"
          />

          {calendars.length === 0 ? (
            <Text style={styles.hint}>Aucun calendrier disponible.</Text>
          ) : (
            <View style={styles.chipRow}>
              {calendars.map((cal) => (
                <Pressable
                  key={cal.id}
                  onPress={() => setCalendarId(cal.id)}
                  style={[
                    styles.chip,
                    { borderColor: cal.color },
                    resolvedCalendarId === cal.id && { backgroundColor: cal.color },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Calendrier ${cal.name}`}
                >
                  <Text
                    style={[styles.chipText, resolvedCalendarId === cal.id && styles.chipTextActive]}
                  >
                    {cal.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.fieldRow}>
            <Pressable
              style={styles.fieldButton}
              onPress={() => setActivePicker('date')}
              accessibilityRole="button"
              accessibilityLabel="Date de l'événement"
            >
              <Text style={styles.fieldButtonText}>{date.toLocaleDateString('fr-FR')}</Text>
            </Pressable>
            <Pressable
              style={styles.fieldButton}
              onPress={() => setActivePicker('start')}
              accessibilityRole="button"
              accessibilityLabel="Heure de début"
            >
              <Text style={styles.fieldButtonText}>
                {startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </Pressable>
            <Pressable
              style={styles.fieldButton}
              onPress={() => setActivePicker('end')}
              accessibilityRole="button"
              accessibilityLabel="Heure de fin"
            >
              <Text style={styles.fieldButtonText}>
                {endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </Pressable>
          </View>

          {activePicker && (
            <DateTimePicker
              value={pickerValue}
              mode={activePicker === 'date' ? 'date' : 'time'}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onValueChange={handlePickerChange}
              onDismiss={() => setActivePicker(null)}
            />
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actionsRow}>
            <Pressable
              style={styles.cancelButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Annuler"
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Pressable>
            <Pressable
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
              onPress={() => void handleSubmit()}
              disabled={!canSubmit}
              accessibilityRole="button"
              accessibilityLabel="Créer l'événement"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Créer</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
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
  hint: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    minHeight: 36,
    borderWidth: 1.5,
    borderRadius: 18,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  chipText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  fieldRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  fieldButton: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldButtonText: { fontSize: 13, color: colors.text },
  error: { color: colors.danger, fontSize: 13, marginBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: { color: colors.textMuted, fontSize: 15, fontWeight: '600' },
  submitButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: { opacity: 0.4 },
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
