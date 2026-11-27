// ============================================================================
// SETTINGS - WEBDAV SYNC SUB-SCREEN
// Uploads AI-readable stats to the user's WebDAV server so an external AI
// assistant can read them and give advice (F-020).
// ============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CloudUpload, PlugZap, Save, CheckCircle2, XCircle, Info } from 'lucide-react-native';
import { GlassCard } from '../../src/components/ui';
import { useAppStore } from '../../src/stores';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants';
import { WEBDAV_DEFAULT_FOLDER, WEBDAV_FILES } from '../../src/constants/values';
import {
  WebDavError,
  getWebDavPassword,
  saveWebDavPassword,
  removeWebDavPassword,
  testWebDavConnection,
  syncToWebDav,
  isWebDavAvailable,
} from '../../src/services/webdav';
import { formatDisplayDate, formatTime } from '../../src/utils/date';
import type { WebDavSettings } from '../../src/types';

type BusyAction = 'test' | 'save' | 'sync' | null;

interface Feedback {
  type: 'success' | 'error';
  message: string;
  detail?: string;
}

interface ToggleRowProps {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({ title, subtitle, value, onValueChange, disabled = false }: ToggleRowProps) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: Colors.card, true: Colors.teal }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secure?: boolean;
  keyboardType?: 'default' | 'url';
}

function Field({ label, value, onChangeText, placeholder, secure = false, keyboardType = 'default' }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.muted2}
        secureTextEntry={secure}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );
}

function defaultWebDavSettings(): WebDavSettings {
  return {
    enabled: false,
    url: '',
    username: '',
    folder: WEBDAV_DEFAULT_FOLDER,
    autoSync: true,
    includePersonalInfo: false,
    includeFullBackup: false,
  };
}

