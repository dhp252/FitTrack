// ============================================================================
// AI STATS EXPORT - Detailed, AI-readable stats (JSON + Markdown)
// Used by the WebDAV sync so an external AI assistant can read the user's
// training data and give advice. Pure functions: no store or network access.
// ============================================================================

import { format, parseISO, startOfWeek, subDays, subWeeks, addDays } from 'date-fns';
import type {
    Entry,
    SportEntry,
    MealEntry,
    MeasureEntry,
    RunEntry,
    SportConfig,
    UserSettings,
    RepTimelineData,
} from '../types';
import { isSportEntryType, AI_EXPORT_WEEKS, AI_EXPORT_DETAIL_DAYS } from '../constants/values';
import { calculateStreak } from './date';

// ============================================================================
// TYPES
// ============================================================================

export interface AiStatsInput {
    entries: Entry[];
    settings: UserSettings;
    sportsConfig: SportConfig[];
    gamification: { xp: number; level: number };
    includePersonalInfo: boolean;
    now: Date;
}

export interface AiWeekSummary {
    weekStart: string; // Monday, YYYY-MM-DD
    workouts: number;
    weeklyGoal: number;
    goalMet: boolean;
    activeDays: number;
    durationMinutes: number;
    distanceKm: number;
    reps: number;
    bySport: Record<string, number>;
    meals: number;
    avgMealScore: number | null;
    weightKg: number | null; // Last weight logged that week
}

export interface AiRepTimelineSummary {
    reps: number;
    avgRepSeconds: number | null;
    avgRestSeconds: number | null;
}

export interface AiEntryDetail {
    date: string;
    time: string; // HH:mm, local
    type: Entry['type'];
    sport?: string;
    name?: string;
    durationMinutes?: number;
    distanceKm?: number;
    paceSecPerKm?: number;
    avgSpeedKmh?: number;
    elevationGainM?: number;
    bpmAvg?: number;
    bpmMax?: number;
    cardiacLoad?: number;
    calories?: number;
    totalReps?: number;
    exercises?: string;
    absBlock?: string;
    repTimeline?: AiRepTimelineSummary;
    planSummary?: string;
    notes?: string;
    mealName?: string;
    description?: string;
    mealScore?: number;
    weightKg?: number;
    bodyFatPercent?: number;
    waistCm?: number;
    armCm?: number;
    hipsCm?: number;
    source?: 'health_connect';
}

export interface AiStatsExport {
    schema: 'spix-ai-stats';
    version: 1;
    generatedAt: string;
    readme: string;
    units: Record<string, string>;
    profile: {
        fitnessGoal?: string;
        fitnessLevel?: string;
        weeklyGoal: number;
        gender?: string;
        age?: number;
        heightCm?: number;
        bodyWeightKg?: number;
    };
    gamification: { level: number; xp: number };
    streak: { currentDays: number; bestDays: number };
    totals: {
        firstEntryDate: string | null;
        workouts: number;
        durationMinutes: number;
        distanceKm: number;
        reps: number;
        meals: number;
        measurements: number;
        bySport: Record<string, number>;
    };
    weeks: AiWeekSummary[];
    measurements: AiEntryDetail[];
    recentEntries: AiEntryDetail[];
}

// ============================================================================
// HELPERS
// ============================================================================

const README =
    'Fitness data exported by the Spix app for an AI coach. ' +
    '"weeks" summarises the last weeks (Monday start, newest first). ' +
    '"recentEntries" lists every workout, meal and measurement of the last days (newest first). ' +
    '"measurements" lists all body measurements ever logged (newest first). ' +
    'Missing fields were not recorded. Units are given in "units".';

function round(value: number, digits = 1): number {
    const factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
}

function sportLabel(entry: SportEntry, sportsConfig: SportConfig[]): string {
    const sportId = entry.type === 'custom' ? entry.sportId : entry.type;
    const config = sportsConfig.find((sport) => sport.id === sportId);
    return config ? config.name : sportId;
}

