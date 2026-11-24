// ============================================================================
// AI TEXT READER - Full-screen, large-print view of an AI answer
// ============================================================================

import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { Bot, Check, Copy, X } from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants';

export interface AiTextReaderProps {
  visible: boolean;
  title: string;
  /** Main AI text; shown in large print */
  text: string;
  /** Optional bullet points shown under the text (e.g. meal suggestions, plan points) */
  points?: string[];
  onClose: () => void;
}

export function AiTextReader({ visible, title, text, points, onClose }: AiTextReaderProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const full = points && points.length > 0 ? `${text}\n\n${points.map((p) => `• ${p}`).join('\n')}` : text;
    await Clipboard.setStringAsync(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Bot size={22} color={Colors.violet} />
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
          </View>
          <TouchableOpacity
            onPress={handleCopy}
            style={styles.iconBtn}
            accessibilityLabel={t('ai.reader.copy')}
          >
            {copied ? <Check size={20} color={Colors.success} /> : <Copy size={20} color={Colors.text} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn} accessibilityLabel={t('common.close')}>
            <X size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.text} selectable>{text}</Text>
          {points && points.length > 0 && (
            <View style={styles.points}>
              {points.map((point, index) => (
                <View key={`${point}-${index}`} style={styles.pointRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.pointText} selectable>{point}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export interface AiExpandButtonProps {
  onPress: () => void;
  color?: string;
}

/** Small "open in full screen" button for AI cards. */
export function AiExpandButton({ onPress, color = Colors.violet }: AiExpandButtonProps) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.expandBtn}
      accessibilityLabel={t('ai.reader.expand')}
      hitSlop={8}
    >
      <Text style={[styles.expandText, { color }]}>{t('ai.reader.expand')}</Text>
    </TouchableOpacity>
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
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { flex: 1, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.overlayWhite08,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: Spacing.xxl, paddingBottom: 60 },
  text: { fontSize: 19, lineHeight: 30, color: Colors.text },
  points: { marginTop: Spacing.xxl, gap: Spacing.lg },
  pointRow: { flexDirection: 'row', gap: Spacing.md },
  bullet: { fontSize: 19, lineHeight: 30, color: Colors.violet },
  pointText: { flex: 1, fontSize: 18, lineHeight: 28, color: Colors.textSecondary },
  expandBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.overlayViolet15,
  },
  expandText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
});
