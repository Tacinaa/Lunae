import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchEvents, type EventDto } from '../api/calendar';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { toDateKey } from '../utils/calendarGrid';
import { getErrorMessage } from '../utils/errors';
import { colors } from '../utils/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectEvent: (event: EventDto) => void;
}

const DEBOUNCE_MS = 300;
const SNAP_POINTS = ['100%'];

function formatGroupLabel(date: Date): string {
  const formatted = date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatTimeRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
  return `${start.toLocaleTimeString('fr-FR', opts)} - ${end.toLocaleTimeString('fr-FR', opts)}`;
}

export function SearchSheet({ visible, onClose, onSelectEvent }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EventDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query.trim(), DEBOUNCE_MS);

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (!debouncedQuery) {
      setResults([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    searchEvents(debouncedQuery)
      .then((data) => {
        if (!cancelled) setResults(data);
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
  }, [debouncedQuery, visible]);

  const groups = useMemo(() => {
    const map = new Map<string, EventDto[]>();
    results.forEach((event) => {
      const key = toDateKey(new Date(event.startAt));
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [results]);

  const handleDismiss = () => {
    setQuery('');
    setResults([]);
    setError(null);
    onClose();
  };

  if (!visible) return null;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={SNAP_POINTS}
      topInset={insets.top}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      onDismiss={handleDismiss}
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.header}>
          <BottomSheetTextInput
            style={styles.input}
            placeholder="Rechercher..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            accessibilityLabel="Rechercher un événement"
          />
          <Pressable
            style={styles.closeButton}
            onPress={() => sheetRef.current?.dismiss()}
            accessibilityRole="button"
            accessibilityLabel="Fermer la recherche"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        <BottomSheetScrollView
          style={styles.resultsScroll}
          contentContainerStyle={styles.resultsContent}
          keyboardShouldPersistTaps="handled"
        >
          {isLoading && <ActivityIndicator color={colors.primary} style={styles.loader} />}
          {error && <Text style={styles.error}>{error}</Text>}

          {!isLoading && !error && debouncedQuery && groups.length === 0 && (
            <Text style={styles.empty}>Aucun résultat pour « {debouncedQuery} »</Text>
          )}

          {groups.map(([dateKey, events]) => (
            <View key={dateKey} style={styles.group}>
              <Text style={styles.groupLabel}>{formatGroupLabel(new Date(events[0].startAt))}</Text>
              {events.map((event) => (
                <Pressable
                  key={event.id}
                  style={[styles.resultRow, { borderLeftColor: event.calendar?.color ?? colors.primary }]}
                  onPress={() => onSelectEvent(event)}
                  accessibilityRole="button"
                  accessibilityLabel={event.title}
                >
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <Text style={styles.resultTime}>
                    {formatTimeRange(new Date(event.startAt), new Date(event.endAt))}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
        </BottomSheetScrollView>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBackground: { backgroundColor: colors.background },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: { fontSize: 16, color: colors.text },
  resultsScroll: { flex: 1 },
  resultsContent: { paddingHorizontal: 24, paddingBottom: 40 },
  loader: { marginVertical: 12 },
  error: { color: colors.danger, fontSize: 13, marginBottom: 12 },
  empty: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 12 },
  group: { marginBottom: 16 },
  groupLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 8 },
  resultRow: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 8,
    marginBottom: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
  },
  resultTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  resultTime: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