function sportDuration(entry: SportEntry): number {
    return entry.durationMinutes ?? 0;
}

function sportDistance(entry: SportEntry): number {
    if (entry.type === 'run') return entry.distanceKm;
    if (entry.type === 'custom') return entry.distanceKm ?? 0;
    return 0;
}

function sportReps(entry: SportEntry): number {
    if (entry.type === 'home' || entry.type === 'custom') return entry.totalReps ?? 0;
    return 0;
}

function summarizeRepTimeline(timeline: RepTimelineData): AiRepTimelineSummary {
    const reps = timeline.reps.length;
    if (reps === 0) {
        return { reps: 0, avgRepSeconds: null, avgRestSeconds: null };
    }
    const totalRepMs = timeline.reps.reduce((sum, rep) => sum + rep.durationMs, 0);
    const rests = timeline.reps
        .map((rep) => rep.restMsBefore)
        .filter((rest): rest is number => rest !== null);
    const avgRestMs = rests.length > 0 ? rests.reduce((sum, rest) => sum + rest, 0) / rests.length : null;
    return {
        reps,
        avgRepSeconds: round(totalRepMs / reps / 1000, 2),
        avgRestSeconds: avgRestMs === null ? null : round(avgRestMs / 1000, 2),
    };
}

function runPace(entry: RunEntry): number | undefined {
    if (entry.avgPaceSecPerKm !== undefined) return Math.round(entry.avgPaceSecPerKm);
    if (entry.distanceKm > 0 && entry.durationMinutes > 0) {
        return Math.round((entry.durationMinutes * 60) / entry.distanceKm);
    }
    return undefined;
}

function localTime(createdAt: string): string {
    return format(parseISO(createdAt), 'HH:mm');
}

/** Removes undefined keys so the JSON stays compact and readable. */
function compact<T extends object>(value: T): T {
    return Object.fromEntries(
        Object.entries(value).filter(([, v]) => v !== undefined)
    ) as T;
}

export function toAiEntryDetail(entry: Entry, sportsConfig: SportConfig[]): AiEntryDetail {
    const base: AiEntryDetail = {
        date: entry.date,
        time: localTime(entry.createdAt),
        type: entry.type,
        source: entry.healthConnectId ? 'health_connect' : undefined,
    };

    switch (entry.type) {
        case 'home':
            return compact({
                ...base,
                sport: sportLabel(entry, sportsConfig),
                name: entry.name,
                durationMinutes: entry.durationMinutes,
                totalReps: entry.totalReps,
                exercises: entry.exercises || undefined,
                absBlock: entry.absBlock || undefined,
                repTimeline: entry.repTimeline ? summarizeRepTimeline(entry.repTimeline) : undefined,
            });
        case 'run':
            return compact({
                ...base,
                sport: sportLabel(entry, sportsConfig),
                durationMinutes: entry.durationMinutes,
                distanceKm: round(entry.distanceKm, 2),
                paceSecPerKm: runPace(entry),
                avgSpeedKmh: entry.avgSpeed === undefined ? undefined : round(entry.avgSpeed, 2),
                elevationGainM: entry.elevationGainM === undefined ? undefined : Math.round(entry.elevationGainM),
                bpmAvg: entry.bpmAvg,
                bpmMax: entry.bpmMax,
                cardiacLoad: entry.cardiacLoad,
                calories: entry.calories,
                planSummary: entry.plan?.summary,
                notes: entry.notes,
            });
        case 'beatsaber':
            return compact({
                ...base,
                sport: sportLabel(entry, sportsConfig),
                durationMinutes: entry.durationMinutes,
                bpmAvg: entry.bpmAvg,
                bpmMax: entry.bpmMax,
                cardiacLoad: entry.cardiacLoad,
            });
        case 'custom':
            return compact({
                ...base,
                sport: sportLabel(entry, sportsConfig),
                name: entry.name,
                durationMinutes: entry.durationMinutes,
                distanceKm: entry.distanceKm === undefined ? undefined : round(entry.distanceKm, 2),
                bpmAvg: entry.bpmAvg,
                bpmMax: entry.bpmMax,
                cardiacLoad: entry.cardiacLoad,
                calories: entry.calories,
                totalReps: entry.totalReps,
                exercises: entry.exercises || undefined,
            });
        case 'meal':
            return compact({
                ...base,
                mealName: entry.mealName,
                description: entry.description || undefined,
                mealScore: entry.score,
            });
        case 'measure':
            return compact({
                ...base,
                weightKg: entry.weight,
                bodyFatPercent: entry.bodyFatPercent,
                waistCm: entry.waist,
                armCm: entry.arm,
                hipsCm: entry.hips,
            });
    }
}

