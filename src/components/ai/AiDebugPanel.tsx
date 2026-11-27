// ============================================================================
// AI DEBUG PANEL - Inline status of the last AI call for one feature.
// Renders nothing unless Settings → AI → Debug mode is on.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Bug } from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants';
import { useAppStore } from '../../stores/appStore';
import { useAiDebugStore, type AiFeatureId } from '../../services/pollination/aiDebugLog';
import { AiDebugModal } from './AiDebugModal';

export interface AiDebugPanelProps {
  feature: AiFeatureId;
}

export function AiDebugPanel({ feature }: AiDebugPanelProps) {
  const { t } = useTranslation();
  const enabled = useAppStore((state) => state.settings.aiDebugEnabled === true);
  const entries = useAiDebugStore((state) => state.entries);
  const latest = useMemo(() => entries.find((e) => e.feature === feature), [entries, feature]);
  const [open, setOpen] = useState(false);

  if (!enabled) return null;

  const color = !latest
    ? Colors.muted2
    : latest.status === 'error'
      ? Colors.error
      : latest.status === 'pending'
        ? Colors.warning
        : Colors.success;

  const summary = !latest
    ? t('ai.debug.noCallYet')
    : [
        t(`ai.debug.status.${latest.status}`),
        latest.httpStatus ? `HTTP ${latest.httpStatus}` : null,
        latest.durationMs !== undefined ? `${(latest.durationMs / 1000).toFixed(1)} s` : null,
        latest.model,
      ].filter(Boolean).join(' · ');

  return (
    <>
      <TouchableOpacity style={[styles.panel, { borderColor: color }]} onPress={() => setOpen(true)} activeOpacity={0.75}>
        <Bug size={16} color={color} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.summary, { color }]}>{summary}</Text>
          {latest?.error && (
            <Text style={styles.error} numberOfLines={3}>{latest.error}</Text>
          )}
        </View>
        <Text style={styles.open}>{t('ai.debug.open')}</Text>
      </TouchableOpacity>
      <AiDebugModal visible={open} onClose={() => setOpen(false)} feature={feature} />
    </>
  );
}

const styles = StyleSheet.create({
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    backgroundColor: Colors.overlay,
  },
  summary: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  error: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, lineHeight: 17 },
  open: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text },
});
