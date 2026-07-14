import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createEvent, updateEvent, type CalendarDto, type EventDto, type EventType } from '../api/calendar';
import { getErrorMessage } from '../utils/errors';
import { CATEGORY_OPTIONS } from '../utils/phaseRecommendation';
import { colors } from '../utils/theme';
import { EventDatePicker } from './EventDatePicker';

interface Props {
  visible: boolean;
  calendars: CalendarDto[];
  defaultDate: Date;
  event?: EventDto | null;
  /** Ouvre directement le calendrier de sélection de date (arrivée via "Choisir un créneau"). */
  focusDate?: boolean;
  onClose: () => void;
  onSaved: (event: EventDto) => void;
}

type ActivePicker = 'start' | 'end' | null;

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

export function CreateEventModal({
  visible,
  calendars,
  defaultDate,
  event,
  focusDate,
  onClose,
  onSaved,
}: Props) {
  const isEditing = Boolean(event);

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [calendarId, setCalendarId] = useState<string | undefined>(calendars[0]?.id);
  const [eventType, setEventType] = useState<EventType>('other');
  const [date, setDate] = useState(defaultDate);
  const [referenceDate, setReferenceDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState(() => withHours(defaultDate, 9));
  const [endTime, setEndTime] = useState(() => withHours(defaultDate, 10));
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [dateExpanded, setDateExpanded] = useState(false);
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    if (event) {
      setTitle(event.title);
      setLocation(event.location ?? '');
      setNotes(event.notes ?? '');
      setCalendarId(event.calendarId);
      setEventType(event.eventType);
      setDate(new Date(event.startAt));
      setReferenceDate(new Date(event.startAt));
      setStartTime(new Date(event.startAt));
      setEndTime(new Date(event.endAt));
    } else {
      setTitle('');
      setLocation('');
      setNotes('');
      setCalendarId(calendars[0]?.id);
      setEventType('other');
      setDate(defaultDate);
      setReferenceDate(defaultDate);
      setStartTime(withHours(defaultDate, 9));
      setEndTime(withHours(defaultDate, 10));
    }
    setDateExpanded(Boolean(focusDate));
    setCalendarExpanded(false);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, event, focusDate]);

  const resolvedCalendarId = calendarId ?? calendars[0]?.id;
  const resolvedCalendarColor =
    calendars.find((cal) => cal.id === resolvedCalendarId)?.color ?? colors.primary;
  const isMovable = event ? event.isMovable : true;
  const canSubmit = Boolean(title.trim()) && Boolean(resolvedCalendarId) && !isSubmitting;

  const handlePickerChange = (_event: DateTimePickerChangeEvent, selected: Date) => {
    if (activePicker === 'start') setStartTime(selected);
    else if (activePicker === 'end') setEndTime(selected);
    setActivePicker(null);
  };

  const pickerValue = activePicker === 'start' ? startTime : endTime;

  const handleSubmit = async () => {
    if (!resolvedCalendarId || !title.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const startAt = combineDateAndTime(date, startTime);
      const endAt = combineDateAndTime(date, endTime);
      const payload = {
        calendarId: resolvedCalendarId,
        title: title.trim(),
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        eventType,
      };
      const saved = event ? await updateEvent(event.id, payload) : await createEvent(payload);
      onSaved(saved);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const dateSection = (
    <View style={styles.dateSection}>
      <Pressable
        style={styles.dateToggleRow}
        onPress={() => setDateExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel="Date de l'événement"
      >
        <Text style={styles.sectionLabel}>Date</Text>
        <View style={styles.dateToggleValueRow}>
          <Text style={styles.dateToggleValue}>{date.toLocaleDateString('fr-FR')}</Text>
          <Text style={styles.dateToggleChevron}>{dateExpanded ? '▲' : '▼'}</Text>
        </View>
      </Pressable>
      {dateExpanded && (
        <EventDatePicker
          value={date}
          referenceDate={referenceDate}
          selectionColor={resolvedCalendarColor}
          isMovable={isMovable}
          eventType={eventType}
          excludeEventId={event?.id}
          onChange={setDate}
        />
      )}

      <View style={styles.fieldRow}>
        <View style={styles.fieldColumn}>
          <Text style={styles.timeLabel}>Début</Text>
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
        </View>
        <View style={styles.fieldColumn}>
          <Text style={styles.timeLabel}>Fin</Text>
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
      </View>
    </View>
  );

  const resolvedCalendarName =
    calendars.find((cal) => cal.id === resolvedCalendarId)?.name ?? 'Aucun calendrier';

  const titleAndCalendarSection = (
    <>
      <TextInput
        style={styles.input}
        placeholder="Titre de l'événement"
        placeholderTextColor={colors.textMuted}
        value={title}
        onChangeText={setTitle}
        accessibilityLabel="Titre de l'événement"
      />

      <View style={styles.categorySection}>
        <Text style={styles.sectionLabel}>Catégorie</Text>
        <View style={styles.categoryChipsRow}>
          {CATEGORY_OPTIONS.map((option) => {
            const selected = eventType === option.value;
            return (
              <Pressable
                key={option.value}
                style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                onPress={() => setEventType(option.value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Catégorie ${option.label}`}
              >
                <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.calendarSection}>
        {calendars.length === 0 ? (
          <Text style={styles.hint}>Aucun calendrier disponible.</Text>
        ) : (
          <>
            <Pressable
              style={styles.dateToggleRow}
              onPress={() => setCalendarExpanded((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel="Calendrier"
            >
              <Text style={styles.sectionLabel}>Calendrier</Text>
              <View style={styles.dateToggleValueRow}>
                <View style={[styles.calendarDot, { backgroundColor: resolvedCalendarColor }]} />
                <Text style={styles.dateToggleValue}>{resolvedCalendarName}</Text>
                <Text style={styles.dateToggleChevron}>{calendarExpanded ? '▲' : '▼'}</Text>
              </View>
            </Pressable>
            {calendarExpanded && (
              <View style={styles.calendarList}>
                {calendars.map((cal, index) => (
                  <Pressable
                    key={cal.id}
                    onPress={() => {
                      setCalendarId(cal.id);
                      setCalendarExpanded(false);
                    }}
                    style={[styles.calendarListRow, index > 0 && styles.calendarListRowBorder]}
                    accessibilityRole="button"
                    accessibilityLabel={`Calendrier ${cal.name}`}
                  >
                    <View style={[styles.calendarDot, { backgroundColor: cal.color }]} />
                    <Text style={styles.calendarListLabel}>{cal.name}</Text>
                    {resolvedCalendarId === cal.id && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </>
  );

  const locationAndNotesSection = (
    <>
      <TextInput
        style={styles.input}
        placeholder="Lieu (optionnel)"
        placeholderTextColor={colors.textMuted}
        value={location}
        onChangeText={setLocation}
        accessibilityLabel="Lieu de l'événement"
      />

      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Notes (optionnel)"
        placeholderTextColor={colors.textMuted}
        value={notes}
        onChangeText={setNotes}
        multiline
        accessibilityLabel="Notes de l'événement"
      />
    </>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ScrollView
          style={styles.sheet}
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{isEditing ? "Modifier l'événement" : 'Nouvel événement'}</Text>

          {focusDate ? (
            <>
              {dateSection}
              {titleAndCalendarSection}
              {locationAndNotesSection}
            </>
          ) : (
            <>
              {titleAndCalendarSection}
              {dateSection}
              {locationAndNotesSection}
            </>
          )}

          {activePicker && (
            <DateTimePicker
              value={pickerValue}
              mode="time"
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
              accessibilityLabel={isEditing ? "Enregistrer l'événement" : "Créer l'événement"}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>{isEditing ? 'Enregistrer' : 'Créer'}</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetContent: { padding: 24 },
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
  notesInput: { minHeight: 72, paddingTop: 12, textAlignVertical: 'top' },
  hint: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  dateSection: { marginBottom: 16 },
  dateToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  dateToggleValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateToggleValue: { fontSize: 14, color: colors.text },
  dateToggleChevron: { fontSize: 10, color: colors.textMuted },
  categorySection: { marginBottom: 16 },
  categoryChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  categoryChip: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryChipText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  categoryChipTextSelected: { color: '#FFFFFF' },
  calendarSection: { marginBottom: 16 },
  calendarDot: { width: 10, height: 10, borderRadius: 5 },
  calendarList: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  calendarListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
    gap: 10,
  },
  calendarListRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  calendarListLabel: { flex: 1, fontSize: 14, color: colors.text },
  fieldRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  fieldColumn: { flex: 1 },
  timeLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 8 },
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
