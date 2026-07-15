import { BottomSheetModal, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { deleteEvent, type EventDto } from '../api/calendar';
import type { Phase } from '../store/cycleStore';
import { getErrorMessage } from '../utils/errors';
import { CATEGORY_LABELS, isUnfavorablePhase, PHASE_LABELS } from '../utils/phaseRecommendation';
import { renderSheetBackdrop } from './SheetBackdrop';
import { colors } from '../utils/theme';

interface Props {
  event: EventDto | null;
  phase: Phase | null;
  onClose: () => void;
  onEdit: (event: EventDto) => void;
  onChooseSlot: (event: EventDto) => void;
  onDeleted: (eventId: string) => void;
}

const SNAP_POINTS = ['80%'];

function formatDate(date: Date): string {
  const formatted = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatTimeRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
  return `${start.toLocaleTimeString('fr-FR', opts)} - ${end.toLocaleTimeString('fr-FR', opts)}`;
}

/**
 * Les événements journée entière n'ont pas d'heure significative : startAt/endAt sont
 * ancrés à minuit UTC (convention Google, endAt exclusif). Formater en fuseau local
 * (comme formatDate) ferait apparaître "02:00" au lieu de rien, et pourrait même faire
 * glisser la date affichée d'un jour selon le fuseau de l'appareil — on force donc UTC.
 */
function formatAllDayDate(date: Date): string {
  const formatted = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatAllDayDateShort(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

function lastInclusiveAllDayDate(endAt: string): Date {
  return new Date(new Date(endAt).getTime() - 24 * 60 * 60 * 1000);
}

function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function EventDetailSheet({ event, phase, onClose, onEdit, onChooseSlot, onDeleted }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    if (event) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
    setBannerDismissed(false);
  }, [event]);

  if (!event) return null;

  const isImported = event.calendar?.source && event.calendar.source !== 'local';
  const isUnfavorable = event.isMovable && isUnfavorablePhase(event.eventType, phase);

  const handleDelete = () => {
    Alert.alert(
      isImported ? 'Se désinscrire ?' : "Supprimer l'événement ?",
      event.title,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: isImported ? 'Se désinscrire' : 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteEvent(event.id)
              .then(() => onDeleted(event.id))
              .catch((err: unknown) => Alert.alert('Erreur', getErrorMessage(err)));
          },
        },
      ],
    );
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={SNAP_POINTS}
      enableDynamicSizing={false}
      backdropComponent={renderSheetBackdrop}
      onDismiss={onClose}
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetView style={styles.container}>
        <BottomSheetScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text style={styles.title}>{event.title}</Text>

          {event.notes ? <Text style={styles.notes}>{event.notes}</Text> : null}

          <Text style={styles.date}>
            {event.isAllDay
              ? isSameUtcDay(new Date(event.startAt), lastInclusiveAllDayDate(event.endAt))
                ? formatAllDayDate(new Date(event.startAt))
                : `${formatAllDayDateShort(new Date(event.startAt))} → ${formatAllDayDate(lastInclusiveAllDayDate(event.endAt))}`
              : formatDate(new Date(event.startAt))}
          </Text>

          {!event.isMovable ? (
            <View style={styles.phaseRow}>
              <Text style={styles.phaseIconNeutral}>⊘</Text>
              <Text style={styles.phaseTextNeutral}>Non concerné avec la phase du cycle</Text>
            </View>
          ) : isUnfavorable ? (
            <>
              <View style={styles.phaseRow}>
                <Text style={styles.phaseIconWarning}>⊗</Text>
                <Text style={styles.phaseTextWarning}>Incompatible avec la phase du cycle</Text>
              </View>
              {!bannerDismissed && (
                <View style={styles.banner}>
                  <Text style={styles.bannerText}>
                    Nous vous recommandons de déplacer{' '}
                    <Text style={styles.bannerTextBold}>{event.title}</Text> : la phase{' '}
                    {phase ? PHASE_LABELS[phase] : ''} n’est pas idéale pour un événement de type{' '}
                    {CATEGORY_LABELS[event.eventType]}.
                  </Text>
                  <View style={styles.bannerActions}>
                    <Pressable
                      style={styles.bannerIgnoreButton}
                      onPress={() => setBannerDismissed(true)}
                      accessibilityRole="button"
                      accessibilityLabel="Garder la date actuelle"
                    >
                      <Text style={styles.bannerIgnoreText}>Garder cette date</Text>
                    </Pressable>
                    <Pressable
                      style={styles.bannerMoveButton}
                      onPress={() => onChooseSlot(event)}
                      accessibilityRole="button"
                      accessibilityLabel="Choisir un autre créneau"
                    >
                      <Text style={styles.bannerMoveText}>Choisir un créneau</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </>
          ) : null}

          <Text style={styles.time}>
            {event.isAllDay
              ? 'Toute la journée'
              : formatTimeRange(new Date(event.startAt), new Date(event.endAt))}
          </Text>

          {event.location ? <Text style={styles.location}>{event.location}</Text> : null}

          {event.calendar && (
            <View style={styles.calendarRow}>
              <Text style={styles.fieldLabel}>Calendrier</Text>
              <View style={styles.calendarValue}>
                <View style={[styles.calendarDot, { backgroundColor: event.calendar.color }]} />
                <Text style={styles.calendarName}>{event.calendar.name}</Text>
              </View>
            </View>
          )}
        </BottomSheetScrollView>

        <View style={styles.actionsRow}>
          {isImported ? (
            <Pressable
              style={styles.deleteButton}
              onPress={handleDelete}
              accessibilityRole="button"
              accessibilityLabel="Se désinscrire"
            >
              <Text style={styles.deleteButtonText}>Se désinscrire</Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                style={styles.deleteButton}
                onPress={handleDelete}
                accessibilityRole="button"
                accessibilityLabel="Supprimer"
              >
                <Text style={styles.deleteButtonText}>Supprimer</Text>
              </Pressable>
              <Pressable
                style={styles.editButton}
                onPress={() => onEdit(event)}
                accessibilityRole="button"
                accessibilityLabel="Modifier"
              >
                <Text style={styles.editButtonText}>Modifier</Text>
              </Pressable>
            </>
          )}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBackground: { backgroundColor: colors.background },
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 8 },
  notes: { fontSize: 14, color: colors.textMuted, marginBottom: 16, lineHeight: 20 },
  date: { fontSize: 14, color: colors.text, marginBottom: 8 },
  phaseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  phaseIconWarning: { color: colors.danger, fontSize: 14, marginRight: 6 },
  phaseTextWarning: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  phaseIconNeutral: { color: colors.textMuted, fontSize: 14, marginRight: 6 },
  phaseTextNeutral: { color: colors.textMuted, fontSize: 13 },
  banner: { marginTop: 8, marginBottom: 12, padding: 14, borderRadius: 12, backgroundColor: colors.border },
  bannerText: { fontSize: 12.5, color: colors.text, lineHeight: 18, marginBottom: 12 },
  bannerTextBold: { fontWeight: '700' },
  bannerActions: { flexDirection: 'row', gap: 10 },
  bannerIgnoreButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIgnoreText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  bannerMoveButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerMoveText: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },
  time: { fontSize: 14, color: colors.text, marginBottom: 8 },
  location: { fontSize: 14, color: colors.text, marginBottom: 16 },
  calendarRow: { marginTop: 8, marginBottom: 24 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 8 },
  calendarValue: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  calendarDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  calendarName: { fontSize: 14, color: colors.text },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deleteButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  editButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
