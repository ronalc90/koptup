/**
 * Constantes y datos iniciales de la demo (plataforma ficticia). Las fechas se
 * calculan relativas al momento en que abres la demo.
 */
import { SAMPLE_APPEALS, SAMPLE_AUDIT, SAMPLE_CASES } from './samples';
import type { AuditEntry, CategoryKey, ModState, PlatformId, Rule, Severity } from './types';

export const STORAGE_KEY = 'koptup.demo.moderacion.v1';
export const STATE_VERSION = 1;
/** Pasado este tiempo, los datos de ejemplo se regeneran con horas nuevas. */
export const MAX_AGE_HOURS = 24;
/** Plazo objetivo para responder una apelación (de ejemplo, configurable en un proyecto). */
export const APPEAL_SLA_HOURS = 24;
/** Cada cuánto se sugiere una pausa y cuánto dura en la demo. */
export const BREAK_EVERY_MIN = 50;
export const BREAK_MINUTES = 5;

export const SEVERITY: Record<CategoryKey, Severity> = {
  minors: 'critical',
  selfHarm: 'critical',
  sexual: 'high',
  hate: 'high',
  harassment: 'high',
  scam: 'high',
  impersonation: 'high',
  illegalLending: 'high',
  offPlatform: 'medium',
  fakeReview: 'medium',
  spam: 'low',
};

/** Categorías que la rotación de bienestar saca de tu cola por un rato. */
export const SENSITIVE_CATEGORIES: CategoryKey[] = ['minors', 'selfHarm', 'sexual', 'hate'];

export const PLATFORM_CATEGORIES: Record<PlatformId, CategoryKey[]> = {
  marketplace: ['offPlatform', 'scam', 'fakeReview', 'illegalLending', 'impersonation', 'harassment', 'sexual', 'spam'],
  media: ['hate', 'harassment', 'selfHarm', 'scam', 'sexual', 'spam'],
  education: ['minors', 'harassment', 'selfHarm', 'sexual', 'hate'],
  fintech: ['scam', 'impersonation', 'illegalLending', 'offPlatform', 'harassment', 'sexual'],
  jobs: ['scam', 'hate', 'offPlatform', 'sexual'],
};

export const CATEGORY_COLORS: Record<CategoryKey | 'none', string> = {
  minors: 'bg-purple-500/15 text-purple-700 dark:text-purple-200 border border-purple-500/30',
  selfHarm: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-200 border border-fuchsia-500/30',
  sexual: 'bg-pink-500/15 text-pink-700 dark:text-pink-200 border border-pink-500/30',
  hate: 'bg-orange-500/15 text-orange-700 dark:text-orange-200 border border-orange-500/30',
  harassment: 'bg-rose-500/15 text-rose-700 dark:text-rose-200 border border-rose-500/30',
  scam: 'bg-red-500/15 text-red-700 dark:text-red-200 border border-red-500/30',
  impersonation: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-200 border border-indigo-500/30',
  illegalLending: 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30',
  offPlatform: 'bg-sky-500/15 text-sky-700 dark:text-sky-200 border border-sky-500/30',
  fakeReview: 'bg-teal-500/15 text-teal-700 dark:text-teal-200 border border-teal-500/30',
  spam: 'bg-yellow-500/15 text-yellow-800 dark:text-yellow-200 border border-yellow-500/30',
  none: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border border-emerald-500/30',
};

export const PRIORITY_COLORS: Record<Severity, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-300 text-yellow-950',
  low: 'bg-secondary-200 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-100',
};

export const DEFAULT_RULES: Rule[] = [
  { id: 'r-1', category: 'scam', operator: 'gt', threshold: 0.8, action: 'autoReject', active: true },
  { id: 'r-2', category: 'scam', operator: 'between', threshold: 0.5, threshold2: 0.8, action: 'humanReview', active: true },
  { id: 'r-3', category: 'minors', operator: 'gt', threshold: 0.4, action: 'escalate', active: true },
  { id: 'r-4', category: 'sexual', operator: 'gt', threshold: 0.9, action: 'autoReject', active: true },
  { id: 'r-5', category: 'spam', operator: 'gt', threshold: 0.75, action: 'limit', active: true },
  { id: 'r-6', category: 'selfHarm', operator: 'gt', threshold: 0.3, action: 'humanReview', active: true },
  { id: 'r-7', category: 'offPlatform', operator: 'gt', threshold: 0.8, action: 'warn', active: true },
  { id: 'r-8', category: 'illegalLending', operator: 'gt', threshold: 0.7, action: 'escalate', active: false },
  { id: 'r-9', category: 'any', operator: 'lt', threshold: 0.2, action: 'autoApprove', active: true },
];

/**
 * Mezcla de categorías del lote de ejemplo (y del informe de transparencia de
 * ejemplo), en porcentaje. Suma 100.
 */
export const CATEGORY_MIX: Record<CategoryKey, number> = {
  spam: 28,
  offPlatform: 16,
  scam: 13,
  harassment: 11,
  fakeReview: 8,
  sexual: 7,
  hate: 6,
  impersonation: 5,
  illegalLending: 3,
  selfHarm: 2,
  minors: 1,
};

/** Informe de transparencia de ejemplo: los últimos cuatro meses completos. */
export const REPORT_MONTHS = [
  { removed: 5120, appeals: 214, reinstated: 31 },
  { removed: 5480, appeals: 236, reinstated: 38 },
  { removed: 5960, appeals: 251, reinstated: 35 },
  { removed: 6210, appeals: 262, reinstated: 41 },
];

const iso = (ms: number) => new Date(ms).toISOString();

export function buildSeed(nowMs: number): ModState {
  const minute = 60_000;
  const audit: AuditEntry[] = SAMPLE_AUDIT.map((a) => ({
    id: a.id,
    at: iso(nowMs - a.minutesAgo * minute),
    actor: a.actor,
    action: a.action,
    target: a.target,
    policy: a.policy,
    measure: a.measure,
    team: a.team,
    from: a.from,
    to: a.to,
    ruleAction: a.ruleAction,
    changes: a.changes,
    note: a.note,
  }));
  return {
    version: STATE_VERSION,
    createdAt: iso(nowMs),
    platform: 'marketplace',
    cases: SAMPLE_CASES.map((c) => ({
      id: c.id,
      type: c.type,
      source: 'sample',
      platforms: c.platforms,
      user: c.user,
      channel: c.channel,
      reporter: c.reporter,
      strikes: c.strikes,
      accountAgeDays: c.accountAgeDays,
      receivedAt: iso(nowMs - c.minutesAgo * minute),
      sensitive: c.sensitive,
      status: 'pending',
    })),
    rules: DEFAULT_RULES.map((r) => ({ ...r })),
    draft: null,
    appeals: SAMPLE_APPEALS.map((a) => ({
      id: a.id,
      caseRef: a.caseRef,
      original: a.original,
      category: a.category,
      reason: a.reason,
      receivedAt: iso(nowMs - a.hoursAgo * 60 * minute),
      reviewer: a.reviewer,
      status: 'open',
    })),
    audit,
    seq: 0,
    session: {
      startedAt: iso(nowMs),
      lastBreakAt: iso(nowMs),
      decisions: 0,
      decisionSeconds: 0,
      timedDecisions: 0,
      reveals: 0,
      pauses: 0,
      corrections: 0,
    },
    wellness: { blurDefault: true, rotation: false, checkins: [] },
  };
}
