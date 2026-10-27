'use client';

/**
 * Estado de la demo: casos, reglas, apelaciones, auditoría y bienestar. Se
 * guarda en localStorage (STORAGE_KEY) y se regenera con horas nuevas pasadas
 * MAX_AGE_HOURS. Nada sale del navegador salvo «Explicar con IA» (ver ai.ts).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { classify, type Classification } from './classifier';
import { BREAK_MINUTES, MAX_AGE_HOURS, SENSITIVE_CATEGORIES, STATE_VERSION, STORAGE_KEY, buildSeed } from './data';
import { asLang } from './format';
import { comparePriority, countRuleChanges, isAutomatic, priorityFor, routeFor, type Route } from './logic';
import { SAMPLE_CASES } from './samples';
import {
  PLATFORMS,
  type AuditEntry,
  type Bilingual,
  type CaseItem,
  type Checkin,
  type Label,
  type Lang,
  type Measure,
  type ModState,
  type PlatformView,
  type Priority,
  type Rule,
  type TabKey,
  type Team,
} from './types';

export interface Toast {
  id: number;
  text: string;
  tone: 'ok' | 'info' | 'warn';
}

export interface CaseView extends CaseItem {
  text: string;
  cls: Classification;
  label: Label;
  /** Confianza del clasificador para la categoría mostrada. */
  score: number;
  route: Route;
  /** La categoría la corrigió una persona: las reglas ya no deciden este caso. */
  corrected: boolean;
  priority: Priority;
}

const SAMPLE_BY_ID = new Map(SAMPLE_CASES.map((c) => [c.id, c]));

export function caseText(c: CaseItem, lang: Lang): string {
  if (c.source === 'yours') return c.text ?? '';
  return SAMPLE_BY_ID.get(c.id)?.content[lang] ?? '';
}

export function toView(c: CaseItem, lang: Lang, rules: Rule[]): CaseView {
  const text = caseText(c, lang);
  const cls = classify(text);
  if (c.override !== undefined) {
    const label = c.override;
    const score = label === 'none' ? cls.score : cls.scores[label];
    return { ...c, text, cls, label, score, corrected: true, route: { action: 'humanReview', ruleNo: null }, priority: priorityFor(label, 0.9) };
  }
  const route = routeFor(rules, cls.label, cls.score);
  return { ...c, text, cls, label: cls.label, score: cls.score, corrected: false, route, priority: priorityFor(cls.label, cls.score, route) };
}

export const pick = (v: Bilingual | string | undefined, lang: Lang): string => (v === undefined ? '' : typeof v === 'string' ? v : v[lang]);

const SIMULATED_APPEAL_REASON: Bilingual = {
  es: 'El usuario pide revisar de nuevo: dice que su publicación no infringe la política.',
  en: 'The user asks for another review: they say their post does not break the policy.',
};

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function load(nowMs: number): ModState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<ModState>;
      const age = typeof p.createdAt === 'string' ? (nowMs - new Date(p.createdAt).getTime()) / 3_600_000 : -1;
      if (
        p.version === STATE_VERSION &&
        age >= 0 &&
        age <= MAX_AGE_HOURS &&
        Array.isArray(p.cases) &&
        Array.isArray(p.rules) &&
        Array.isArray(p.appeals) &&
        Array.isArray(p.audit) &&
        isObj(p.session) &&
        isObj(p.wellness) &&
        typeof p.seq === 'number'
      ) {
        return p as ModState;
      }
    }
  } catch {
    /* sin almacenamiento o datos dañados: se usan los de ejemplo */
  }
  return buildSeed(nowMs);
}

export interface RejectInput {
  policy: Label;
  measure: Measure;
  note: string;
}
export interface EscalateInput {
  team: Team;
  note: string;
}

