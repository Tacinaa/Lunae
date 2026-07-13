import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCalendars, getEvents, type CalendarDto, type EventDto } from '../../api/calendar';
import { getPhasesInRange } from '../../api/cycle';
import { CreateEventModal } from '../../components/CreateEventModal';
import type { AppStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import type { Phase, PhaseEntry } from '../../store/cycleStore';
import { getMonthMatrix, isSameDay, toDateKey } from '../../utils/calendarGrid';
import { getErrorMessage } from '../../utils/errors';
import { resetOnboardingSeen } from '../../utils/onboarding';
import { colors, getPhaseColor, hexToRgba } from '../../utils/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'MainCalendar'>;

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTH_LABELS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];
const TITLE_MAX_CHARS = 12;

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function MainCalendarScreen(_props: Props) {
  const today = useMemo(() => new Date(), []);
  const [visibleYear, setVisibleYear] = useState(today.getUTCFullYear());
  const [visibleMonth, setVisibleMonth] = useState(today.getUTCMonth());

  const [calendars, setCalendars] = useState<CalendarDto[]>([]);
  const [hiddenCalendarIds, setHiddenCalendarIds] = useState<Set<string>>(new Set());
  const [events, setEvents] = useState<EventDto[]>([]);
  const [phases, setPhases] = useState<PhaseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCalendarFilter, setShowCalendarFilter] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const logout = useAuthStore((state) => state.logout);

  const weeks = useMemo(() => getMonthMatrix(visibleYear, visibleMonth), [visibleYear, visibleMonth]);
  const rangeStart = weeks[0][0];
  const rangeEnd = weeks[weeks.length - 1][6];

  useEffect(() => {
    getCalendars()
      .then(setCalendars)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      getEvents(rangeStart.toISOString(), rangeEnd.toISOString()),
      getPhasesInRange(toDateKey(rangeStart), toDateKey(rangeEnd)),
    ])
      .then(([fetchedEvents, fetchedPhases]) => {
        if (cancelled) return;
        setEvents(fetchedEvents);
        setPhases(fetchedPhases);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStart.getTime(), rangeEnd.getTime()]);

  const phaseByDate = useMemo(() => {
    const map = new Map<string, Phase>();
    phases.forEach((p) => map.set(p.date.split('T')[0], p.phase));
    return map;
  }, [phases]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventDto[]>();
    events
      .filter((e) => !hiddenCalendarIds.has(e.calendarId))
      .forEach((e) => {
        const key = toDateKey(new Date(e.startAt));
        const list = map.get(key) ?? [];
        list.push(e);
        map.set(key, list);
      });
    return map;
  }, [events, hiddenCalendarIds]);

  const goToPreviousMonth = () => {
    const prev = new Date(Date.UTC(visibleYear, visibleMonth - 1, 1));
    setVisibleYear(prev.getUTCFullYear());
    setVisibleMonth(prev.getUTCMonth());
  };

  const goToNextMonth = () => {
    const next = new Date(Date.UTC(visibleYear, visibleMonth + 1, 1));
    setVisibleYear(next.getUTCFullYear());
    setVisibleMonth(next.getUTCMonth());
  };

  const goToToday = () => {
    setVisibleYear(today.getUTCFullYear());
    setVisibleMonth(today.getUTCMonth());
  };

  const toggleCalendar = (id: string) => {
    setHiddenCalendarIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleEventCreated = (event: EventDto) => {
    setEvents((prev) => [...prev, event]);
    setCreateModalVisible(false);
  };

  const handleResetForTesting = () => {
    void resetOnboardingSeen();
    logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.appTitle}>Lunae</Text>
        <View style={styles.topBarIcons}>
          <Pressable style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Recherche">
            <Text style={styles.icon}>🔍</Text>
          </Pressable>
          <Pressable style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Invitations">
            <Text style={styles.icon}>📥</Text>
          </Pressable>
          <Pressable style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Paramètres">
            <Text style={styles.icon}>⚙️</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.monthNav}>
        <Pressable
          style={styles.navButton}
          onPress={goToPreviousMonth}
          accessibilityRole="button"
          accessibilityLabel="Mois précédent"
        >
          <Text style={styles.navButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.monthLabel}>
          {MONTH_LABELS[visibleMonth]} {visibleYear}
        </Text>
        <Pressable
          style={styles.navButton}
          onPress={goToNextMonth}
          accessibilityRole="button"
          accessibilityLabel="Mois suivant"
        >
          <Text style={styles.navButtonText}>›</Text>
        </Pressable>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text key={`${label}-${i}`} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      <ScrollView style={styles.grid} contentContainerStyle={styles.gridContent}>
        {isLoading && <ActivityIndicator color={colors.primary} style={styles.loader} />}
        {weeks.map((week) => (
          <View key={toDateKey(week[0])} style={styles.weekRow}>
            {week.map((day) => {
              const dateKey = toDateKey(day);
              const phase = phaseByDate.get(dateKey);
              const isCurrentMonth = day.getUTCMonth() === visibleMonth;
              const isToday = isSameDay(day, today);
              const dayEvents = eventsByDate.get(dateKey) ?? [];

              return (
                <View key={dateKey} style={[styles.dayCell, !isCurrentMonth && styles.dayCellOutside]}>
                  <View style={[styles.dayNumberWrap, isToday && styles.todayCircle]}>
                    <Text
                      style={[
                        styles.dayNumber,
                        !isCurrentMonth && styles.dayNumberOutside,
                        isToday && styles.todayNumber,
                      ]}
                    >
                      {day.getUTCDate()}
                    </Text>
                  </View>
                  {dayEvents.slice(0, 2).map((event) => {
                    const calendarColor = event.calendar?.color ?? colors.primary;
                    return (
                      <View
                        key={event.id}
                        style={[styles.eventPill, { backgroundColor: hexToRgba(calendarColor, 0.22) }]}
                      >
                        <Text numberOfLines={1} style={[styles.eventPillText, { color: calendarColor }]}>
                          {truncate(event.title, TITLE_MAX_CHARS)}
                        </Text>
                      </View>
                    );
                  })}
                  {phase && (
                    <View style={[styles.phaseLine, { backgroundColor: getPhaseColor(phase) }]} />
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {showCalendarFilter && (
        <View style={styles.filterPanel}>
          {calendars.length === 0 ? (
            <Text style={styles.filterEmpty}>Aucun calendrier</Text>
          ) : (
            calendars.map((cal) => (
              <Pressable
                key={cal.id}
                style={styles.filterRow}
                onPress={() => toggleCalendar(cal.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: !hiddenCalendarIds.has(cal.id) }}
                accessibilityLabel={cal.name}
              >
                <View style={[styles.filterDot, { backgroundColor: cal.color }]} />
                <Text style={styles.filterLabel}>{cal.name}</Text>
                <Text style={styles.filterCheck}>{hiddenCalendarIds.has(cal.id) ? '' : '✓'}</Text>
              </Pressable>
            ))
          )}
        </View>
      )}

      <View style={styles.bottomBar}>
        <Pressable
          style={styles.bottomButton}
          onPress={goToToday}
          accessibilityRole="button"
          accessibilityLabel="Aujourd'hui"
        >
          <Text style={styles.bottomButtonText}>Aujourd'hui</Text>
        </Pressable>
        <Pressable
          style={styles.bottomButton}
          onPress={() => setShowCalendarFilter((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel="Calendriers"
        >
          <Text style={styles.bottomButtonText}>Calendriers</Text>
        </Pressable>
      </View>

      {__DEV__ && (
        <Pressable
          style={styles.devButton}
          onPress={handleResetForTesting}
          accessibilityRole="button"
          accessibilityLabel="Réinitialiser le parcours (dev)"
        >
          <Text style={styles.devButtonText}>Réinitialiser (dev)</Text>
        </Pressable>
      )}

      <Pressable
        style={styles.fab}
        onPress={() => setCreateModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Créer un événement"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <CreateEventModal
        visible={createModalVisible}
        calendars={calendars}
        defaultDate={today}
        onClose={() => setCreateModalVisible(false)}
        onCreated={handleEventCreated}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  appTitle: { fontSize: 20, fontWeight: '700', color: colors.primary },
  topBarIcons: { flexDirection: 'row' },
  iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 18 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  navButtonText: { fontSize: 24, color: colors.primary, fontWeight: '600' },
  monthLabel: { fontSize: 17, fontWeight: '700', color: colors.text, marginHorizontal: 12 },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center', marginBottom: 8 },
  weekdayRow: { flexDirection: 'row', paddingHorizontal: 8 },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  grid: { flex: 1 },
  gridContent: { paddingHorizontal: 8, paddingBottom: 16 },
  loader: { marginVertical: 8 },
  weekRow: { flexDirection: 'row' },
  dayCell: {
    flex: 1,
    minHeight: 68,
    alignItems: 'stretch',
    paddingHorizontal: 2,
    paddingTop: 4,
    paddingBottom: 6,
  },
  dayCellOutside: { opacity: 0.35 },
  dayNumberWrap: {
    alignSelf: 'center',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: { backgroundColor: colors.primary },
  dayNumber: { fontSize: 13, color: colors.text },
  dayNumberOutside: { color: colors.textMuted },
  todayNumber: { color: '#FFFFFF', fontWeight: '700' },
  eventPill: {
    borderRadius: 5,
    paddingHorizontal: 3,
    paddingVertical: 1,
    marginTop: 3,
  },
  eventPillText: { fontSize: 8.5, fontWeight: '600' },
  phaseLine: {
    height: 3,
    borderRadius: 1.5,
    marginTop: 4,
  },
  filterPanel: {
    position: 'absolute',
    bottom: 76,
    left: 16,
    right: 16,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  filterEmpty: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 8 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  filterDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  filterLabel: { flex: 1, fontSize: 14, color: colors.text },
  filterCheck: { fontSize: 14, color: colors.primary, fontWeight: '700', width: 20 },
  bottomBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  bottomButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  bottomButtonText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  devButton: {
    position: 'absolute',
    left: 16,
    bottom: 84,
    minHeight: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devButtonText: { color: colors.textMuted, fontSize: 11 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 84,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  fabText: { fontSize: 28, color: '#FFFFFF', fontWeight: '600', marginTop: -2 },
});
