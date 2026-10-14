'use client';

/**
 * Estado de la demo: sobres, plantillas propias y el asistente a medio armar.
 * Se guarda en localStorage (clave STORAGE_KEY) y se regenera con fechas nuevas
 * pasados MAX_AGE_DAYS. Nada sale del navegador: no hay servidor, correos,
 * SMS, WhatsApp ni entidad de certificación.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { asLoc, bogotaNow, dayOf, diffMinutes, type Loc } from './dates';
import {
  AUTH_BY_TEMPLATE,
  MAX_AGE_DAYS,
  STATE_VERSION,
  STORAGE_KEY,
  TEMPLATE_SUBJECT_VAR,
  defaultSigners,
  genericSigners,
  isBuiltin,
  suggestedFields,
  type BuiltinTemplateId,
} from './data';
import { authenticate, codeSent, expireIfDue, markViewed, remind, sendEnvelope, senderWhere, signEnvelope, voidEnvelope, type Where } from './actions';
import { detectVars, deviceLabel, renderTemplate } from './logic';
import { buildSeed, emptyDraft, templateSample, type TemplateText } from './seed';
import { sha256Hex } from './sha256';
import type { AuthMethod, BulkRow, CustomTemplate, DemoState, Draft, Envelope, SignatureMark, Stamp, Tab } from './types';
import { TABS } from './types';

export interface Toast {
  id: number;
  text: string;
  tone: 'ok' | 'info' | 'warn';
}

interface Ctx {
  s: DemoState;
  now: Stamp;
  loc: Loc;
  tab: Tab;
  go: (tab: Tab, focus?: { envId?: string; signerId?: string }) => void;
  focusEnv: string | null;
  setFocusEnv: (id: string | null) => void;
  focusSigner: string | null;
  setFocusSigner: (id: string | null) => void;
  highlight: string | null;
  text: TemplateText;
  templateBody: (id: string | undefined) => string;
  templateVars: (id: string | undefined) => string[];
  docText: (env: Pick<Envelope, 'doc'>) => string;
  envTitle: (env: Pick<Envelope, 'title' | 'subject' | 'doc'>) => string;
  patchDraft: (p: Partial<Draft>) => void;
  startDraft: (templateId?: string) => void;
  pickTemplate: (templateId: string) => void;
  setDraftVars: (vars: Record<string, string>) => void;
  editEnvelope: (envId: string, duplicate?: boolean) => void;
  saveDraft: () => string;
  sendDraft: () => string;
  discardDraft: () => void;
  deleteDraftEnvelope: (envId: string) => void;
  remindEnv: (envId: string) => void;
  voidEnv: (envId: string) => void;
  view: (envId: string, signerId: string) => void;
  sendCode: (envId: string, signerId: string) => void;
  verify: (envId: string, signerId: string, method: AuthMethod) => void;
  sign: (envId: string, signerId: string, mark: SignatureMark, values: Record<string, string>) => void;
  addTemplate: (name: string, body: string) => string;
  deleteTemplate: (id: string) => void;
  bulkSend: (templateId: string, rows: BulkRow[]) => number;
  reset: () => void;
  toasts: Toast[];
  toast: (text: string, tone?: Toast['tone']) => void;
  dismissToast: (id: number) => void;
}

const StoreContext = createContext<Ctx | null>(null);

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function load(now: Stamp, loc: Loc, text: TemplateText): DemoState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<DemoState>;
      const age = typeof p.baseDate === 'string' ? diffMinutes(p.baseDate, dayOf(now)) / 1440 : -1;
      if (p.version === STATE_VERSION && age >= 0 && age <= MAX_AGE_DAYS && Array.isArray(p.envelopes) && Array.isArray(p.templates) && isObj(p.draft) && typeof p.seq === 'number') {
        const envelopes = (p.envelopes as Envelope[]).filter((e) => isObj(e) && typeof e.id === 'string' && isObj(e.doc) && Array.isArray(e.signers) && Array.isArray(e.events));
        return { ...(p as DemoState), envelopes, draft: { ...emptyDraft(), ...(p.draft as Draft) } };
      }
    }
  } catch {
    /* sin almacenamiento o datos dañados: se usan los de ejemplo */
  }
  return buildSeed(now, loc, text);
}

function device(): string {
  return typeof navigator === 'undefined' ? 'Web' : deviceLabel(navigator.userAgent);
}

