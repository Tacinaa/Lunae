import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getInvitations,
  respondToInvitation,
  type InvitationDto,
  type InvitationStatus,
} from '../api/invitations';
import { getErrorMessage } from '../utils/errors';
import { colors } from '../utils/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const SNAP_POINTS = ['80%'];

type Tab = 'received' | 'answered';

const STATUS_LABELS: Record<InvitationStatus, string> = {
  pending: 'En attente',
  accepted: 'Accepté',
  declined: 'Refusé',
  maybe: 'Peut-être',
};

function formatDate(date: Date): string {
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

export function InvitationsSheet({ visible, onClose }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('received');
  const [invitations, setInvitations] = useState<InvitationDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    getInvitations()
      .then((data) => {
        if (!cancelled) setInvitations(data);
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
  }, [visible]);

  const filtered = useMemo(
    () =>
      invitations.filter((i) =>
        tab === 'received' ? i.status === 'pending' : i.status !== 'pending',
      ),
    [invitations, tab],
  );

  const handleRespond = (id: string, status: InvitationStatus) => {
    setRespondingId(id);
    respondToInvitation(id, status)
      .then((updated) => {
        setInvitations((prev) => prev.map((i) => (i.id === id ? updated : i)));
      })
      .catch((err: unknown) => setError(getErrorMessage(err)))
      .finally(() => setRespondingId(null));
  };

  const handleDismiss = () => {
    setTab('received');
    setError(null);
    onClose();
  };

  if (!visible) return null;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={SNAP_POINTS}
      topInset={insets.top}
      onDismiss={handleDismiss}
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Invitations</Text>
          <Pressable
            style={styles.closeButton}
            onPress={() => sheetRef.current?.dismiss()}
            accessibilityRole="button"
            accessibilityLabel="Fermer les invitations"
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === 'received' && styles.tabActive]}
            onPress={() => setTab('received')}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === 'received' }}
          >
            <Text style={[styles.tabText, tab === 'received' && styles.tabTextActive]}>Reçues</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'answered' && styles.tabActive]}
            onPress={() => setTab('answered')}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === 'answered' }}
          >
            <Text style={[styles.tabText, tab === 'answered' && styles.tabTextActive]}>Répondues</Text>
          </Pressable>
        </View>

        <BottomSheetScrollView style={styles.listScroll} contentContainerStyle={styles.listContent}>
          {isLoading && <ActivityIndicator color={colors.primary} style={styles.loader} />}
          {error && <Text style={styles.error}>{error}</Text>}

          {!isLoading && !error && filtered.length === 0 && (
            <Text style={styles.empty}>
              {tab === 'received' ? 'Aucune invitation en attente' : 'Aucune invitation répondue'}
            </Text>
          )}

          {filtered.map((invitation) => (
            <View key={invitation.id} style={styles.card}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {invitation.event.title}
              </Text>
              <Text style={styles.cardDate}>{formatDate(new Date(invitation.event.startAt))}</Text>
              <Text style={styles.cardTime}>
                {formatTimeRange(new Date(invitation.event.startAt), new Date(invitation.event.endAt))}
              </Text>

              {tab === 'received' ? (
                <View style={styles.actionsRow}>
                  <Pressable
                    style={styles.maybeButton}
                    disabled={respondingId === invitation.id}
                    onPress={() => handleRespond(invitation.id, 'maybe')}
                    accessibilityRole="button"
                    accessibilityLabel="Peut-être"
                  >
                    <Text style={styles.maybeButtonText}>Peut-être</Text>
                  </Pressable>
                  <Pressable
                    style={styles.declineButton}
                    disabled={respondingId === invitation.id}
                    onPress={() => handleRespond(invitation.id, 'declined')}
                    accessibilityRole="button"
                    accessibilityLabel="Refuser"
                  >
                    <Text style={styles.declineButtonText}>Refuser</Text>
                  </Pressable>
                  <Pressable
                    style={styles.acceptButton}
                    disabled={respondingId === invitation.id}
                    onPress={() => handleRespond(invitation.id, 'accepted')}
                    accessibilityRole="button"
                    accessibilityLabel="Accepter"
                  >
                    <Text style={styles.acceptButtonText}>Accepter</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.statusBadge}>{STATUS_LABELS[invitation.status]}</Text>
              )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: colors.border,
    padding: 4,
  },
  tab: {
    flex: 1,
    minHeight: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: { backgroundColor: colors.background },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.primary },
  listScroll: { flex: 1 },
  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  loader: { marginVertical: 12 },
  error: { color: colors.danger, fontSize: 13, marginBottom: 12 },
  empty: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 24 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  cardDate: { fontSize: 13, color: colors.text, marginBottom: 2 },
  cardTime: { fontSize: 12, color: colors.textMuted, marginBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  maybeButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maybeButtonText: { fontSize: 12.5, color: colors.textMuted, fontWeight: '600' },
  declineButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: { fontSize: 12.5, color: '#FFFFFF', fontWeight: '600' },
  acceptButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: { fontSize: 12.5, color: '#FFFFFF', fontWeight: '600' },
  statusBadge: { fontSize: 12.5, color: colors.textMuted, fontWeight: '600' },
});