interface Ctx {
  lang: Lang;
  s: ModState;
  now: number;
  tab: TabKey;
  go: (tab: TabKey) => void;
  views: CaseView[];
  /** Pendientes de la plataforma elegida (con la rotación aplicada), por prioridad. */
  queue: CaseView[];
  /** Pendientes que la rotación de bienestar saca de tu cola. */
  hiddenByRotation: number;
  /** Resueltos (por ti o por las reglas) de la plataforma elegida, el más reciente primero. */
  resolved: CaseView[];
  activeRules: Rule[];
  selectedId: string | null;
  select: (id: string | null) => void;
  revealed: Set<string>;
  isRevealed: (c: CaseItem) => boolean;
  toggleReveal: (id: string) => void;
  setPlatform: (p: PlatformView) => void;
  approve: (id: string, note?: string) => void;
  reject: (id: string, input: RejectInput) => void;
  escalate: (id: string, input: EscalateInput) => void;
  recategorize: (id: string, to: Label) => void;
  reopen: (id: string) => void;
  applyRules: () => number;
  addCase: (text: string) => CaseView;
  simulateAppeal: (caseId: string) => string | null;
  resolveAppeal: (id: string, outcome: 'upheld' | 'reversed', note?: string) => void;
  editRules: (fn: (rules: Rule[]) => Rule[]) => void;
  saveRules: () => number;
  discardDraft: () => void;
  toggleBlurDefault: () => void;
  setRotation: (on: boolean) => void;
  pauseUntil: number | null;
  startPause: () => void;
  endPause: () => void;
  addCheckin: (c: Omit<Checkin, 'at'>) => void;
  reset: () => void;
  toasts: Toast[];
  toast: (text: string, tone?: Toast['tone']) => void;
  dismissToast: (id: number) => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function ModerationProvider({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const lang = asLang(useLocale());
  const [s, setS] = useState<ModState | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [tab, setTab] = useState<TabKey>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const openedAt = useRef<{ id: string; at: number } | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [pauseUntil, setPauseUntil] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);

  // La hora actual y localStorage solo existen en el navegador.
  useEffect(() => {
    const n = Date.now();
    setNow(n);
    setS(load(n));
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!s) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* almacenamiento lleno o bloqueado: la demo sigue en memoria */
    }
  }, [s]);

  const toast = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    toastSeq.current += 1;
    const id = toastSeq.current;
    setToasts((prev) => [...prev.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 6000);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((prev) => prev.filter((x) => x.id !== id)), []);

  const mutate = useCallback((fn: (prev: ModState) => ModState) => setS((prev) => (prev ? fn(prev) : prev)), []);

  const value = useMemo<Ctx | null>(() => {
    if (!s || now === null) return null;
    const views = s.cases.map((c) => toView(c, lang, s.rules));
    const inPlatform = (c: CaseItem) => s.platform === 'all' || c.platforms.includes(s.platform as (typeof PLATFORMS)[number]);
    const pendingHere = views.filter((v) => v.status === 'pending' && inPlatform(v));
    const rotated = (v: CaseView) => s.wellness.rotation && v.label !== 'none' && SENSITIVE_CATEGORIES.includes(v.label);
    const queue = pendingHere.filter((v) => !rotated(v)).sort(comparePriority);
    const resolved = views
      .filter((v) => v.status !== 'pending' && inPlatform(v))
      .sort((a, b) => (b.decision?.at ?? '').localeCompare(a.decision?.at ?? ''));

    const stamp = () => new Date().toISOString();
    const nextIds = (prev: ModState) => ({ seq: prev.seq + 1, audit: `au-${9100 + prev.seq + 1}`, kase: `c-${3000 + prev.seq + 1}` });
    const pushAudit = (prev: ModState, entry: Omit<AuditEntry, 'id' | 'at'>, at = stamp()): ModState => {
      const ids = nextIds(prev);
      return { ...prev, seq: ids.seq, audit: [{ id: ids.audit, at, ...entry }, ...prev.audit] };
    };
    const secondsFor = (id: string): number | undefined => {
      const o = openedAt.current;
      if (!o || o.id !== id) return undefined;
      const secs = Math.round((Date.now() - o.at) / 1000);
      return secs >= 1 ? Math.min(secs, 600) : undefined;
    };
    const decided = (prev: ModState, id: string, patch: Partial<CaseItem>, seconds?: number): ModState => ({
      ...prev,
      cases: prev.cases.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      session: {
        ...prev.session,
        decisions: prev.session.decisions + 1,
        decisionSeconds: prev.session.decisionSeconds + (seconds ?? 0),
        timedDecisions: prev.session.timedDecisions + (seconds ? 1 : 0),
      },
    });
    const labelOf = (prev: ModState, id: string): Label => {
      const c = prev.cases.find((x) => x.id === id);
      return c ? toView(c, lang, prev.rules).label : 'none';
    };
    const afterDecision = (id: string) => {
      if (selectedId === id) {
        setSelectedId(null);
        openedAt.current = null;
      }
    };

    const ctx: Ctx = {
      lang,
      s,
      now,
      tab,
      go: (t) => setTab(t),
      views,
      queue,
      hiddenByRotation: pendingHere.length - queue.length,
      resolved,
      activeRules: s.rules,
      selectedId,
      select: (id) => {
        setSelectedId(id);
        openedAt.current = id ? { id, at: Date.now() } : null;
      },
      revealed,
      isRevealed: (c) => !c.sensitive || !s.wellness.blurDefault || revealed.has(c.id),
      toggleReveal: (id) => {
        const opening = !revealed.has(id);
        setRevealed((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
        if (opening) mutate((prev) => ({ ...prev, session: { ...prev.session, reveals: prev.session.reveals + 1 } }));
      },
      setPlatform: (p) => mutate((prev) => ({ ...prev, platform: p })),
      approve: (id, note) => {
        const seconds = secondsFor(id);
        mutate((prev) => {
          const policy = labelOf(prev, id);
          const next = decided(prev, id, { status: 'approved', decision: { kind: 'approve', at: stamp(), policy, note: note || undefined, seconds } }, seconds);
          return pushAudit(next, { actor: { kind: 'you' }, action: 'approve', target: id, policy, note: note || undefined });
        });
        afterDecision(id);
      },
      reject: (id, input) => {
        const seconds = secondsFor(id);
        mutate((prev) => {
          const next = decided(
            prev,
            id,
            { status: 'rejected', decision: { kind: 'reject', at: stamp(), policy: input.policy, measure: input.measure, note: input.note || undefined, seconds } },
            seconds,
          );
          return pushAudit(next, { actor: { kind: 'you' }, action: 'reject', target: id, policy: input.policy, measure: input.measure, note: input.note || undefined });
        });
        afterDecision(id);
      },
      escalate: (id, input) => {
        const seconds = secondsFor(id);
        mutate((prev) => {
          const policy = labelOf(prev, id);
          const next = decided(
            prev,
            id,
            { status: 'escalated', decision: { kind: 'escalate', at: stamp(), policy, team: input.team, note: input.note || undefined, seconds } },
            seconds,
          );
          return pushAudit(next, { actor: { kind: 'you' }, action: 'escalate', target: id, policy, team: input.team, note: input.note || undefined });
        });
        afterDecision(id);
      },
      recategorize: (id, to) =>
        mutate((prev) => {
          const from = labelOf(prev, id);
          if (from === to) return prev;
          const next: ModState = {
            ...prev,
            cases: prev.cases.map((c) => (c.id === id ? { ...c, override: to } : c)),
            session: { ...prev.session, corrections: prev.session.corrections + 1 },
          };
          return pushAudit(next, { actor: { kind: 'you' }, action: 'recategorize', target: id, from, to });
        }),
      reopen: (id) =>
        mutate((prev) => {
          const next: ModState = { ...prev, cases: prev.cases.map((c) => (c.id === id ? { ...c, status: 'pending', decision: undefined } : c)) };
          return pushAudit(next, { actor: { kind: 'you' }, action: 'reopen', target: id });
        }),
      applyRules: () => {
        const targets = pendingHere.filter((v) => !v.corrected && isAutomatic(v.route.action));
        if (!targets.length) return 0;
        mutate((prev) => {
          let next = prev;
          for (const v of targets) {
            const at = stamp();
            next = {
              ...next,
              cases: next.cases.map((c) =>
                c.id === v.id ? { ...c, status: 'auto', decision: { kind: 'auto', at, policy: v.label, ruleAction: v.route.action, ruleNo: v.route.ruleNo ?? undefined } } : c,
              ),
            };
            next = pushAudit(next, { actor: { kind: 'rule', ruleNo: v.route.ruleNo ?? undefined }, action: 'autoRule', target: v.id, policy: v.label, ruleAction: v.route.action }, at);
          }
          return next;
        });
        if (selectedId && targets.some((v) => v.id === selectedId)) setSelectedId(null);
        return targets.length;
      },
      addCase: (text) => {
        const ids = nextIds(s);
        const at = stamp();
        const platforms = s.platform === 'all' ? [...PLATFORMS] : [s.platform];
        const draftCase: CaseItem = {
          id: ids.kase,
          type: 'text',
          source: 'yours',
          text,
          platforms,
          user: '—',
          channel: 'test',
          reporter: 'you',
          strikes: 0,
          accountAgeDays: 0,
          receivedAt: at,
          sensitive: false,
          status: 'pending',
        };
        const view = toView(draftCase, lang, s.rules);
        const kase: CaseItem = {
          ...draftCase,
          sensitive: view.label !== 'none' && SENSITIVE_CATEGORIES.includes(view.label),
          ...(isAutomatic(view.route.action)
            ? { status: 'auto' as const, decision: { kind: 'auto' as const, at, policy: view.label, ruleAction: view.route.action, ruleNo: view.route.ruleNo ?? undefined } }
            : {}),
        };
        mutate((prev) => {
          let next: ModState = { ...prev, cases: [...prev.cases, kase] };
          next = pushAudit(next, { actor: { kind: 'you' }, action: 'caseCreated', target: kase.id, policy: view.label }, at);
          if (kase.status === 'auto') {
            next = pushAudit(
              next,
              { actor: { kind: 'rule', ruleNo: view.route.ruleNo ?? undefined }, action: 'autoRule', target: kase.id, policy: view.label, ruleAction: view.route.action },
              at,
            );
          }
          return next;
        });
        return { ...view, ...kase };
      },
      simulateAppeal: (caseId) => {
        const c = s.cases.find((x) => x.id === caseId);
        if (!c || c.status !== 'rejected' || s.appeals.some((a) => a.caseRef === caseId)) return null;
        const policy = c.decision?.policy && c.decision.policy !== 'none' ? c.decision.policy : null;
        if (!policy) return null;
        const id = `a-${600 + s.seq + 1}`;
        mutate((prev) => ({
          ...prev,
          seq: prev.seq + 1,
          appeals: [
            { id, caseRef: caseId, original: 'rejected', category: policy, reason: SIMULATED_APPEAL_REASON, receivedAt: stamp(), reviewer: '', status: 'open' },
            ...prev.appeals,
          ],
        }));
        return id;
      },
      resolveAppeal: (id, outcome, note) =>
        mutate((prev) => {
          const appeal = prev.appeals.find((a) => a.id === id);
          if (!appeal || appeal.status !== 'open') return prev;
          const at = stamp();
          let next: ModState = {
            ...prev,
            appeals: prev.appeals.map((a) => (a.id === id ? { ...a, status: outcome, resolvedAt: at, note: note || undefined } : a)),
          };
          if (outcome === 'reversed' && next.cases.some((c) => c.id === appeal.caseRef)) {
            next = {
              ...next,
              cases: next.cases.map((c) =>
                c.id === appeal.caseRef ? { ...c, status: 'approved', decision: { kind: 'approve', at, policy: c.decision?.policy, note: note || undefined } } : c,
              ),
            };
          }
          return pushAudit(next, { actor: { kind: 'you' }, action: outcome === 'upheld' ? 'appealUphold' : 'appealReverse', target: id, policy: appeal.category, note: note || undefined }, at);
        }),
      editRules: (fn) => mutate((prev) => ({ ...prev, draft: fn((prev.draft ?? prev.rules).map((r) => ({ ...r }))) })),
      saveRules: () => {
        if (!s.draft) return 0;
        const changes = countRuleChanges(s.rules, s.draft);
        mutate((prev) => {
          if (!prev.draft) return prev;
          const next: ModState = { ...prev, rules: prev.draft, draft: null };
          return changes ? pushAudit(next, { actor: { kind: 'you' }, action: 'rulesEdit', target: '—', changes }) : next;
        });
        return changes;
      },
      discardDraft: () => mutate((prev) => ({ ...prev, draft: null })),
      toggleBlurDefault: () => mutate((prev) => ({ ...prev, wellness: { ...prev.wellness, blurDefault: !prev.wellness.blurDefault } })),
      setRotation: (on) => mutate((prev) => ({ ...prev, wellness: { ...prev.wellness, rotation: on } })),
      pauseUntil,
      startPause: () => {
        setPauseUntil(Date.now() + BREAK_MINUTES * 60_000);
        mutate((prev) => ({ ...prev, session: { ...prev.session, pauses: prev.session.pauses + 1 } }));
      },
      endPause: () => {
        setPauseUntil(null);
        mutate((prev) => ({ ...prev, session: { ...prev.session, lastBreakAt: stamp() } }));
      },
      addCheckin: (c) =>
        mutate((prev) => ({
          ...prev,
          wellness: { ...prev.wellness, rotation: c.rotate ? true : prev.wellness.rotation, checkins: [{ ...c, at: stamp() }, ...prev.wellness.checkins].slice(0, 20) },
        })),
      reset: () => {
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* sin almacenamiento */
        }
        const n = Date.now();
        setNow(n);
        setS(buildSeed(n));
        setSelectedId(null);
        openedAt.current = null;
        setRevealed(new Set());
        setPauseUntil(null);
      },
      toasts,
      toast,
      dismissToast,
    };
    return ctx;
  }, [s, now, lang, tab, selectedId, revealed, pauseUntil, toasts, toast, dismissToast, mutate]);

  if (!value) return <>{fallback}</>;
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useModeration(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useModeration fuera de ModerationProvider');
  return ctx;
}
