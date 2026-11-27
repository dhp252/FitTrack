// ============================================================================
// AI DEBUG LOG - In-memory journal of Pollinations calls (request, response,
// timing, errors). Only records while Settings → AI → Debug mode is on.
// Never persisted, never sent anywhere. API keys are redacted before storage.
// ============================================================================

import { create } from 'zustand';
import { nanoid } from 'nanoid/non-secure';
import { useAppStore } from '../../stores/appStore';
import { AI_DEBUG_MAX_CHARS, AI_DEBUG_MAX_ENTRIES } from '../../constants/values';

export type AiFeatureId =
  | 'weekly-summary'
  | 'workout-analysis'
  | 'run-plan-questions'
  | 'run-plan'
  | 'run-coach'
  | 'run-debrief'
  | 'meal-photo';

export type AiDebugStatus = 'pending' | 'success' | 'error';

export interface AiDebugEntry {
  id: string;
  feature: AiFeatureId;
  model: string;
  endpoint: string;
  startedAt: number;
  durationMs?: number;
  status: AiDebugStatus;
  /** Result served from the 2-minute in-memory cache, no network call made */
  cached: boolean;
  httpStatus?: number;
  /** Request body as sent (pretty JSON), secrets redacted */
  request: string;
  /** Raw response body, secrets redacted */
  response?: string;
  error?: string;
  /** What the app did with the response (e.g. "invalid JSON, fallback plan used") */
  notes: string[];
}

interface AiDebugState {
  entries: AiDebugEntry[];
  clear: () => void;
}

export const useAiDebugStore = create<AiDebugState>((set) => ({
  entries: [],
  clear: () => set({ entries: [] }),
}));

export function isAiDebugEnabled(): boolean {
  return useAppStore.getState().settings.aiDebugEnabled === true;
}

// ----------------------------------------------------------------------------
// Redaction
// ----------------------------------------------------------------------------

