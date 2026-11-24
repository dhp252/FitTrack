// ============================================================================
// WEBDAV SYNC - Upload AI-readable stats (and optionally a full backup) to a
// user-configured WebDAV server (Nextcloud, ownCloud, Synology, rclone...).
// One-way push: the app is the source of truth, the server only receives files.
// ============================================================================

import * as SecureStore from 'expo-secure-store';
import { fetchWithRetry } from '../network/httpClient';
import { useAppStore } from '../../stores/appStore';
import { useGamificationStore } from '../../stores/gamificationStore';
import { BuildConfig } from '../../config/buildConfig';
import { createLogger } from '../../utils/logger';
import { buildAiStatsExport, buildAiSummaryMarkdown } from '../../utils/aiStatsExport';
import { generateFullBackup, exportFullBackup } from '../../utils/export';
import {
    WEBDAV_AUTO_SYNC_MIN_INTERVAL_MS,
    WEBDAV_REQUEST_TIMEOUT_MS,
    WEBDAV_FILES,
} from '../../constants/values';
import type { WebDavSettings } from '../../types';

const webdavLogger = createLogger('WebDAV');
const PASSWORD_STORAGE_KEY = 'webdav_password';

// ============================================================================
// ERRORS
// ============================================================================

export type WebDavErrorCode = 'config' | 'auth' | 'not_found' | 'http' | 'network' | 'unavailable';

export class WebDavError extends Error {
    code: WebDavErrorCode;
    status?: number;

    constructor(code: WebDavErrorCode, message: string, status?: number) {
        super(message);
        this.name = 'WebDavError';
        this.code = code;
        this.status = status;
    }
}

// ============================================================================
// CREDENTIALS (password in SecureStore, never in the persisted settings)
// ============================================================================

export async function saveWebDavPassword(password: string): Promise<void> {
    await SecureStore.setItemAsync(PASSWORD_STORAGE_KEY, password);
}

export async function getWebDavPassword(): Promise<string | null> {
    return SecureStore.getItemAsync(PASSWORD_STORAGE_KEY);
}

export async function removeWebDavPassword(): Promise<void> {
    await SecureStore.deleteItemAsync(PASSWORD_STORAGE_KEY);
}

// ============================================================================
// LOW-LEVEL CLIENT
// ============================================================================

export interface WebDavConnection {
    url: string;
    username: string;
    password: string;
}

function encodeBase64Utf8(value: string): string {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary);
}

function authHeader(connection: WebDavConnection): string {
    return `Basic ${encodeBase64Utf8(`${connection.username}:${connection.password}`)}`;
}

/** Splits a folder like "/Spix/ai/" into encoded segments ["Spix", "ai"]. */
export function folderSegments(folder: string): string[] {
    return folder
        .split('/')
        .map((segment) => segment.trim())
        .filter((segment) => segment.length > 0)
        .map((segment) => encodeURIComponent(segment));
}

/** Joins the base URL and already-encoded path segments with single slashes. */
export function joinWebDavUrl(baseUrl: string, segments: string[]): string {
    const base = baseUrl.trim().replace(/\/+$/, '');
    return segments.length === 0 ? `${base}/` : `${base}/${segments.join('/')}`;
}

export function validateWebDavUrl(url: string): void {
    const trimmed = url.trim();
    if (!/^https?:\/\/[^\s/]+/i.test(trimmed)) {
        throw new WebDavError('config', `Invalid WebDAV URL: "${trimmed}". It must start with https:// or http://`);
    }
}

async function request(
    connection: WebDavConnection,
    method: string,
    url: string,
    body?: string,
    extraHeaders: Record<string, string> = {}
): Promise<Response> {
    webdavLogger.debug(`${method} ${url}`);
    let response: Response;
    try {
        response = await fetchWithRetry(
            url,
            {
                method,
                body,
                headers: {
                    Authorization: authHeader(connection),
                    ...extraHeaders,
                },
            },
            { timeoutMs: WEBDAV_REQUEST_TIMEOUT_MS }
        );
    } catch (error) {
        const reason = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
        throw new WebDavError('network', `${method} ${url} failed: ${reason}`);
    }
    webdavLogger.debug(`${method} ${url} -> ${response.status}`);
    return response;
}

function errorForStatus(method: string, url: string, response: Response): WebDavError {
    const detail = `${method} ${url} -> HTTP ${response.status} ${response.statusText}`.trim();
    if (response.status === 401 || response.status === 403) {
        return new WebDavError('auth', detail, response.status);
    }
    if (response.status === 404) {
        return new WebDavError('not_found', detail, response.status);
    }
    return new WebDavError('http', detail, response.status);
}

/** Checks that the base URL exists and the credentials are accepted. */
export async function testWebDavConnection(connection: WebDavConnection): Promise<void> {
    validateWebDavUrl(connection.url);
    const url = joinWebDavUrl(connection.url, []);
    const response = await request(connection, 'PROPFIND', url, undefined, { Depth: '0' });
    if (response.status !== 207 && !response.ok) {
        throw errorForStatus('PROPFIND', url, response);
    }
}

/** Creates each missing folder level. 405 means the collection already exists. */
async function ensureFolder(connection: WebDavConnection, segments: string[]): Promise<void> {
    for (let depth = 1; depth <= segments.length; depth += 1) {
        const url = `${joinWebDavUrl(connection.url, segments.slice(0, depth))}/`;
        const response = await request(connection, 'MKCOL', url);
        if (response.ok || response.status === 405 || response.status === 301) {
            continue;
        }
        throw errorForStatus('MKCOL', url, response);
    }
}

