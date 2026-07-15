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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
type ExpandedSection = 'date' | 'endDate' | 'calendar' | null;

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

/**
 * Ancre le jour calendrier local choisi par l'utilisatrice à minuit UTC — convention déjà
 * utilisée par le mapping des événements Google importés (google-calendar-event-mapper.ts)
 * et par le calcul des jours couverts dans la grille (dateKeysInRange). Utiliser l'heure
 * locale au lieu de minuit UTC ferait apparaître un horaire du type "02:00" dans le détail
 * de l'événement, comme observé sur les imports avant correction.
 */
function toUtcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

function lastInclusiveAllDayDate(endAt: string): Date {
  return new Date(new Date(endAt).getTime() - 24 * 60 * 60 * 1000);
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
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [calendarId, setCalendarId] = useState<string | undefined>(calendars[0]?.id);
  const [eventType, setEventType] = useState<EventType>('other');
  const [date, setDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState(defaultDate);
  const [referenceDate, setReferenceDate] = useState(defaultDate);
  const [isAllDay, setIsAllDay] = useState(false);
  const [startTime, setStartTime] = useState(() => withHours(defaultDate, 9));
  const [endTime, setEndTime] = useState(() => withHours(defaultDate, 10));
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);
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
      setEndDate(event.isAllDay ? lastInclusiveAllDayDate(event.endAt) : new Date(event.startAt));
      setReferenceDate(new Date(event.startAt));
      setIsAllDay(event.isAllDay);
      setStartTime(new Date(event.startAt));
      setEndTime(new Date(event.endAt));
    } else {
      setTitle('');
      setLocation('');
      setNotes('');
      setCalendarId(calendars[0]?.id);
      setEventType('other');
      setDate(defaultDate);
      setEndDate(defaultDate);
      setReferenceDate(defaultDate);
      setIsAllDay(false);
      setStartTime(withHours(defaultDate, 9));
      setEndTime(withHours(defaultDate, 10));
    }
    setExpandedSection(focusDate ? 'date' : null);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, event, focusDate]);

  const resolvedCalendarId = calendarId ?? calendars[0]?.id;
  const resolvedCalendarColor =
    calendars.find((cal) => cal.id === resolvedCalendarId)?.color ?? colors.primary;
  const isMovable = event ? event.isMovable : true;
  const canSubmit = Boolean(title.trim()) && Boolean(resolvedCalendarId) && !isSubmitting;

  const toggleSection = (section: Exclude<ExpandedSection, null>) => {
    setExpandedSection((current) => (current === section ? null : section));
  };

  const handleStartDateChange = (selected: Date) => {
    setDate(selected);
    if (endDate.getTime() < selected.getTime()) setEndDate(selected);
  };

  const handleEndDateChange = (selected: Date) => {
    setEndDate(selected.getTime() < date.getTime() ? date : selected);
  };

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
      const startAt = isAllDay ? toUtcMidnight(date) : combineDateAndTime(date, startTime);
      const endAt = isAllDay
        ? new Date(toUtcMidnight(endDate).getTime() + 24 * 60 * 60 * 1000)
        : combineDateAndTime(date, endTime);
      const payload = {
        calendarId: resolvedCalendarId,
        title: title.trim(),
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        eventType,
        isAllDay,
      };
      const saved = event ? await updateEvent(event.id, payload) : await createEvent(payload);
      onSaved(saved);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolvedCalendarName =
    calendars.find((cal) => cal.id === resolvedCalendarId)?.name ?? 'Aucun calendrier';

  const whenCard = (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionHeading}>Quand</Text>
      <View style={styles.card}>
        <Pressable
          style={styles.cardRow}
          onPress={() => toggleSection('date')}
          accessibilityRole="button"
          accessibilityLabel="Date de l'événement"
        >
          <Text style={styles.cardRowLabel}>Date</Text>
          <View style={styles.cardRowValueGroup}>
            <Text style={styles.cardRowValue}>{date.toLocaleDateString('fr-FR')}</Text>
            <Text style={styles.chevron}>{expandedSection === 'date' ? '▲' : '▼'}</Text>
          </View>
        </Pressable>
        {expandedSection === 'date' && (
          <View style={styles.pickerWrap}>
            <EventDatePicker
              value={date}
              referenceDate={referenceDate}
              selectionColor={resolvedCalendarColor}
              isMovable={isMovable}
              eventType={eventType}
              excludeEventId={event?.id}
              onChange={handleStartDateChange}
            />
          </View>
        )}

        <View style={styles.cardDivider} />

        <Pressable
          style={styles.cardRow}
          onPress={() => setIsAllDay((v) => !v)}
          accessibilityRole="switch"
          accessibilityState={{ checked: isAllDay }}
          accessibilityLabel="Toute la journée"
        >
          <Text style={styles.cardRowLabel}>Toute la journée</Text>
          <View style={[styles.checkbox, isAllDay && styles.checkboxChecked]}>
            {isAllDay && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
          </View>
        </Pressable>

        {isAllDay ? (
          <>
            <View style={styles.cardDivider} />
            <Pressable
              style={styles.cardRow}
              onPress={() => toggleSection('endDate')}
              accessibilityRole="button"
              accessibilityLabel="Jusqu'au"
            >
              <Text style={styles.cardRowLabel}>Jusqu’au</Text>
              <View style={styles.cardRowValueGroup}>
                <Text style={styles.cardRowValue}>{endDate.toLocaleDateString('fr-FR')}</Text>
                <Text style={styles.chevron}>{expandedSection === 'endDate' ? '▲' : '▼'}</Text>
              </View>
            </Pressable>
            {expandedSection === 'endDate' && (
              <View style={styles.pickerWrap}>
                <EventDatePicker
                  value={endDate}
                  referenceDate={referenceDate}
                  selectionColor={resolvedCalendarColor}
                  isMovable={false}
                  eventType={eventType}
                  excludeEventId={event?.id}
                  onChange={handleEndDateChange}
                />
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.cardDivider} />
            <View style={styles.timeRow}>
              <Pressable
                style={styles.timeColumn}
                onPress={() => setActivePicker('start')}
                accessibilityRole="button"
                accessibilityLabel="Heure de début"
              >
                <Text style={styles.cardRowLabel}>Début</Text>
                <Text style={styles.cardRowValue}>
                  {startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </Pressable>
              <View style={styles.timeColumnDivider} />
              <Pressable
                style={styles.timeColumn}
                onPress={() => setActivePicker('end')}
                accessibilityRole="button"
                accessibilityLabel="Heure de fin"
              >
                <Text style={styles.cardRowLabel}>Fin</Text>
                <Text style={styles.cardRowValue}>
                  {endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </View>
  );

  const detailsCard = (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionHeading}>Détails</Text>
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardRowLabel}>Catégorie</Text>
        </View>
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

        <View style={styles.cardDivider} />

        {calendars.length === 0 ? (
          <Text style={styles.hint}>Aucun calendrier disponible.</Text>
        ) : (
          <>
            <Pressable
              style={styles.cardRow}
              onPress={() => toggleSection('calendar')}
              accessibilityRole="button"
              accessibilityLabel="Calendrier"
            >
              <Text style={styles.cardRowLabel}>Calendrier</Text>
              <View style={styles.cardRowValueGroup}>
                <View style={[styles.calendarDot, { backgroundColor: resolvedCalendarColor }]} />
                <Text style={styles.cardRowValue}>{resolvedCalendarName}</Text>
                <Text style={styles.chevron}>{expandedSection === 'calendar' ? '▲' : '▼'}</Text>
              </View>
            </Pressable>
            {expandedSection === 'calendar' &&
              calendars.map((cal) => (
                <View key={cal.id}>
                  <View style={styles.cardDivider} />
                  <Pressable
                    onPress={() => {
                      setCalendarId(cal.id);
                      setExpandedSection(null);
                    }}
                    style={styles.calendarListRow}
                    accessibilityRole="button"
                    accessibilityLabel={`Calendrier ${cal.name}`}
                  >
                    <View style={[styles.calendarDot, { backgroundColor: cal.color }]} />
                    <Text style={styles.calendarListLabel}>{cal.name}</Text>
                    {resolvedCalendarId === cal.id && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </Pressable>
                </View>
              ))}
          </>
        )}

        <View style={styles.cardDivider} />

        <TextInput
          style={styles.cardInput}
          placeholder="Lieu (optionnel)"
          placeholderTextColor={colors.textMuted}
          value={location}
          onChangeText={setLocation}
          accessibilityLabel="Lieu de l'événement"
        />

        <View style={styles.cardDivider} />

        <TextInput
          style={[styles.cardInput, styles.notesInput]}
          placeholder="Notes (optionnel)"
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          accessibilityLabel="Notes de l'événement"
        />
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ScrollView
          style={styles.sheet}
          contentContainerStyle={[styles.sheetContent, { paddingBottom: 24 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{isEditing ? "Modifier l'événement" : 'Nouvel événement'}</Text>

          <TextInput
            style={styles.titleInput}
            placeholder="Titre de l'événement"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            accessibilityLabel="Titre de l'événement"
          />

          {focusDate ? (
            <>
              {whenCard}
              {detailsCard}
            </>
          ) : (
            <>
              {detailsCard}
              {whenCard}
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
  titleInput: {
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 4,
    paddingVertical: 10,
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20,
  },
  sectionBlock: { marginBottom: 16 },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 16,
  },
  cardRowLabel: { fontSize: 14, color: colors.text },
  cardRowValueGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardRowValue: { fontSize: 14, color: colors.textMuted },
  chevron: { fontSize: 10, color: colors.textMuted },
  cardDivider: { height: 1, backgroundColor: colors.border },
  pickerWrap: { paddingHorizontal: 12, paddingBottom: 8 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  hint: { fontSize: 13, color: colors.textMuted, paddingHorizontal: 16, paddingVertical: 12 },
  categoryChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  categoryChip: {
    minHeight: 36,
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
  calendarDot: { width: 10, height: 10, borderRadius: 5 },
  calendarListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
    gap: 10,
  },
  calendarListLabel: { flex: 1, fontSize: 14, color: colors.text },
  cardInput: {
    minHeight: 44,
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.text,
  },
  notesInput: { minHeight: 72, paddingTop: 12, paddingBottom: 12, textAlignVertical: 'top' },
  timeRow: { flexDirection: 'row', minHeight: 56 },
  timeColumn: { flex: 1, paddingHorizontal: 16, paddingVertical: 8, justifyContent: 'center' },
  timeColumnDivider: { width: 1, backgroundColor: colors.border },
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