const SECRET_PATTERNS: Array<[RegExp, string]> = [
  [/Bearer\s+[A-Za-z0-9._~+/=-]+/g, 'Bearer [redacted]'],
  [/\b(sk|pk|rk)_[A-Za-z0-9_-]{6,}/g, '$1_[redacted]'],
  [/(api[_-]?key["'=:\s]+)[A-Za-z0-9._-]{6,}/gi, '$1[redacted]'],
  [/([?&#](?:key|token|access_token)=)[^&\s"]+/gi, '$1[redacted]'],
];

export function redactSecrets(text: string, secrets: ReadonlyArray<string | null | undefined> = []): string {
  let out = text;
  for (const secret of secrets) {
    if (secret && secret.length >= 6) {
      out = out.split(secret).join('[redacted]');
    }
  }
  for (const [pattern, replacement] of SECRET_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

function clip(text: string): string {
  if (text.length <= AI_DEBUG_MAX_CHARS) return text;
  return `${text.slice(0, AI_DEBUG_MAX_CHARS)}\n… [${text.length - AI_DEBUG_MAX_CHARS} more characters cut]`;
}

function toText(value: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

/** Readable message for any thrown value, including fetch timeouts. */
export function describeAiError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'AbortError') return 'Request timed out (no answer from the server in time)';
    return error.message || error.name;
  }
  return String(error);
}

// ----------------------------------------------------------------------------
// Recording API
// ----------------------------------------------------------------------------

interface BeginInput {
  feature: AiFeatureId;
  model: string;
  endpoint: string;
  request: unknown;
  secrets?: ReadonlyArray<string | null | undefined>;
}

interface CompleteInput {
  status: Exclude<AiDebugStatus, 'pending'>;
  cached?: boolean;
  httpStatus?: number;
  response?: unknown;
  error?: unknown;
  secrets?: ReadonlyArray<string | null | undefined>;
}

function updateEntry(id: string, patch: (entry: AiDebugEntry) => AiDebugEntry): void {
  useAiDebugStore.setState((state) => ({
    entries: state.entries.map((entry) => (entry.id === id ? patch(entry) : entry)),
  }));
}

/** Starts a log entry. Returns null (and records nothing) when debug mode is off. */
export function beginAiDebugCall(input: BeginInput): string | null {
  if (!isAiDebugEnabled()) return null;
  const entry: AiDebugEntry = {
    id: nanoid(),
    feature: input.feature,
    model: input.model,
    endpoint: input.endpoint,
    startedAt: Date.now(),
    status: 'pending',
    cached: false,
    request: clip(redactSecrets(toText(input.request), input.secrets)),
    notes: [],
  };
  useAiDebugStore.setState((state) => ({
    entries: [entry, ...state.entries].slice(0, AI_DEBUG_MAX_ENTRIES),
  }));
  return entry.id;
}

/** Plain-language hint for HTTP errors users usually hit with Pollinations. */
export function hintForHttpStatus(status: number | undefined): string | null {
  if (status === 401 || status === 403) {
    return 'Pollinations refused the key: it has probably expired (keys last about 30 days). Disconnect and connect again in Settings → AI.';
  }
  if (status === 402) return 'Your Pollinations account is out of credit (pollen). Top up or wait for the daily refill.';
  if (status === 429) return 'Too many requests: Pollinations is rate-limiting this key. Wait a minute and retry.';
  if (status !== undefined && status >= 500) return 'Pollinations server error: the model may be down. Try again later or pick another model.';
  return null;
}

export function completeAiDebugCall(id: string | null, input: CompleteInput): void {
  if (!id) return;
  const hint = input.status === 'error' ? hintForHttpStatus(input.httpStatus) : null;
  updateEntry(id, (entry) => ({
    ...entry,
    notes: hint && !entry.notes.includes(hint) ? [...entry.notes, hint] : entry.notes,
    status: input.status,
    cached: input.cached ?? entry.cached,
    durationMs: Date.now() - entry.startedAt,
    httpStatus: input.httpStatus ?? entry.httpStatus,
    response: input.response === undefined
      ? entry.response
      : clip(redactSecrets(toText(input.response), input.secrets)),
    error: input.error === undefined
      ? entry.error
      : redactSecrets(describeAiError(input.error), input.secrets),
  }));
}

/**
 * Attach a note to the most recent call of a feature, e.g. when the app could
 * not use the answer and fell back to a default. Marks the call as an error
 * when `isProblem` is true.
 */
export function noteAiDebug(feature: AiFeatureId, note: string, isProblem = true): void {
  if (!isAiDebugEnabled()) return;
  const latest = useAiDebugStore.getState().entries.find((entry) => entry.feature === feature);
  if (!latest) return;
  updateEntry(latest.id, (entry) => ({
    ...entry,
    status: isProblem ? 'error' : entry.status,
    error: isProblem && !entry.error ? note : entry.error,
    notes: [...entry.notes, note],
  }));
}

/** Records a failure that happened before any AI request (e.g. image upload). */
export function logAiDebugFailure(feature: AiFeatureId, endpoint: string, error: unknown): void {
  const id = beginAiDebugCall({ feature, model: '-', endpoint, request: '(no AI request sent)' });
  completeAiDebugCall(id, { status: 'error', error });
}

/** Plain-text export of one entry, for copy/paste into a bug report. */
export function formatAiDebugEntry(entry: AiDebugEntry): string {
  const lines = [
    `Feature: ${entry.feature}`,
    `When: ${new Date(entry.startedAt).toISOString()}`,
    `Model: ${entry.model}`,
    `Endpoint: ${entry.endpoint}`,
    `Status: ${entry.status}${entry.cached ? ' (cached)' : ''}${entry.httpStatus ? ` · HTTP ${entry.httpStatus}` : ''}${entry.durationMs !== undefined ? ` · ${entry.durationMs} ms` : ''}`,
  ];
  if (entry.error) lines.push(`Error: ${entry.error}`);
  if (entry.notes.length > 0) lines.push(`Notes:\n- ${entry.notes.join('\n- ')}`);
  lines.push(`\nRequest:\n${entry.request}`);
  if (entry.response !== undefined) lines.push(`\nResponse:\n${entry.response}`);
  return lines.join('\n');
}
