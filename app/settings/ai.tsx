// ============================================================================
// SETTINGS - AI SUB-SCREEN (Pollinations connection, features, debug)
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Bot,
  Sparkles,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Activity,
  Shield,
  Info,
  UtensilsCrossed,
  Bug,
  Power,
} from 'lucide-react-native';
import { GlassCard } from '../../src/components/ui';
import { AiDebugModal } from '../../src/components/ai';
import { useAppStore } from '../../src/stores';
import {
  isPollinationConnected,
  startPollinationAuth,
  removePollinationApiKey,
} from '../../src/services/pollination';
import { POLLINATION_MODELS } from '../../src/services/pollination/textAnalysis';
import { useAiDebugStore } from '../../src/services/pollination/aiDebugLog';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants';

interface ToggleRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  activeColor?: string;
}

function ToggleRow({ icon, title, subtitle, value, onValueChange, disabled, activeColor = Colors.violet }: ToggleRowProps) {
  return (
    <View style={[styles.settingItem, disabled && styles.settingItemDisabled]}>
      <View style={[styles.settingIconContainer, { backgroundColor: Colors.overlayViolet15 }]}>
        {icon}
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.card, true: activeColor }}
        thumbColor={Colors.white}
        disabled={disabled}
      />
    </View>
  );
}