async function putFile(
    connection: WebDavConnection,
    segments: string[],
    fileName: string,
    content: string,
    contentType: string
): Promise<void> {
    const url = joinWebDavUrl(connection.url, [...segments, encodeURIComponent(fileName)]);
    const response = await request(connection, 'PUT', url, content, {
        'Content-Type': `${contentType}; charset=utf-8`,
    });
    if (!response.ok) {
        throw errorForStatus('PUT', url, response);
    }
}

// ============================================================================
// SYNC
// ============================================================================

export interface WebDavSyncResult {
    files: string[];
    finishedAt: string;
}

let inFlightSync: Promise<WebDavSyncResult> | null = null;

export function isWebDavAvailable(): boolean {
    // FOSS builds ship without the INTERNET permission (see D-2).
    return !BuildConfig.isFoss;
}

async function connectionFromSettings(webdav: WebDavSettings): Promise<WebDavConnection> {
    validateWebDavUrl(webdav.url);
    if (webdav.username.trim().length === 0) {
        throw new WebDavError('config', 'WebDAV username is empty');
    }
    const password = await getWebDavPassword();
    if (!password) {
        throw new WebDavError('config', 'WebDAV password is not saved on this device');
    }
    return { url: webdav.url, username: webdav.username.trim(), password };
}

function recordSyncOutcome(update: Pick<WebDavSettings, 'lastSyncAt' | 'lastSyncStatus' | 'lastSyncError'>): void {
    const { settings, updateSettings } = useAppStore.getState();
    const current = settings.webdav;
    if (!current) return;
    updateSettings({ webdav: { ...current, ...update } });
}

async function runSync(): Promise<WebDavSyncResult> {
    if (!isWebDavAvailable()) {
        throw new WebDavError('unavailable', 'WebDAV sync is not available in the FOSS build (no internet permission)');
    }

    const appState = useAppStore.getState();
    const webdav = appState.settings.webdav;
    if (!webdav) {
        throw new WebDavError('config', 'WebDAV is not configured');
    }

    const startedAt = new Date();
    try {
        const connection = await connectionFromSettings(webdav);
        const gamification = useGamificationStore.getState();

        const stats = buildAiStatsExport({
            entries: appState.entries,
            settings: appState.settings,
            sportsConfig: appState.sportsConfig,
            gamification: { xp: gamification.xp, level: gamification.level },
            includePersonalInfo: webdav.includePersonalInfo,
            now: startedAt,
        });

        const files: Array<{ name: string; content: string; type: string }> = [
            { name: WEBDAV_FILES.stats, content: JSON.stringify(stats, null, 2), type: 'application/json' },
            { name: WEBDAV_FILES.summary, content: buildAiSummaryMarkdown(stats), type: 'text/markdown' },
        ];

        if (webdav.includeFullBackup) {
            const backup = generateFullBackup(
                {
                    entries: appState.entries,
                    settings: appState.settings,
                    unlockedBadges: appState.unlockedBadges,
                    sportsConfig: appState.sportsConfig,
                },
                {
                    xp: gamification.xp,
                    level: gamification.level,
                    history: gamification.history,
                    quests: gamification.quests,
                }
            );
            files.push({ name: WEBDAV_FILES.backup, content: exportFullBackup(backup), type: 'application/json' });
        }

        const segments = folderSegments(webdav.folder);
        await ensureFolder(connection, segments);
        for (const file of files) {
            await putFile(connection, segments, file.name, file.content, file.type);
        }

        const finishedAt = new Date().toISOString();
        recordSyncOutcome({ lastSyncAt: finishedAt, lastSyncStatus: 'success', lastSyncError: undefined });
        webdavLogger.info(`Uploaded ${files.length} files`);
        return { files: files.map((file) => file.name), finishedAt };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        recordSyncOutcome({ lastSyncAt: startedAt.toISOString(), lastSyncStatus: 'error', lastSyncError: message });
        webdavLogger.error('Sync failed:', message);
        throw error;
    }
}

/** Uploads the AI files now. Concurrent calls share the same run. */
export function syncToWebDav(): Promise<WebDavSyncResult> {
    if (!inFlightSync) {
        inFlightSync = runSync().finally(() => {
            inFlightSync = null;
        });
    }
    return inFlightSync;
}

/**
 * Called when the app comes to the foreground. Syncs only when auto sync is on
 * and the last attempt is older than WEBDAV_AUTO_SYNC_MIN_INTERVAL_MS.
 * Failures are recorded in settings.webdav.lastSyncError and shown on the
 * WebDAV screen; they never interrupt the app (optional network feature).
 */
export async function maybeAutoSyncWebDav(now: Date = new Date()): Promise<void> {
    const webdav = useAppStore.getState().settings.webdav;
    if (!webdav || !webdav.enabled || !webdav.autoSync || !isWebDavAvailable()) return;
    if (webdav.lastSyncAt) {
        const elapsed = now.getTime() - new Date(webdav.lastSyncAt).getTime();
        if (elapsed < WEBDAV_AUTO_SYNC_MIN_INTERVAL_MS) return;
    }
    try {
        await syncToWebDav();
    } catch (error) {
        // Already recorded in settings.webdav by runSync; keep the app usable offline.
        webdavLogger.warn('Auto sync skipped after error', error);
    }
}