function byNewest(a: Entry, b: Entry): number {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
}

function buildWeek(
    weekStart: Date,
    entries: Entry[],
    sportsConfig: SportConfig[],
    weeklyGoal: number
): AiWeekSummary {
    const start = format(weekStart, 'yyyy-MM-dd');
    const end = format(addDays(weekStart, 6), 'yyyy-MM-dd');
    const weekEntries = entries.filter((entry) => entry.date >= start && entry.date <= end);
    const sports = weekEntries.filter((entry): entry is SportEntry => isSportEntryType(entry.type));
    const meals = weekEntries.filter((entry): entry is MealEntry => entry.type === 'meal');
    const scoredMeals = meals.filter((meal) => meal.score !== undefined);
    const weights = weekEntries
        .filter((entry): entry is MeasureEntry => entry.type === 'measure' && entry.weight !== undefined)
        .sort(byNewest);

    const bySport: Record<string, number> = {};
    for (const entry of sports) {
        const label = sportLabel(entry, sportsConfig);
        bySport[label] = (bySport[label] ?? 0) + 1;
    }

    return {
        weekStart: start,
        workouts: sports.length,
        weeklyGoal,
        goalMet: sports.length >= weeklyGoal,
        activeDays: new Set(sports.map((entry) => entry.date)).size,
        durationMinutes: Math.round(sports.reduce((sum, entry) => sum + sportDuration(entry), 0)),
        distanceKm: round(sports.reduce((sum, entry) => sum + sportDistance(entry), 0), 2),
        reps: sports.reduce((sum, entry) => sum + sportReps(entry), 0),
        bySport,
        meals: meals.length,
        avgMealScore: scoredMeals.length > 0
            ? Math.round(scoredMeals.reduce((sum, meal) => sum + (meal.score as number), 0) / scoredMeals.length)
            : null,
        weightKg: weights.length > 0 ? (weights[0].weight as number) : null,
    };
}

// ============================================================================
// JSON
// ============================================================================