export default function AISettingsScreen() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useAppStore();
  const debugEntryCount = useAiDebugStore((state) => state.entries.length);
  const [pollinationStatus, setPollinationStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [modelPickerVisible, setModelPickerVisible] = useState(false);
  const [tonePickerVisible, setTonePickerVisible] = useState(false);
  const [debugLogVisible, setDebugLogVisible] = useState(false);

  const aiEnabled = settings.aiFeaturesEnabled ?? false;
  const connected = pollinationStatus === 'connected';
  const featuresLocked = !aiEnabled || !connected;

  // Re-check the key each time the screen is shown (the OAuth callback lands on another route).
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void isPollinationConnected().then((isConnected) => {
        if (cancelled) return;
        setPollinationStatus(isConnected ? 'connected' : 'disconnected');
        updateSettings({ pollinationConnected: isConnected });
      });
      return () => { cancelled = true; };
    }, [updateSettings]),
  );

  const handleConnectPollination = useCallback(async () => {
    try {
      await startPollinationAuth();
    } catch (error) {
      Alert.alert(t('common.error'), `${t('settings.pollination.errorMessage')}\n\n${String(error)}`);
    }
  }, [t]);

  const handleDisconnectPollination = useCallback(() => {
    Alert.alert(
      t('settings.pollination.disconnectTitle'),
      t('settings.pollination.disconnectMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.pollination.disconnect'),
          style: 'destructive',
          onPress: async () => {
            await removePollinationApiKey();
            setPollinationStatus('disconnected');
            updateSettings({ pollinationConnected: false });
          },
        },
      ],
    );
  }, [t, updateSettings]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.delay(50)} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>{t('settings.aiTab')}</Text>
          <View style={styles.betaBadge}>
            <Text style={styles.betaBadgeText}>{t('common.badge.beta')}</Text>
          </View>
        </Animated.View>

        {/* AI Info Card */}
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <GlassCard style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Info size={18} color={Colors.violet} />
              <Text style={styles.infoText}>{t('settings.ai.pollinationsInfo')}</Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Master switch */}
        <GlassCard style={styles.settingsCard}>
          <ToggleRow
            icon={<Power size={20} color={Colors.violet} />}
            title={t('settings.ai.masterToggle')}
            subtitle={t('settings.ai.masterToggleDesc')}
            value={aiEnabled}
            onValueChange={(value) => updateSettings({ aiFeaturesEnabled: value })}
          />
        </GlassCard>

        {/* Pollination Connection */}
        <Text style={styles.sectionTitle}>{t('settings.pollination.sectionTitle')}</Text>

        <GlassCard style={styles.settingsCard}>
          <View style={styles.settingItem}>
            <View
              style={[
                styles.settingIconContainer,
                { backgroundColor: connected ? Colors.overlayConnected15 : Colors.overlayViolet15 },
              ]}
            >
              <Sparkles size={20} color={connected ? Colors.successStrong : Colors.violetStrong} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('settings.pollination.title')}</Text>
              <View style={styles.statusRow}>
                {connected ? (
                  <>
                    <CheckCircle size={14} color={Colors.successStrong} />
                    <Text style={[styles.statusText, { color: Colors.successStrong }]}>
                      {t('settings.pollination.connected')}
                    </Text>
                  </>
                ) : (
                  <>
                    <XCircle size={14} color={Colors.muted} />
                    <Text style={styles.statusText}>{t('settings.pollination.notConnected')}</Text>
                  </>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.connectButton, connected && styles.disconnectButton]}
              onPress={connected ? handleDisconnectPollination : handleConnectPollination}
            >
              {connected ? (
                <Text style={styles.disconnectButtonText}>{t('settings.pollination.disconnect')}</Text>
              ) : (
                <>
                  <ExternalLink size={14} color={Colors.white} />
                  <Text style={styles.connectButtonText}>{t('settings.pollination.connect')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.warningBox}>
            <AlertTriangle size={16} color={Colors.warning} />
            <Text style={styles.warningText}>{t('settings.pollination.betaWarning')}</Text>
          </View>
        </GlassCard>

        {/* AI Features */}
        <Text style={styles.sectionTitle}>{t('settings.ai.title')}</Text>

        <GlassCard style={styles.settingsCard}>
          <ToggleRow
            icon={<Bot size={20} color={Colors.violet} />}
            title={t('settings.ai.toggleProgress')}
            subtitle={t('settings.ai.toggleProgressDesc')}
            value={settings.aiProgressEnabled ?? false}
            onValueChange={(value) => updateSettings({ aiProgressEnabled: value })}
            disabled={featuresLocked}
          />
          <ToggleRow
            icon={<Sparkles size={20} color={Colors.violet} />}
            title={t('settings.ai.toggleWorkout')}
            subtitle={t('settings.ai.toggleWorkoutDesc')}
            value={settings.aiWorkoutEnabled ?? false}
            onValueChange={(value) => updateSettings({ aiWorkoutEnabled: value })}
            disabled={featuresLocked}
          />
          <ToggleRow
            icon={<UtensilsCrossed size={20} color={Colors.violet} />}
            title={t('settings.ai.toggleMeal')}
            subtitle={t('settings.ai.toggleMealDesc')}
            value={settings.ploppyEnabled ?? false}
            onValueChange={(value) => updateSettings({ ploppyEnabled: value })}
            disabled={featuresLocked}
          />

          {/* Model Selector */}
          <View style={[styles.settingItem, featuresLocked && styles.settingItemDisabled]}>
            <View style={[styles.settingIconContainer, { backgroundColor: Colors.overlayViolet15 }]}>
              <ChevronDown size={20} color={Colors.violet} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('settings.ai.modelLabel')}</Text>
              <Text style={styles.settingSubtitle}>{t('settings.ai.modelDesc')}</Text>
            </View>
            <TouchableOpacity
              style={styles.modelPicker}
              onPress={() => setModelPickerVisible(true)}
              disabled={featuresLocked}
            >
              <Text style={styles.modelPickerText}>
                {POLLINATION_MODELS.find((m) => m.id === (settings.aiModel || 'openai'))?.label ?? settings.aiModel}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tone selector */}
          <View style={[styles.settingItem, featuresLocked && styles.settingItemDisabled]}>
            <View style={[styles.settingIconContainer, { backgroundColor: Colors.overlayViolet15 }]}>
              <Activity size={20} color={Colors.violet} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('settings.ai.toneLabel')}</Text>
              <Text style={styles.settingSubtitle}>{t('settings.ai.toneDesc')}</Text>
            </View>
            <TouchableOpacity
              style={styles.modelPicker}
              onPress={() => setTonePickerVisible(true)}
              disabled={featuresLocked}
            >
              <Text style={styles.modelPickerText}>
                {t(`settings.ai.toneOptions.${settings.aiTone ?? 'neutral'}`)}
              </Text>
            </TouchableOpacity>
          </View>

          {featuresLocked && (
            <View style={styles.featureInfo}>
              <Text style={styles.featureInfoText}>
                {aiEnabled ? t('workout.ai.connectRequired') : t('settings.ai.masterOffHint')}
              </Text>
            </View>
          )}
        </GlassCard>

        {/* Debug */}
        <Text style={styles.sectionTitle}>{t('settings.ai.debugTitle')}</Text>

        <GlassCard style={styles.settingsCard}>
          <ToggleRow
            icon={<Bug size={20} color={Colors.warning} />}
            title={t('settings.ai.debugToggle')}
            subtitle={t('settings.ai.debugToggleDesc')}
            value={settings.aiDebugEnabled ?? false}
            onValueChange={(value) => updateSettings({ aiDebugEnabled: value })}
            activeColor={Colors.warning}
          />
          <TouchableOpacity style={styles.settingItem} onPress={() => setDebugLogVisible(true)}>
            <View style={[styles.settingIconContainer, { backgroundColor: Colors.overlayWarning15 }]}>
              <Bug size={20} color={Colors.warning} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('settings.ai.debugOpen')}</Text>
              <Text style={styles.settingSubtitle}>
                {t('settings.ai.debugCount', { count: debugEntryCount })}
              </Text>
            </View>
          </TouchableOpacity>
        </GlassCard>

        {/* Privacy */}
        <Text style={styles.sectionTitle}>{t('settings.ai.privacyTitle')}</Text>

        <GlassCard style={styles.settingsCard}>
          <View style={styles.privacyBox}>
            <Shield size={18} color={Colors.success} />
            <Text style={styles.privacyText}>{t('settings.ai.privacyText')}</Text>
          </View>
          <TouchableOpacity style={styles.privacyLink} onPress={() => router.push('/privacy-policy')}>
            <Text style={styles.privacyLinkText}>{t('settings.ai.seePrivacyPolicy')}</Text>
          </TouchableOpacity>
        </GlassCard>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Model Picker Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={modelPickerVisible}
        onRequestClose={() => setModelPickerVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModelPickerVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('settings.ai.selectModelTitle')}</Text>
            <ScrollView>
              {POLLINATION_MODELS.map((m) => {
                const selected = (settings.aiModel || 'openai') === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.modelOption, selected && styles.modelOptionSelected]}
                    onPress={() => { updateSettings({ aiModel: m.id }); setModelPickerVisible(false); }}
                  >
                    <Text style={selected ? styles.modelOptionTextSelected : styles.modelOptionText}>{m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Tone Picker Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={tonePickerVisible}
        onRequestClose={() => setTonePickerVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setTonePickerVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('settings.ai.toneLabel')}</Text>
            {(['technical', 'neutral', 'warm'] as const).map((tone) => {
              const selected = (settings.aiTone ?? 'neutral') === tone;
              return (
                <TouchableOpacity
                  key={tone}
                  style={[styles.modelOption, selected && styles.modelOptionSelected]}
                  onPress={() => { updateSettings({ aiTone: tone }); setTonePickerVisible(false); }}
                >
                  <Text style={selected ? styles.modelOptionTextSelected : styles.modelOptionText}>
                    {t(`settings.ai.toneOptions.${tone}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      <AiDebugModal visible={debugLogVisible} onClose={() => setDebugLogVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollView: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 100 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: Spacing.xl, gap: Spacing.md,
  },
  backButton: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.overlay,
    justifyContent: 'center', alignItems: 'center',
  },
  screenTitle: {
    fontSize: FontSize.xxxl, fontWeight: FontWeight.bold,
    color: Colors.text, flex: 1,
  },
  betaBadge: {
    backgroundColor: Colors.overlayWarning15,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  betaBadgeText: {
    fontSize: 10, fontWeight: FontWeight.extrabold,
    color: Colors.warningDeep, letterSpacing: 1.5,
  },
  sectionTitle: {
    fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
    color: Colors.muted, textTransform: 'uppercase',
    letterSpacing: 1, marginTop: Spacing.lg,
    marginBottom: Spacing.md, marginLeft: Spacing.xs,
  },
  settingsCard: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
  },
  infoCard: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  infoText: { flex: 1, fontSize: FontSize.sm, color: Colors.muted, lineHeight: 20 },
  settingItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
    gap: Spacing.md,
  },
  settingItemDisabled: { opacity: 0.5 },
  settingIconContainer: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  settingSubtitle: { fontSize: FontSize.xs, color: Colors.muted, marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statusText: { fontSize: FontSize.xs, color: Colors.muted },
  connectButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.violetStrong,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  connectButtonText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.white },
  disconnectButton: {
    backgroundColor: Colors.overlayError15,
    borderWidth: 1, borderColor: Colors.overlayError30,
  },
  disconnectButtonText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.errorStrong },
  warningBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.overlayWarning10,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.sm, marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.overlayWarning20,
  },
  warningText: { flex: 1, fontSize: FontSize.xs, color: Colors.warning, lineHeight: 18 },
  featureInfo: {
    backgroundColor: Colors.overlayTeal10,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.sm, marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  featureInfoText: { fontSize: FontSize.xs, color: Colors.teal, lineHeight: 18 },
  modelPicker: {
    backgroundColor: Colors.overlayViolet12,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.overlayViolet25,
  },
  modelPickerText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.violet },
  privacyBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.overlaySuccess08,
    padding: Spacing.md, marginHorizontal: Spacing.sm,
    marginBottom: Spacing.sm, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.overlaySuccess15,
  },
  privacyText: { flex: 1, fontSize: FontSize.xs, color: Colors.success, lineHeight: 18 },
  privacyLink: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.sm, marginBottom: Spacing.sm,
  },
  privacyLinkText: { fontSize: FontSize.sm, color: Colors.violet, textDecorationLine: 'underline' },
  modalOverlay: {
    flex: 1, backgroundColor: Colors.overlayBlack50,
    justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.cardSolid, padding: Spacing.lg,
    borderRadius: BorderRadius.xxl, width: '85%', maxHeight: '70%',
  },
  modalTitle: {
    fontSize: FontSize.xl, fontWeight: FontWeight.bold,
    color: Colors.text, marginBottom: Spacing.md, textAlign: 'center',
  },
  modelOption: {
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  modelOptionSelected: { backgroundColor: Colors.overlayViolet20 },
  modelOptionText: { fontSize: FontSize.xl, color: Colors.text },
  modelOptionTextSelected: { fontSize: FontSize.xl, color: Colors.violet, fontWeight: FontWeight.bold },
});