/** IP de ejemplo (rango de documentación) para quien firma en la demo. */
function signerWhere(envelope: Envelope, signerId: string): Where {
  const idx = Math.max(0, envelope.signers.findIndex((s) => s.id === signerId));
  return { ip: `198.51.100.${180 + idx * 7}`, device: device(), geo: '' };
}

export function FirmaProvider({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const t = useTranslations('demoSign');
  const loc = asLoc(useLocale());
  const [s, setS] = useState<DemoState | null>(null);
  const [now, setNow] = useState<Stamp | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [focusEnv, setFocusEnv] = useState<string | null>(null);
  const [focusSigner, setFocusSigner] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);

  const text = useMemo<TemplateText>(
    () => ({
      body: (id: BuiltinTemplateId) => t.raw(`templates.items.${id}.body`) as string,
      sample: (id: BuiltinTemplateId) => t.raw(`templates.items.${id}.sample`) as Record<string, string>,
    }),
    [t],
  );

  // La fecha de Colombia y localStorage solo existen en el navegador.
  useEffect(() => {
    const n = bogotaNow();
    setNow(n);
    setS(load(n, loc, text));
    const timer = window.setInterval(() => setNow(bogotaNow()), 60000);
    return () => window.clearInterval(timer);
    // Solo al montar: cambiar de idioma no regenera los datos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vence los sobres cuya fecha límite pasó (al cargar y cada minuto).
  useEffect(() => {
    if (!now) return;
    setS((prev) => {
      if (!prev) return prev;
      const envelopes = prev.envelopes.map((e) => expireIfDue(e, now));
      return envelopes.some((e, i) => e !== prev.envelopes[i]) ? { ...prev, envelopes } : prev;
    });
  }, [now]);

  useEffect(() => {
    if (!s) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* almacenamiento lleno o bloqueado: la demo sigue en memoria */
    }
  }, [s]);

  const toast = useCallback((txt: string, tone: Toast['tone'] = 'ok') => {
    toastSeq.current += 1;
    const id = toastSeq.current;
    setToasts((prev) => [...prev.slice(-2), { id, text: txt, tone }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 6000);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((prev) => prev.filter((x) => x.id !== id)), []);

  const mutate = useCallback((fn: (prev: DemoState) => DemoState) => setS((prev) => (prev ? fn(prev) : prev)), []);
  const mapEnv = useCallback(
    (envId: string, fn: (e: Envelope) => Envelope) => mutate((prev) => ({ ...prev, envelopes: prev.envelopes.map((e) => (e.id === envId ? fn(e) : e)) })),
    [mutate],
  );

  const value = useMemo<Ctx | null>(() => {
    if (!s || !now) return null;

    const custom = (id: string | undefined) => s.templates.find((x) => x.id === id);
    const templateBody = (id: string | undefined) => (isBuiltin(id) ? text.body(id) : (custom(id)?.body ?? ''));
    const templateVars = (id: string | undefined) => {
      if (isBuiltin(id)) return detectVars(text.body(id));
      return custom(id)?.vars ?? [];
    };
    const docText = (env: Pick<Envelope, 'doc'>) => (env.doc.kind === 'template' ? renderTemplate(templateBody(env.doc.templateId), env.doc.vars ?? {}) : '');
    const templateName = (id: string | undefined) => (isBuiltin(id) ? t(`templates.items.${id}.name`) : (custom(id)?.name ?? t('templates.deleted')));
    const envTitle = (env: Pick<Envelope, 'title' | 'subject' | 'doc'>) => {
      if (env.title.trim()) return env.title.trim();
      if (env.doc.kind === 'template') return env.subject ? `${templateName(env.doc.templateId)} — ${env.subject}` : templateName(env.doc.templateId);
      return env.doc.fileName ?? t('common.untitled');
    };
    const stamp = () => bogotaNow();
    const sender = () => senderWhere(device());

    const nextId = (prev: DemoState) => `SOB-${String(prev.seq + 1).padStart(4, '0')}`;

    const draftForTemplate = (templateId: string): Partial<Draft> => {
      const vars = isBuiltin(templateId) ? templateSample(templateId, now, loc, text) : Object.fromEntries(templateVars(templateId).map((v) => [v, '']));
      const subject = isBuiltin(templateId) ? vars[TEMPLATE_SUBJECT_VAR[templateId]] : '';
      return {
        doc: { kind: 'template', templateId, vars, hash: sha256Hex(renderTemplate(templateBody(templateId), vars)) },
        subject,
        title: '',
        signers: isBuiltin(templateId) ? defaultSigners(templateId, subject) : genericSigners(),
        fields: [],
        auth: isBuiltin(templateId) ? AUTH_BY_TEMPLATE[templateId] : 'emailOtp',
      };
    };

    const envFromDraft = (d: Draft, id: string, createdAt: Stamp): Envelope => ({
      id,
      title: d.title,
      subject: d.subject,
      doc: d.doc ?? { kind: 'upload', fileName: '', hash: sha256Hex('') },
      signers: d.signers.map((x) => ({ ...x, state: 'pending' as const, signedAt: undefined, signature: undefined, values: undefined })),
      fields: d.fields,
      mode: d.mode,
      auth: d.auth,
      sigType: d.sigType,
      expiryDays: d.expiryDays,
      reminderDays: d.reminderDays,
      timestamp: d.timestamp,
      redlines: d.redlines,
      comments: d.redlines ? d.comments : [],
      status: 'draft',
      createdAt,
      updatedAt: stamp(),
      events: [],
      origin: 'wizard',
    });

    return {
      s,
      now,
      loc,
      tab,
      go: (next, focus) => {
        if (focus?.envId !== undefined) setFocusEnv(focus.envId);
        if (focus?.signerId !== undefined) setFocusSigner(focus.signerId);
        setTab(TABS.includes(next) ? next : 'home');
        if (typeof window !== 'undefined') {
          const el = document.getElementById('firma-panel');
          if (el && el.getBoundingClientRect().top < 80) window.scrollTo({ top: Math.max(0, window.scrollY + el.getBoundingClientRect().top - 96), behavior: 'smooth' });
        }
      },
      focusEnv,
      setFocusEnv,
      focusSigner,
      setFocusSigner,
      highlight,
      text,
      templateBody,
      templateVars,
      docText,
      envTitle,
      patchDraft: (p) => mutate((prev) => ({ ...prev, draft: { ...prev.draft, ...p } })),
      startDraft: (templateId) =>
        mutate((prev) => ({ ...prev, draft: { ...emptyDraft(), ...(templateId ? draftForTemplate(templateId) : {}) } })),
      pickTemplate: (templateId) => mutate((prev) => ({ ...prev, draft: { ...prev.draft, ...draftForTemplate(templateId) } })),
      setDraftVars: (vars) =>
        mutate((prev) => {
          const d = prev.draft;
          if (!d.doc || d.doc.kind !== 'template') return prev;
          const id = d.doc.templateId;
          const subjectVar = isBuiltin(id) ? TEMPLATE_SUBJECT_VAR[id] : templateVars(id)[0];
          const subject = subjectVar ? (vars[subjectVar] ?? '').trim() : '';
          // La persona del documento firma primero: su nombre sigue a la variable.
          const signers = d.signers.map((x, i) => (i === 0 && x.name === d.subject ? { ...x, name: subject } : x));
          return {
            ...prev,
            draft: { ...d, subject, signers, doc: { ...d.doc, vars, hash: sha256Hex(renderTemplate(templateBody(id), vars)) } },
          };
        }),
      editEnvelope: (envId, duplicate = false) =>
        mutate((prev) => {
          const e = prev.envelopes.find((x) => x.id === envId);
          if (!e) return prev;
          return {
            ...prev,
            draft: {
              editingId: duplicate ? null : e.id,
              step: 0,
              title: e.title,
              subject: e.subject,
              doc: e.doc,
              signers: e.signers.map((x) => ({ ...x, state: 'pending' as const, signedAt: undefined, signature: undefined, values: undefined })),
              fields: e.fields,
              mode: e.mode,
              auth: e.auth,
              sigType: e.sigType,
              expiryDays: e.expiryDays,
              reminderDays: e.reminderDays,
              timestamp: e.timestamp,
              redlines: e.redlines,
              comments: e.comments,
            },
          };
        }),
      saveDraft: () => {
        let id = s.draft.editingId ?? nextId(s);
        mutate((prev) => {
          const d = prev.draft;
          const existing = d.editingId ? prev.envelopes.find((x) => x.id === d.editingId && x.status === 'draft') : undefined;
          id = existing?.id ?? nextId(prev);
          const env = envFromDraft(d, id, existing?.createdAt ?? stamp());
          return {
            ...prev,
            seq: existing ? prev.seq : prev.seq + 1,
            envelopes: existing ? prev.envelopes.map((x) => (x.id === id ? env : x)) : [env, ...prev.envelopes],
            draft: { ...d, editingId: id },
          };
        });
        setHighlight(id);
        return id;
      },
      sendDraft: () => {
        let id = s.draft.editingId ?? nextId(s);
        mutate((prev) => {
          const d = prev.draft;
          const existing = d.editingId ? prev.envelopes.find((x) => x.id === d.editingId && x.status === 'draft') : undefined;
          id = existing?.id ?? nextId(prev);
          const at = stamp();
          const env = sendEnvelope(envFromDraft(d, id, existing?.createdAt ?? at), at, sender());
          return {
            ...prev,
            seq: existing ? prev.seq : prev.seq + 1,
            envelopes: existing ? prev.envelopes.map((x) => (x.id === id ? env : x)) : [env, ...prev.envelopes],
            draft: emptyDraft(),
          };
        });
        setHighlight(id);
        return id;
      },
      discardDraft: () => mutate((prev) => ({ ...prev, draft: emptyDraft() })),
      deleteDraftEnvelope: (envId) =>
        mutate((prev) => ({
          ...prev,
          envelopes: prev.envelopes.filter((x) => !(x.id === envId && x.status === 'draft')),
          draft: prev.draft.editingId === envId ? { ...prev.draft, editingId: null } : prev.draft,
        })),
      remindEnv: (envId) => mapEnv(envId, (e) => remind(e, stamp(), sender())),
      voidEnv: (envId) => mapEnv(envId, (e) => voidEnvelope(e, stamp(), sender())),
      view: (envId, signerId) => mapEnv(envId, (e) => markViewed(e, signerId, stamp(), signerWhere(e, signerId))),
      sendCode: (envId, signerId) => mapEnv(envId, (e) => codeSent(e, signerId, stamp())),
      verify: (envId, signerId, method) => mapEnv(envId, (e) => authenticate(e, signerId, stamp(), signerWhere(e, signerId), method)),
      sign: (envId, signerId, mark, values) => mapEnv(envId, (e) => signEnvelope(e, signerId, stamp(), signerWhere(e, signerId), mark, values)),
      addTemplate: (name, body) => {
        const id = `tpl-${s.seq + s.templates.length + 1}-${sha256Hex(name + body).slice(0, 6)}`;
        const tpl: CustomTemplate = { id, name: name.trim(), body, vars: detectVars(body) };
        mutate((prev) => ({ ...prev, templates: [...prev.templates, tpl] }));
        return id;
      },
      deleteTemplate: (id) => mutate((prev) => ({ ...prev, templates: prev.templates.filter((x) => x.id !== id) })),
      bulkSend: (templateId, rows) => {
        const valid = rows.filter((r) => r.errors.length === 0);
        mutate((prev) => {
          let seq = prev.seq;
          const at = stamp();
          const created: Envelope[] = valid.map((r) => {
            seq += 1;
            const id = `SOB-${String(seq).padStart(4, '0')}`;
            const vars = { ...r.vars };
            const signers = (isBuiltin(templateId) ? defaultSigners(templateId, r.name, `${id}-s`) : genericSigners()).map((x, i) =>
              i === 0 ? { ...x, name: r.name, email: r.email, phone: r.phone, channel: r.phone ? ('whatsapp' as const) : ('email' as const) } : x,
            );
            const base: Envelope = {
              ...envFromDraft(
                { ...emptyDraft(), subject: r.name, signers, auth: isBuiltin(templateId) ? AUTH_BY_TEMPLATE[templateId] : 'emailOtp' },
                id,
                at,
              ),
              doc: { kind: 'template', templateId, vars, hash: sha256Hex(renderTemplate(templateBody(templateId), vars)) },
              fields: suggestedFields(signers, `${id}-f`),
              origin: 'bulk',
            };
            return sendEnvelope(base, at, sender());
          });
          return { ...prev, seq, envelopes: [...created.reverse(), ...prev.envelopes] };
        });
        return valid.length;
      },
      reset: () => {
        const n = bogotaNow();
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* nada que borrar */
        }
        setNow(n);
        setS(buildSeed(n, loc, text));
        setTab('home');
        setFocusEnv(null);
        setFocusSigner(null);
        setHighlight(null);
      },
      toasts,
      toast,
      dismissToast,
    };
  }, [s, now, loc, tab, focusEnv, focusSigner, highlight, text, t, toasts, toast, dismissToast, mutate, mapEnv]);

  if (!value) return <>{fallback}</>;
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useFirma(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useFirma fuera de FirmaProvider');
  return ctx;
}