export function buildAiStatsExport(input: AiStatsInput): AiStatsExport {
    const { entries, settings, sportsConfig, gamification, includePersonalInfo, now } = input;
    const sorted = [...entries].sort(byNewest);
    const sports = sorted.filter((entry): entry is SportEntry => isSportEntryType(entry.type));
    const streak = calculateStreak(sports.map((entry) => entry.date));

    const bySport: Record<string, number> = {};
    for (const entry of sports) {
        const label = sportLabel(entry, sportsConfig);
        bySport[label] = (bySport[label] ?? 0) + 1;
    }

    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weeks = Array.from({ length: AI_EXPORT_WEEKS }, (_, index) =>
        buildWeek(subWeeks(currentWeekStart, index), sorted, sportsConfig, settings.weeklyGoal)
    );

    const detailFrom = format(subDays(now, AI_EXPORT_DETAIL_DAYS), 'yyyy-MM-dd');

    return {
        schema: 'spix-ai-stats',
        version: 1,
        generatedAt: now.toISOString(),
        readme: README,
        units: {
            distance: 'km',
            weight: 'kg',
            length: 'cm',
            duration: 'minutes',
            pace: 'seconds per km',
            speed: 'km/h',
            heartRate: 'bpm',
            mealScore: '0-100, higher is healthier (AI-rated in the app)',
        },
        profile: compact({
            fitnessGoal: settings.fitnessGoal,
            fitnessLevel: settings.fitnessLevel,
            weeklyGoal: settings.weeklyGoal,
            gender: includePersonalInfo ? settings.gender : undefined,
            age: includePersonalInfo ? settings.age : undefined,
            heightCm: includePersonalInfo ? settings.heightCm : undefined,
            bodyWeightKg: includePersonalInfo ? settings.bodyWeightKg : undefined,
        }),
        gamification: { level: gamification.level, xp: gamification.xp },
        streak: { currentDays: streak.current, bestDays: streak.best },
        totals: {
            firstEntryDate: sorted.length > 0 ? sorted[sorted.length - 1].date : null,
            workouts: sports.length,
            durationMinutes: Math.round(sports.reduce((sum, entry) => sum + sportDuration(entry), 0)),
            distanceKm: round(sports.reduce((sum, entry) => sum + sportDistance(entry), 0), 2),
            reps: sports.reduce((sum, entry) => sum + sportReps(entry), 0),
            meals: sorted.filter((entry) => entry.type === 'meal').length,
            measurements: sorted.filter((entry) => entry.type === 'measure').length,
            bySport,
        },
        weeks,
        measurements: sorted
            .filter((entry) => entry.type === 'measure')
            .map((entry) => toAiEntryDetail(entry, sportsConfig)),
        recentEntries: sorted
            .filter((entry) => entry.date >= detailFrom)
            .map((entry) => toAiEntryDetail(entry, sportsConfig)),
    };
}

// ============================================================================
// MARKDOWN
// ============================================================================

function cell(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') return '-';
    return String(value).replace(/\|/g, '/').replace(/\r?\n/g, '; ');
}