export default function WebDavScreen() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useAppStore();
  const saved = settings.webdav ?? defaultWebDavSettings();
  const available = isWebDavAvailable();

  const [url, setUrl] = useState(saved.url);
  const [username, setUsername] = useState(saved.username);
  const [folder, setFolder] = useState(saved.folder);
  const [password, setPassword] = useState('');
  const [hasSavedPassword, setHasSavedPassword] = useState(false);
  const [busy, setBusy] = useState<BusyAction>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    getWebDavPassword()
      .then((value) => setHasSavedPassword(Boolean(value)))
      .catch((error: unknown) => {
        setFeedback({ type: 'error', message: t('settings.webdav.errors.secureStore'), detail: String(error) });
      });
  }, [t]);

  const describeError = useCallback((error: unknown): Feedback => {
    if (error instanceof WebDavError) {
      return { type: 'error', message: t(`settings.webdav.errors.${error.code}`), detail: error.message };
    }
    return { type: 'error', message: t('settings.webdav.errors.unknown'), detail: error instanceof Error ? error.message : String(error) };
  }, [t]);

  const formValues = useCallback((): WebDavSettings => ({
    ...saved,
    url: url.trim(),
    username: username.trim(),
    folder: folder.trim(),
  }), [saved, url, username, folder]);

  const persistForm = useCallback(async (overrides: Partial<WebDavSettings> = {}): Promise<WebDavSettings> => {
    if (password.length > 0) {
      await saveWebDavPassword(password);
      setPassword('');
      setHasSavedPassword(true);
    }
    const next = { ...formValues(), ...overrides };
    updateSettings({ webdav: next });
    return next;
  }, [password, formValues, updateSettings]);

  const handleTest = useCallback(async () => {
    setBusy('test');
    setFeedback(null);
    try {
      const effectivePassword = password.length > 0 ? password : await getWebDavPassword();
      if (!effectivePassword) {
        throw new WebDavError('config', 'WebDAV password is empty');
      }
      await testWebDavConnection({ url: url.trim(), username: username.trim(), password: effectivePassword });
      setFeedback({ type: 'success', message: t('settings.webdav.testSuccess') });
    } catch (error) {
      setFeedback(describeError(error));
    } finally {
      setBusy(null);
    }
  }, [password, url, username, t, describeError]);

  const handleSave = useCallback(async () => {
    setBusy('save');
    setFeedback(null);
    try {
      await persistForm();
      setFeedback({ type: 'success', message: t('settings.webdav.saved') });
    } catch (error) {
      setFeedback(describeError(error));
    } finally {
      setBusy(null);
    }
  }, [persistForm, t, describeError]);

  const handleSync = useCallback(async () => {
    setBusy('sync');
    setFeedback(null);
    try {
      await persistForm({ enabled: true });
      const result = await syncToWebDav();
      setFeedback({ type: 'success', message: t('settings.webdav.syncSuccess', { count: result.files.length }) });
    } catch (error) {
      setFeedback(describeError(error));
    } finally {
      setBusy(null);
    }
  }, [persistForm, t, describeError]);

  const handleForget = useCallback(async () => {
    setBusy('save');
    setFeedback(null);
    try {
      await removeWebDavPassword();
      setHasSavedPassword(false);
      updateSettings({ webdav: { ...saved, enabled: false } });
      setFeedback({ type: 'success', message: t('settings.webdav.forgotten') });
    } catch (error) {
      setFeedback(describeError(error));
    } finally {
      setBusy(null);
    }
  }, [saved, updateSettings, t, describeError]);

  const toggle = useCallback((key: 'enabled' | 'autoSync' | 'includePersonalInfo' | 'includeFullBackup', value: boolean) => {
    updateSettings({ webdav: { ...formValues(), [key]: value } });
  }, [formValues, updateSettings]);

  const folderLabel = folder.trim().length > 0 ? folder.trim() : '/';
  const lastSync = saved.lastSyncAt
    ? `${formatDisplayDate(saved.lastSyncAt)} ${formatTime(saved.lastSyncAt)}`
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeIn.delay(50)} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>{t('settings.webdav.title')}</Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <GlassCard style={styles.card}>
            <View style={styles.introRow}>
              <Info size={18} color={Colors.info} />
              <Text style={styles.introText}>{t('settings.webdav.intro')}</Text>
            </View>
            <Text style={styles.filesText}>
              {t('settings.webdav.filesHint', {
                folder: folderLabel,
                stats: WEBDAV_FILES.stats,
                summary: WEBDAV_FILES.summary,
              })}
            </Text>
          </GlassCard>
        </Animated.View>

        {!available && (
          <GlassCard style={[styles.card, styles.warningCard]}>
            <Text style={styles.warningText}>{t('settings.webdav.unavailableFoss')}</Text>
          </GlassCard>
        )}

        <Text style={styles.sectionTitle}>{t('settings.webdav.serverSection')}</Text>
        <GlassCard style={styles.card}>
          <Field
            label={t('settings.webdav.url')}
            value={url}
            onChangeText={setUrl}
            placeholder="https://cloud.example.com/remote.php/dav/files/me"
            keyboardType="url"
          />
          <Field
            label={t('settings.webdav.username')}
            value={username}
            onChangeText={setUsername}
            placeholder={t('settings.webdav.usernamePlaceholder')}
          />
          <Field
            label={t('settings.webdav.password')}
            value={password}
            onChangeText={setPassword}
            placeholder={hasSavedPassword ? t('settings.webdav.passwordSaved') : t('settings.webdav.passwordPlaceholder')}
            secure
          />
          <Field
            label={t('settings.webdav.folder')}
            value={folder}
            onChangeText={setFolder}
            placeholder={WEBDAV_DEFAULT_FOLDER}
          />
          <Text style={styles.hint}>{t('settings.webdav.passwordHint')}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleTest}
              disabled={busy !== null || !available}
            >
              {busy === 'test' ? <ActivityIndicator color={Colors.text} /> : <PlugZap size={18} color={Colors.text} />}
              <Text style={styles.buttonText}>{t('settings.webdav.test')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleSave}
              disabled={busy !== null}
            >
              {busy === 'save' ? <ActivityIndicator color={Colors.text} /> : <Save size={18} color={Colors.text} />}
              <Text style={styles.buttonText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>{t('settings.webdav.optionsSection')}</Text>
        <GlassCard style={styles.card}>
          <ToggleRow
            title={t('settings.webdav.enabled')}
            subtitle={t('settings.webdav.enabledDesc')}
            value={saved.enabled}
            onValueChange={(value) => toggle('enabled', value)}
            disabled={!available}
          />
          <View style={styles.divider} />
          <ToggleRow
            title={t('settings.webdav.autoSync')}
            subtitle={t('settings.webdav.autoSyncDesc')}
            value={saved.autoSync}
            onValueChange={(value) => toggle('autoSync', value)}
            disabled={!available}
          />
          <View style={styles.divider} />
          <ToggleRow
            title={t('settings.webdav.includePersonal')}
            subtitle={t('settings.webdav.includePersonalDesc')}
            value={saved.includePersonalInfo}
            onValueChange={(value) => toggle('includePersonalInfo', value)}
          />
          <View style={styles.divider} />
          <ToggleRow
            title={t('settings.webdav.includeBackup')}
            subtitle={t('settings.webdav.includeBackupDesc', { file: WEBDAV_FILES.backup })}
            value={saved.includeFullBackup}
            onValueChange={(value) => toggle('includeFullBackup', value)}
          />
        </GlassCard>

        <Text style={styles.sectionTitle}>{t('settings.webdav.statusSection')}</Text>
        <GlassCard style={styles.card}>
          <View style={styles.statusRow}>
            {saved.lastSyncStatus === 'success' && <CheckCircle2 size={18} color={Colors.success} />}
            {saved.lastSyncStatus === 'error' && <XCircle size={18} color={Colors.error} />}
            <Text style={styles.statusText}>
              {lastSync
                ? t(saved.lastSyncStatus === 'error' ? 'settings.webdav.lastFailed' : 'settings.webdav.lastSuccess', { date: lastSync })
                : t('settings.webdav.neverSynced')}
            </Text>
          </View>
          {saved.lastSyncStatus === 'error' && saved.lastSyncError && (
            <Text style={styles.debugText} selectable>{saved.lastSyncError}</Text>
          )}

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSync}
            disabled={busy !== null || !available}
          >
            {busy === 'sync' ? <ActivityIndicator color={Colors.white} /> : <CloudUpload size={18} color={Colors.white} />}
            <Text style={[styles.buttonText, styles.primaryButtonText]}>{t('settings.webdav.syncNow')}</Text>
          </TouchableOpacity>

          {hasSavedPassword && (
            <TouchableOpacity style={styles.linkButton} onPress={handleForget} disabled={busy !== null}>
              <Text style={styles.linkText}>{t('settings.webdav.forget')}</Text>
            </TouchableOpacity>
          )}
        </GlassCard>

        {feedback && (
          <GlassCard style={[styles.card, feedback.type === 'error' ? styles.errorCard : styles.successCard]}>
            <Text style={feedback.type === 'error' ? styles.errorText : styles.successText}>{feedback.message}</Text>
            {feedback.detail && <Text style={styles.debugText} selectable>{feedback.detail}</Text>}
          </GlassCard>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    flex: 1,
  },
  headerSpacer: {
    width: 44,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    marginTop: Spacing.sm,
  },
  card: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  warningCard: {
    borderColor: Colors.warning,
  },
  errorCard: {
    borderColor: Colors.error,
  },
  successCard: {
    borderColor: Colors.success,
  },
  introRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  introText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 19,
  },
  filesText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.muted,
    lineHeight: 17,
  },
  warningText: {
    fontSize: FontSize.md,
    color: Colors.warning,
  },
  field: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.muted,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.overlay,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.lg,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.stroke,
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    marginBottom: Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  secondaryButton: {
    backgroundColor: Colors.overlay,
  },
  primaryButton: {
    backgroundColor: Colors.cta,
    marginTop: Spacing.md,
  },
  buttonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  primaryButtonText: {
    color: Colors.white,
  },
  linkButton: {
    alignItems: 'center',
    paddingTop: Spacing.md,
  },
  linkText: {
    fontSize: FontSize.sm,
    color: Colors.error,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  toggleSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.stroke,
    marginVertical: Spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  debugText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.xs,
    color: Colors.muted2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  errorText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.error,
  },
  successText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.success,
  },
  bottomSpacer: {
    height: 40,
  },
});
