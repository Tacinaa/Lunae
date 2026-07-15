import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getEvents, type EventDto, type EventType } from '../api/calendar';
import { getPhasesInRange } from '../api/cycle';
import type { Phase, PhaseEntry } from '../store/cycleStore';
import { MONTH_LABELS, WEEKDAY_LABELS, getMonthMatrix, isSameDay, toDateKey } from '../utils/calendarGrid';
import { isOptimalPhase, isUnfavorablePhase } from '../utils/phaseRecommendation';
import { colors, getPhaseColor } from '../utils/theme';

interface Props {
  value: Date;
  /** Date d'origine de l'événement, utilisée pour décider si des suggestions doivent être
   * affichées — reste fixe pendant la session d'édition, contrairement à `value` qui change
   * à chaque jour survolé/sélectionné, pour ne pas faire disparaître les suggestions dès
   * qu'on clique sur un jour favorable. */
  referenceDate: Date;
  selectionColor: string;
  isMovable: boolean;
  eventType: EventType;
  excludeEventId?: string;
  onChange: (date: Date) => void;
}

const LOOKAHEAD_DAYS = 40;
const MAX_DOTS = 3;

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function EventDatePicker({
  value,
  referenceDate,
  selectionColor,
  isMovable,
  eventType,
  excludeEventId,
  onChange,
}: Props) {
  const [visibleYear, setVisibleYear] = useState(value.getFullYear());
  const [visibleMonth, setVisibleMonth] = useState(value.getMonth());
  const [phases, setPhases] = useState<PhaseEntry[]>([]);
  const [events, setEvents] = useState<EventDto[]>([]);

  const today = useMemo(() => startOfToday(), []);
  const weeks = useMemo(() => getMonthMatrix(visibleYear, visibleMonth), [visibleYear, visibleMonth]);
  const gridStart = weeks[0][0];
  const gridEnd = weeks[weeks.length - 1][6];

  useEffect(() => {
    const lookahead = new Date(today);
    lookahead.setDate(lookahead.getDate() + LOOKAHEAD_DAYS);
    // Couvre toujours aujourd'hui→+40j et la date de référence, en plus du mois affiché,
    // pour que le statut "favorable/défavorable" de referenceDate reste connu même si on
    // navigue loin d'elle dans le mini-calendrier.
    const rangeStart = new Date(Math.min(gridStart.getTime(), today.getTime(), referenceDate.getTime()));
    const rangeEnd = new Date(Math.max(gridEnd.getTime(), lookahead.getTime(), referenceDate.getTime()));

    getPhasesInRange(toDateKey(rangeStart), toDateKey(rangeEnd))
      .then(setPhases)
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridStart.getTime(), gridEnd.getTime(), referenceDate.getTime()]);

  useEffect(() => {
    getEvents(gridStart.toISOString(), gridEnd.toISOString())
      .then(setEvents)
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridStart.getTime(), gridEnd.getTime()]);

  const phaseByDate = useMemo(() => {
    const map = new Map<string, Phase>();
    phases.forEach((p) => map.set(p.date.split('T')[0], p.phase));
    return map;
  }, [phases]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventDto[]>();
    events
      .filter((e) => e.id !== excludeEventId)
      .forEach((e) => {
        const key = toDateKey(new Date(e.startAt));
        const list = map.get(key) ?? [];
        list.push(e);
        map.set(key, list);
      });
    return map;
  }, [events, excludeEventId]);

  const referencePhase = phaseByDate.get(toDateKey(referenceDate)) ?? null;
  const showSuggestions = isMovable && isUnfavorablePhase(eventType, referencePhase);

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

  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        <Pressable
          onPress={goToPreviousMonth}
          style={styles.navButton}
          accessibilityRole="button"
          accessibilityLabel="Mois précédent"
        >
          <Text style={styles.navButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.navLabel}>
          {MONTH_LABELS[visibleMonth]} {visibleYear}
        </Text>
        <Pressable
          onPress={goToNextMonth}
          style={styles.navButton}
          accessibilityRole="button"
          accessibilityLabel="Mois suivant"
        >
          <Text style={styles.navButtonText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text key={`${label}-${i}`} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      {weeks.map((week) => (
        <View key={toDateKey(week[0])} style={styles.weekRow}>
          {week.map((day) => {
            const dateKey = toDateKey(day);
            const isCurrentMonth = day.getMonth() === visibleMonth;
            const isSelected = isSameDay(day, value);
            const isPast = day < today;
            const phase = phaseByDate.get(dateKey);
            const isSuggested =
              showSuggestions && !isSelected && !isPast && isOptimalPhase(eventType, phase);
            const dayEvents = eventsByDate.get(dateKey) ?? [];

            return (
              <Pressable
                key={dateKey}
                onPress={() => onChange(day)}
                disabled={isPast}
                style={styles.dayCell}
                accessibilityRole="button"
                accessibilityLabel={day.toLocaleDateString('fr-FR')}
              >
                <View style={styles.dayCircleWrap}>
                  {/* Fond du rond dans une vue séparée, en position absolute derrière le
                   * texte : sur Android, `overflow: hidden` + `borderRadius` appliqués à la
                   * même vue que le texte peut faire disparaître ce dernier (bug de
                   * compositing). Le texte reste dans une vue non-clippée, toujours peint
                   * par-dessus. */}
                  <View
                    style={[
                      styles.dayCircleBg,
                      isSuggested &&
                        phase && {
                          backgroundColor: colors.background,
                          borderWidth: 1.5,
                          borderColor: getPhaseColor(phase),
                        },
                      isSelected && { backgroundColor: selectionColor },
                    ]}
                  />
                  <Text
                    style={[
                      styles.dayNumber,
                      !isCurrentMonth && styles.dayNumberOutside,
                      isPast && styles.dayNumberPast,
                      isSelected && styles.dayNumberSelected,
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                </View>
                <View style={styles.dotsRow}>
                  {dayEvents.slice(0, MAX_DOTS).map((event) => (
                    <View
                      key={event.id}
                      style={[styles.dot, { backgroundColor: event.calendar?.color ?? colors.primary }]}
                    />
                  ))}
                  {dayEvents.length > MAX_DOTS && <Text style={styles.dotOverflow}>+</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  navButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  navButtonText: { fontSize: 18, color: colors.primary, fontWeight: '600' },
  navLabel: { fontSize: 14, fontWeight: '700', color: colors.text, marginHorizontal: 8 },
  weekdayRow: { flexDirection: 'row' },
  weekdayLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: colors.textMuted },
  weekRow: { flexDirection: 'row' },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: 3 },
  dayCircleWrap: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleBg: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
  },
  dayNumber: { fontSize: 12, color: colors.text },
  dayNumberOutside: { color: colors.textMuted, opacity: 0.4 },
  dayNumberPast: { color: colors.textMuted, opacity: 0.35 },
  dayNumberSelected: { color: '#FFFFFF', fontWeight: '700' },
  dotsRow: { flexDirection: 'row', height: 6, marginTop: 2, alignItems: 'center', gap: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  dotOverflow: { fontSize: 8, color: colors.textMuted, fontWeight: '700', marginLeft: 1 },
});
