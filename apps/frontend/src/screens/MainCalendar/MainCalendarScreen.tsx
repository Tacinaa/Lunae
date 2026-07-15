import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCalendars, getEvents, type CalendarDto, type EventDto } from '../../api/calendar';
import { getPhasesInRange } from '../../api/cycle';
import { CreateEventModal } from '../../components/CreateEventModal';
import { EventDetailSheet } from '../../components/EventDetailSheet';
import { InvitationsSheet } from '../../components/InvitationsSheet';
import { SearchSheet } from '../../components/SearchSheet';
import type { AppStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import type { Phase, PhaseEntry } from '../../store/cycleStore';
import {
  MONTH_LABELS,
  WEEKDAY_LABELS,
  dateKeysInRange,
  getMonthMatrix,
  isSameDay,
  layoutWeekBanners,
  toDateKey,
} from '../../utils/calendarGrid';
import { getErrorMessage } from '../../utils/errors';
import { resetOnboardingSeen } from '../../utils/onboarding';
import { PHASE_LABELS } from '../../utils/phaseRecommendation';
import { colors, getPhaseColor, getPhaseSegmentCount, hexToRgba } from '../../utils/theme';
import { useGoogleCalendarImport } from '../../hooks/useGoogleCalendarImport';

type Props = NativeStackScreenProps<AppStackParamList, 'MainCalendar'>;

const TITLE_MAX_CHARS = 12;
const MAX_BANNER_ROWS = 2;

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function dayAccessibilityLabel(day: Date, phase: Phase | undefined): string {
  const dateLabel = day.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  return phase ? `${dateLabel}, phase ${PHASE_LABELS[phase]}` : dateLabel;
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventDto | null>(null);
  const [editFocusDate, setEditFocusDate] = useState(false);
  const [detailEvent, setDetailEvent] = useState<EventDto | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showInvitations, setShowInvitations] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const {
    startImport: startGoogleImport,
    loading: googleImportLoading,
    error: googleImportError,
  } = useGoogleCalendarImport();

  const weeks = useMemo(() => getMonthMatrix(visibleYear, visibleMonth), [visibleYear, visibleMonth]);
  const rangeStart = weeks[0][0];
  const rangeEnd = weeks[weeks.length - 1][6];

  const refreshCalendars = () => {
    getCalendars()
      .then(setCalendars)
      .catch(() => undefined);
  };

  useEffect(() => {
    refreshCalendars();
  }, []);

  const handleGoogleImport = async () => {
    const result = await startGoogleImport();
    if (result) {
      refreshCalendars();
    }
  };

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

  const visibleEvents = useMemo(
    () => events.filter((e) => !hiddenCalendarIds.has(e.calendarId)),
    [events, hiddenCalendarIds],
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventDto[]>();
    visibleEvents.forEach((e) => {
      const keys = dateKeysInRange(new Date(e.startAt), new Date(e.endAt), e.isAllDay);
      if (keys.length > 1) return; // affiché en bandeau, cf. multiDayEvents
      map.set(keys[0], [...(map.get(keys[0]) ?? []), e]);
    });
    return map;
  }, [visibleEvents]);

  const multiDayEvents = useMemo(
    () =>
      visibleEvents.filter(
        (e) => dateKeysInRange(new Date(e.startAt), new Date(e.endAt), e.isAllDay).length > 1,
      ),
    [visibleEvents],
  );

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

  const handleEventSaved = (event: EventDto) => {
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === event.id);
      return exists ? prev.map((e) => (e.id === event.id ? event : e)) : [...prev, event];
    });
    setShowCreateForm(false);
    setEditingEvent(null);
  };

  const handleEventDeleted = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setDetailEvent(null);
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
          <Pressable
            style={styles.iconButton}
            onPress={() => setShowSearch(true)}
            accessibilityRole="button"
            accessibilityLabel="Recherche"
          >
            <Ionicons name="search" size={26} color={colors.text} />
          </Pressable>
          <Pressable
            style={styles.iconButton}
            onPress={() => setShowInvitations(true)}
            accessibilityRole="button"
            accessibilityLabel="Invitations"
          >
            <Ionicons name="mail-outline" size={26} color={colors.text} />
          </Pressable>
          <Pressable style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Paramètres">
            <Ionicons name="settings-outline" size={26} color={colors.text} />
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
        {weeks.map((week) => {
          const banners = layoutWeekBanners(week, multiDayEvents).slice(0, MAX_BANNER_ROWS);

          return (
            <View key={toDateKey(week[0])} style={styles.weekBlock}>
              <View style={styles.weekRow}>
                {week.map((day) => {
                  const dateKey = toDateKey(day);
                  const phase = phaseByDate.get(dateKey);
                  const isCurrentMonth = day.getUTCMonth() === visibleMonth;
                  const isToday = isSameDay(day, today);
                  return (
                    <View
                      key={dateKey}
                      style={[styles.dayNumberCell, !isCurrentMonth && styles.dayCellOutside]}
                    >
                      <View
                        style={[styles.dayNumberWrap, isToday && styles.todayCircle]}
                        accessible
                        accessibilityLabel={dayAccessibilityLabel(day, phase)}
                      >
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
                    </View>
                  );
                })}
              </View>

              {banners.map((banner) => {
                const calendarColor = banner.event.calendar?.color ?? colors.primary;
                return (
                  <View key={`${banner.event.id}-${banner.row}`} style={styles.bannerRow}>
                    {banner.startCol > 0 && <View style={{ flex: banner.startCol }} />}
                    <Pressable
                      onPress={() => setDetailEvent(banner.event)}
                      style={[styles.banner, { flex: banner.span, backgroundColor: hexToRgba(calendarColor, 0.22) }]}
                      accessibilityRole="button"
                      accessibilityLabel={banner.event.title}
                    >
                      <Text numberOfLines={1} style={[styles.bannerText, { color: calendarColor }]}>
                        {banner.event.title}
                      </Text>
                    </Pressable>
                    {banner.startCol + banner.span < 7 && (
                      <View style={{ flex: 7 - banner.startCol - banner.span }} />
                    )}
                  </View>
                );
              })}

              <View style={styles.weekRow}>
                {week.map((day) => {
                  const dateKey = toDateKey(day);
                  const phase = phaseByDate.get(dateKey);
                  const isCurrentMonth = day.getUTCMonth() === visibleMonth;
                  const dayEvents = eventsByDate.get(dateKey) ?? [];

                  return (
                    <View
                      key={dateKey}
                      style={[styles.dayContentCell, !isCurrentMonth && styles.dayCellOutside]}
                    >
                      {dayEvents.slice(0, 2).map((event) => {
                        const calendarColor = event.calendar?.color ?? colors.primary;
                        return (
                          <Pressable
                            key={event.id}
                            onPress={() => setDetailEvent(event)}
                            style={[styles.eventPill, { backgroundColor: hexToRgba(calendarColor, 0.22) }]}
                            accessibilityRole="button"
                            accessibilityLabel={event.title}
                          >
                            <Text numberOfLines={1} style={[styles.eventPillText, { color: calendarColor }]}>
                              {truncate(event.title, TITLE_MAX_CHARS)}
                            </Text>
                          </Pressable>
                        );
                      })}
                      {phase && (
                        <View style={styles.phaseSegmentsRow}>
                          {Array.from({ length: getPhaseSegmentCount(phase) }).map((_, i) => (
                            <View
                              key={i}
                              style={[styles.phaseSegment, { backgroundColor: getPhaseColor(phase) }]}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          style={styles.bottomButton}
          onPress={goToToday}
          accessibilityRole="button"
          accessibilityLabel="Aujourd'hui"
        >
          <Text style={styles.bottomButtonText}>Aujourd’hui</Text>
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

      {showCalendarFilter && (
        <>
          <Pressable
            style={styles.filterBackdrop}
            onPress={() => setShowCalendarFilter(false)}
            accessibilityRole="button"
            accessibilityLabel="Fermer le filtre des calendriers"
          />
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
                  <View style={styles.filterCheck}>
                    {!hiddenCalendarIds.has(cal.id) && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </View>
                </Pressable>
              ))
            )}
            <View style={styles.filterDivider} />
            {googleImportLoading ? (
              <ActivityIndicator color={colors.primary} style={styles.filterImportLoader} />
            ) : (
              <Pressable
                style={styles.filterImportRow}
                onPress={handleGoogleImport}
                accessibilityRole="button"
                accessibilityLabel="Importer un calendrier Google"
              >
                <Text style={styles.filterImportText}>+ Importer un calendrier Google</Text>
              </Pressable>
            )}
            {googleImportError && <Text style={styles.filterImportError}>{googleImportError}</Text>}
          </View>
        </>
      )}

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
        onPress={() => setShowCreateForm(true)}
        accessibilityRole="button"
        accessibilityLabel="Créer un événement"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <CreateEventModal
        visible={showCreateForm || editingEvent !== null}
        calendars={calendars}
        defaultDate={today}
        event={editingEvent}
        focusDate={editFocusDate}
        onClose={() => {
          setShowCreateForm(false);
          setEditingEvent(null);
          setEditFocusDate(false);
        }}
        onSaved={handleEventSaved}
      />

      <EventDetailSheet
        event={detailEvent}
        phase={detailEvent ? (phaseByDate.get(toDateKey(new Date(detailEvent.startAt))) ?? null) : null}
        onClose={() => setDetailEvent(null)}
        onEdit={(event) => {
          setDetailEvent(null);
          setEditFocusDate(false);
          setEditingEvent(event);
        }}
        onChooseSlot={(event) => {
          setDetailEvent(null);
          setEditFocusDate(true);
          setEditingEvent(event);
        }}
        onDeleted={handleEventDeleted}
      />

      <SearchSheet
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onSelectEvent={(event) => {
          setShowSearch(false);
          setDetailEvent(event);
        }}
      />

      <InvitationsSheet visible={showInvitations} onClose={() => setShowInvitations(false)} />
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
  weekBlock: { marginBottom: 2 },
  weekRow: { flexDirection: 'row' },
  dayNumberCell: {
    flex: 1,
    alignItems: 'stretch',
    paddingHorizontal: 2,
    paddingTop: 4,
  },
  dayContentCell: {
    flex: 1,
    minHeight: 44,
    alignItems: 'stretch',
    paddingHorizontal: 2,
    paddingBottom: 6,
  },
  dayCellOutside: { opacity: 0.35 },
  bannerRow: { flexDirection: 'row', paddingHorizontal: 2, marginTop: 2 },
  banner: {
    borderRadius: 5,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginHorizontal: 1,
  },
  bannerText: { fontSize: 9, fontWeight: '600' },
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
  phaseSegmentsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  phaseSegment: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
  },
  filterBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15,
  },
  filterPanel: {
    position: 'absolute',
    bottom: 84,
    left: 16,
    right: 16,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    zIndex: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  filterEmpty: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 8 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  filterDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  filterLabel: { flex: 1, fontSize: 14, color: colors.text },
  filterCheck: { width: 20, alignItems: 'center', justifyContent: 'center' },
  filterDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  filterImportRow: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterImportText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  filterImportLoader: { marginVertical: 10 },
  filterImportError: {
    fontSize: 12,
    color: colors.danger,
    textAlign: 'center',
    paddingBottom: 4,
  },
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
    minHeight: 44,
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