function formatPace(secPerKm: number | undefined): string | undefined {
    if (secPerKm === undefined) return undefined;
    const minutes = Math.floor(secPerKm / 60);
    const seconds = Math.round(secPerKm % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
}

function describeEntry(detail: AiEntryDetail): string {
    const parts: string[] = [];
    if (detail.durationMinutes !== undefined) parts.push(`${detail.durationMinutes} min`);
    if (detail.distanceKm !== undefined) parts.push(`${detail.distanceKm} km`);
    const pace = formatPace(detail.paceSecPerKm);
    if (pace) parts.push(pace);
    if (detail.elevationGainM !== undefined) parts.push(`+${detail.elevationGainM} m`);
    if (detail.totalReps !== undefined) parts.push(`${detail.totalReps} reps`);
    if (detail.bpmAvg !== undefined) parts.push(`avg ${detail.bpmAvg} bpm`);
    if (detail.bpmMax !== undefined) parts.push(`max ${detail.bpmMax} bpm`);
    if (detail.cardiacLoad !== undefined) parts.push(`load ${detail.cardiacLoad}`);
    if (detail.calories !== undefined) parts.push(`${detail.calories} kcal`);
    if (detail.repTimeline?.avgRestSeconds != null) parts.push(`avg rest ${detail.repTimeline.avgRestSeconds}s`);
    if (detail.exercises) parts.push(`exercises: ${detail.exercises}`);
    if (detail.absBlock) parts.push(`abs: ${detail.absBlock}`);
    if (detail.planSummary) parts.push(`plan: ${detail.planSummary}`);
    if (detail.notes) parts.push(`notes: ${detail.notes}`);
    return parts.join(', ');
}

export function buildAiSummaryMarkdown(stats: AiStatsExport): string {
    const lines: string[] = [];
    const push = (...items: string[]) => lines.push(...items);

    push(
        '# Spix fitness summary',
        '',
        `Generated ${stats.generatedAt}. The same data, in more detail, is in \`spix-ai-stats.json\` next to this file.`,
        '',
        '> For the AI assistant reading this: you are a fitness coach. Use the data below to spot trends',
        '> (consistency, volume, intensity, recovery, body measurements, meals) and give specific, practical advice.',
        '> Base each point on the numbers, and say when data is missing rather than guessing.',
        '',
        '## Profile',
        '',
    );

    const profile = stats.profile;
    push(`- Weekly goal: ${profile.weeklyGoal} workouts`);
    if (profile.fitnessGoal) push(`- Goal: ${profile.fitnessGoal}`);
    if (profile.fitnessLevel) push(`- Level: ${profile.fitnessLevel}`);
    if (profile.gender) push(`- Gender: ${profile.gender}`);
    if (profile.age !== undefined) push(`- Age: ${profile.age}`);
    if (profile.heightCm !== undefined) push(`- Height: ${profile.heightCm} cm`);
    if (profile.bodyWeightKg !== undefined) push(`- Body weight: ${profile.bodyWeightKg} kg`);
    push(
        `- Streak: ${stats.streak.currentDays} days (best ${stats.streak.bestDays})`,
        `- App level: ${stats.gamification.level} (${stats.gamification.xp} XP)`,
        '',
        '## All-time totals',
        '',
        `- Since: ${cell(stats.totals.firstEntryDate)}`,
        `- Workouts: ${stats.totals.workouts} (${Object.entries(stats.totals.bySport).map(([sport, count]) => `${sport}: ${count}`).join(', ') || 'none'})`,
        `- Time: ${stats.totals.durationMinutes} min, distance: ${stats.totals.distanceKm} km, reps: ${stats.totals.reps}`,
        `- Meals logged: ${stats.totals.meals}, measurements: ${stats.totals.measurements}`,
        '',
        `## Last ${stats.weeks.length} weeks`,
        '',
        '| Week of | Workouts | Goal met | Active days | Minutes | km | Reps | Sports | Meals | Meal score | Weight kg |',
        '|---|---|---|---|---|---|---|---|---|---|---|',
    );
    for (const week of stats.weeks) {
        const sports = Object.entries(week.bySport).map(([sport, count]) => `${sport} ${count}`).join(', ');
        push(
            `| ${week.weekStart} | ${week.workouts}/${week.weeklyGoal} | ${week.goalMet ? 'yes' : 'no'} | ${week.activeDays} | ${week.durationMinutes} | ${week.distanceKm} | ${week.reps} | ${cell(sports)} | ${week.meals} | ${cell(week.avgMealScore)} | ${cell(week.weightKg)} |`
        );
    }

    const measurements = stats.measurements.slice(0, 20);
    push('', '## Body measurements (latest 20)', '');
    if (measurements.length === 0) {
        push('No measurements logged.');
    } else {
        push('| Date | Weight kg | Body fat % | Waist cm | Arm cm | Hips cm |', '|---|---|---|---|---|---|');
        for (const m of measurements) {
            push(`| ${m.date} | ${cell(m.weightKg)} | ${cell(m.bodyFatPercent)} | ${cell(m.waistCm)} | ${cell(m.armCm)} | ${cell(m.hipsCm)} |`);
        }
    }

    const workouts = stats.recentEntries.filter((entry) => isSportEntryType(entry.type));
    push('', `## Workouts in the last ${AI_EXPORT_DETAIL_DAYS} days (${workouts.length})`, '');
    if (workouts.length === 0) {
        push('No workouts logged.');
    }
    for (const workout of workouts) {
        const title = workout.name ? `${workout.sport} - ${workout.name}` : workout.sport;
        push(`- ${workout.date} ${workout.time} **${cell(title)}**: ${cell(describeEntry(workout) || 'no details')}`);
    }

    const meals = stats.recentEntries.filter((entry) => entry.type === 'meal');
    push('', `## Meals in the last ${AI_EXPORT_DETAIL_DAYS} days (${meals.length})`, '');
    if (meals.length === 0) {
        push('No meals logged.');
    }
    for (const meal of meals) {
        const score = meal.mealScore !== undefined ? ` (score ${meal.mealScore})` : '';
        const description = meal.description ? `: ${cell(meal.description)}` : '';
        push(`- ${meal.date} ${meal.time} **${cell(meal.mealName)}**${score}${description}`);
    }

    push('');
    return lines.join('\n');
}
