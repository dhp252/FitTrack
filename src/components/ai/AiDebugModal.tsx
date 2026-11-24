// ============================================================================
// AI DEBUG MODAL - Lists recorded AI calls with request, response and error
// ============================================================================

import React, { useMemo, useState } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { Bug, Check, ChevronDown, ChevronUp, Copy, Trash2, X } from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants';
import {
  formatAiDebugEntry,
  useAiDebugStore,
  type AiDebugEntry,
  type AiFeatureId,
} from '../../services/pollination/aiDebugLog';

export interface AiDebugModalProps {
  visible: boolean;
  onClose: () => void;
  /** Show only this feature's calls; all calls when omitted */
  feature?: AiFeatureId;
}

function statusColor(entry: AiDebugEntry): string {
  if (entry.status === 'error') return Colors.error;
  if (entry.status === 'pending') return Colors.warning;
  return Colors.success;
}

function EntryCard({ entry, initiallyOpen }: { entry: AiDebugEntry; initiallyOpen: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(initiallyOpen);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(formatAiDebugEntry(entry));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const meta = [
    new Date(entry.startedAt).toLocaleTimeString(),
    entry.model,
    entry.httpStatus ? `HTTP ${entry.httpStatus}` : null,
    entry.durationMs !== undefined ? `${(entry.durationMs / 1000).toFixed(1)} s` : null,
    entry.cached ? t('ai.debug.cached') : null,
  ].filter(Boolean).join(' · ');

  return (
    <View style={[styles.card, { borderColor: statusColor(entry) }]}>
      <TouchableOpacity style={styles.cardHeader} onPress={() => setOpen((v) => !v)} activeOpacity={0.7}>
        <View style={[styles.dot, { backgroundColor: statusColor(entry) }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>
            {t(`ai.debug.features.${entry.feature}`)} · {t(`ai.debug.status.${entry.status}`)}
          </Text>
          <Text style={styles.cardMeta}>{meta}</Text>
        </View>
        {open ? <ChevronUp size={20} color={Colors.muted} /> : <ChevronDown size={20} color={Colors.muted} />}
      </TouchableOpacity>

      {entry.error && <Text style={styles.errorText} selectable>{entry.error}</Text>}
      {entry.notes.filter((n) => n !== entry.error).map((note, i) => (
        <Text key={`${note}-${i}`} style={styles.noteText} selectable>• {note}</Text>
      ))}

      {open && (
        <View style={styles.details}>
          <Text style={styles.label}>{t('ai.debug.endpoint')}</Text>
          <Text style={styles.mono} selectable>{entry.endpoint}</Text>
          <Text style={styles.label}>{t('ai.debug.request')}</Text>
          <Text style={styles.mono} selectable>{entry.request}</Text>
          <Text style={styles.label}>{t('ai.debug.response')}</Text>
          <Text style={styles.mono} selectable>{entry.response ?? t('ai.debug.noResponse')}</Text>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
            {copied ? <Check size={16} color={Colors.success} /> : <Copy size={16} color={Colors.text} />}
            <Text style={styles.copyText}>{copied ? t('ai.debug.copied') : t('ai.debug.copy')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export function AiDebugModal({ visible, onClose, feature }: AiDebugModalProps) {
  const { t } = useTranslation();
  const allEntries = useAiDebugStore((state) => state.entries);
  const clear = useAiDebugStore((state) => state.clear);
  const entries = useMemo(
    () => (feature ? allEntries.filter((e) => e.feature === feature) : allEntries),
    [allEntries, feature],
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Bug size={22} color={Colors.warning} />
          <Text style={styles.title}>
            {feature ? t(`ai.debug.features.${feature}`) : t('ai.debug.title')}
          </Text>
          <TouchableOpacity onPress={clear} style={styles.iconBtn} accessibilityLabel={t('ai.debug.clear')}>
            <Trash2 size={20} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn} accessibilityLabel={t('common.close')}>
            <X size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.hint}>{t('ai.debug.hint')}</Text>
          {entries.length === 0 ? (
            <Text style={styles.empty}>{t('ai.debug.empty')}</Text>
          ) : (
            entries.map((entry, index) => (
              <EntryCard key={entry.id} entry={entry} initiallyOpen={index === 0 && entry.status === 'error'} />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.stroke,
  },
  title: { flex: 1, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.overlayWhite08,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 60 },
  hint: { fontSize: FontSize.sm, color: Colors.muted2, lineHeight: 18 },
  empty: { fontSize: FontSize.xl, color: Colors.muted, textAlign: 'center', marginTop: Spacing.xxxl },
  card: {
    backgroundColor: Colors.cardSolid,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5 },
  cardTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.text },
  cardMeta: { fontSize: FontSize.sm, color: Colors.muted2, marginTop: 2 },
  errorText: { fontSize: FontSize.lg, color: Colors.error, lineHeight: 20 },
  noteText: { fontSize: FontSize.md, color: Colors.warning, lineHeight: 18 },
  details: { gap: Spacing.xs, marginTop: Spacing.sm },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.sm,
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    backgroundColor: Colors.overlay,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.overlayWhite08,
  },
  copyText: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.semibold },
});
