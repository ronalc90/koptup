'use client';

/**
 * Estado compartido de la demo. Todas las pantallas leen y escriben el mismo
 * estado: un cliente que das de alta aparece en el panel, en cobros, en
 * usuarios, en su portal, en la bitácora y en la API.
 *
 * Se guarda en localStorage (clave `demo:saas-boilerplate:v1`) para que tus
 * cambios sigan ahí al volver; "Reiniciar demo" lo borra. Nada sale de tu
 * navegador: no hay servidor, pasarela de pagos, DIAN ni envíos reales.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { DEMO_PERIOD, DEMO_TODAY, PLANS, STORAGE_KEY, TRIAL_DAYS, defaultState, moduleAllowed, unitsFor } from './data';
import { addDays, addMinutes } from './format';
import { checkPlanChange, findResource, isEmail, staffCount, withIva, type PlanChangeCheck, type ResourceLookup } from './logic';
import type {
  AuditAction, AuditEntry, DemoState, Invoice, Member, ModuleId, PayMethod, PlanId, Role, Screen, Tenant, TourStep, WebhookEvent, WebhookType,
} from './types';
import { MODULE_IDS, ROLES, SCREENS, STAFF_ROLES, TOUR_STEPS } from './types';

export const OWNER_ACTOR = 'tu-equipo@conjuntodemo.example';
export const SUPPORT_ACTOR = 'soporte@conjuntodemo.example';
const OWNER_IP = '198.51.100.20';

export interface Toast {
  id: number;
  key: string;
  params?: Record<string, string>;
  tone: 'ok' | 'warn' | 'error';
}

export interface NewTenantInput {
  name: string;
  city: string;
  nit: string;
  email: string;
  units: number;
  slug: string;
  plan: PlanId;
  color: string;
  logo?: string;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** Lo leído de localStorage se valida; si algo no cuadra se vuelve a los datos de ejemplo. */
function restore(raw: unknown): DemoState {
  const base = defaultState();
  if (!isObj(raw)) return base;
  const r = raw as Partial<DemoState>;
  const arrays: (keyof DemoState)[] = ['tenants', 'members', 'invoices', 'dunning', 'audit', 'webhooks', 'notices', 'units', 'reservations'];
  for (const k of arrays) if (!Array.isArray(r[k])) return base;
  const tenants = (r.tenants as Tenant[]).filter(
    (t) => isObj(t) && typeof t.id === 'string' && typeof t.slug === 'string' && t.plan in PLANS && Array.isArray(t.modules) && isObj(t.sso),
  );
  if (tenants.length === 0) return base;
  return {
    ...base,
    tenants,
    members: (r.members as Member[]).filter((m) => isObj(m) && typeof m.id === 'string' && ROLES.includes(m.role)),
    invoices: (r.invoices as Invoice[]).filter((i) => isObj(i) && typeof i.number === 'string' && typeof i.total === 'number'),
    dunning: r.dunning as DemoState['dunning'],
    audit: (r.audit as AuditEntry[]).filter((a) => isObj(a) && typeof a.action === 'string').slice(-300),
    webhooks: (r.webhooks as WebhookEvent[]).filter((w) => isObj(w) && typeof w.type === 'string').slice(-100),
    notices: r.notices as DemoState['notices'],
    units: r.units as DemoState['units'],
    reservations: r.reservations as DemoState['reservations'],
    votes: isObj(r.votes) ? (r.votes as DemoState['votes']) : base.votes,
    impersonation: isObj(r.impersonation) ? (r.impersonation as DemoState['impersonation']) : null,
    clock: typeof r.clock === 'string' ? r.clock : base.clock,
    seq: typeof r.seq === 'number' ? r.seq : base.seq,
    invoiceSeq: typeof r.invoiceSeq === 'number' ? r.invoiceSeq : base.invoiceSeq,
    selected: isObj(r.selected) ? { ...base.selected, ...(r.selected as DemoState['selected']) } : base.selected,
    tour: isObj(r.tour) ? (Object.fromEntries(TOUR_STEPS.map((k) => [k, !!(r.tour as Record<string, unknown>)[k]])) as DemoState['tour']) : base.tour,
    tourHidden: typeof r.tourHidden === 'boolean' ? r.tourHidden : false,
    progress: isObj(r.progress) ? { ...base.progress, ...(r.progress as DemoState['progress']) } : base.progress,
    // La pantalla siempre arranca en "Tu SaaS hoy".
    screen: 'dashboard',
  };
}

type Mutator = (s: DemoState) => DemoState;

/** Utilidades para registrar bitácora y webhooks dentro de una mutación. */
function logger(s: DemoState) {
  let clock = s.clock;
  let seq = s.seq;
  const audit: AuditEntry[] = [];
  const hooks: WebhookEvent[] = [];
  return {
    audit(action: AuditAction, tenantId: string | null, params: Record<string, string> = {}, actor = OWNER_ACTOR, ip = OWNER_IP) {
      clock = addMinutes(clock, 1);
      seq += 1;
      audit.push({ id: `a-${seq}`, at: clock, actor, tenantId, action, params, ip });
    },
    hook(type: WebhookType, tenantId: string, data: WebhookEvent['data']) {
      seq += 1;
      hooks.push({ id: `evt_${String(seq).padStart(4, '0')}`, type, tenantId, at: clock, data });
    },
    get clock() {
      return clock;
    },
    nextId(prefix: string) {
      seq += 1;
      return `${prefix}-${seq}`;
    },
    apply(next: DemoState): DemoState {
      return { ...next, clock, seq, audit: [...next.audit, ...audit].slice(-300), webhooks: [...next.webhooks, ...hooks].slice(-100) };
    },
  };
}

function useDemoState() {
  const [s, setS] = useState<DemoState>(defaultState);
  const [ready, setReady] = useState(false);
  /** Último estado pintado: las acciones validan contra él antes de mutar. */
  const latest = useRef(s);
  latest.current = s;
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setS(restore(JSON.parse(raw)));
    } catch {
      /* almacenamiento bloqueado: se usan los datos de ejemplo */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* sin espacio o bloqueado: la demo sigue funcionando sin guardar */
    }
  }, [s, ready]);

  const update = useCallback((fn: Mutator) => setS((prev) => fn(prev)), []);

  const toast = useCallback((key: string, params?: Record<string, string>, tone: Toast['tone'] = 'ok') => {
    toastSeq.current += 1;
    const id = toastSeq.current;
    setToasts((prev) => [...prev.slice(-2), { id, key, params, tone }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4500);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((prev) => prev.filter((x) => x.id !== id)), []);

  const go = useCallback((screen: Screen) => {
    if (!SCREENS.includes(screen)) return;
    update((p) => ({ ...p, screen }));
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [update]);

  const select = useCallback((area: keyof DemoState['selected'], tenantId: string) => {
    update((p) => ({ ...p, selected: { ...p.selected, [area]: tenantId } }));
  }, [update]);

  const markTour = useCallback((step: TourStep) => {
    update((p) => (p.tour[step] ? p : { ...p, tour: { ...p.tour, [step]: true } }));
  }, [update]);

  const setTourHidden = useCallback((hidden: boolean) => update((p) => ({ ...p, tourHidden: hidden })), [update]);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nada que borrar */
    }
    setS(defaultState());
    toast('toast.reset');
  }, [toast]);

  const createTenant = useCallback((input: NewTenantInput): string => {
    const id = `t-${input.slug}`;
    update((p) => {
      const log = logger(p);
      const tenant: Tenant = {
        id,
        name: input.name.trim(),
        slug: input.slug,
        city: input.city,
        nit: input.nit.replace(/\D/g, ''),
        email: input.email.trim().toLowerCase(),
        plan: input.plan,
        status: 'prueba',
        units: input.units,
        storageGb: 0,
        color: input.color,
        logo: input.logo,
        createdAt: DEMO_TODAY,
        trialEndsAt: addDays(DEMO_TODAY, TRIAL_DAYS),
        modules: [...PLANS[input.plan].modules],
        sso: { google: false, microsoft: false, mfa: false },
        fee: 250000,
        custom: true,
      };
      log.audit('tenant.created', id, { plan: input.plan });
      log.audit('member.invited', id, { email: tenant.email });
      log.hook('tenant.created', id, { plan: input.plan, trial_ends_at: tenant.trialEndsAt ?? '' });
      log.hook('member.invited', id, { email: tenant.email, role: 'admin' });
      const admin: Member = {
        id: log.nextId('m'), tenantId: id, name: '', email: tenant.email, role: 'admin', status: 'invitado', invitedAt: log.clock, resent: 0,
      };
      const units = unitsFor(tenant, ['101', '102', '201', '202', '301', '302']);
      const welcome = { id: log.nextId('n'), tenantId: id, title: '', body: '', at: log.clock, seedKey: 'bienvenidaNuevo' };
      return log.apply({
        ...p,
        tenants: [...p.tenants, tenant],
        members: [...p.members, admin],
        units: [...p.units, ...units],
        notices: [...p.notices, welcome],
        votes: { ...p.votes, [id]: { si: 0, no: 0, abst: 0, voted: false } },
        selected: { billing: id, access: id, portal: id, operations: id },
        tour: { ...p.tour, onboarding: true },
      });
    });
    toast('toast.tenantCreated', { name: input.name.trim() });
    return id;
  }, [update, toast]);

  const changePlan = useCallback((tenantId: string, to: PlanId): PlanChangeCheck => {
    const cur = latest.current.tenants.find((x) => x.id === tenantId);
    if (!cur) return { ok: false, reason: 'same' };
    const result = checkPlanChange(latest.current, cur, to);
    if (!result.ok) return result;
    update((p) => {
      const t = p.tenants.find((x) => x.id === tenantId);
      if (!t) return p;
      const check = checkPlanChange(p, t, to);
      if (!check.ok) return p;
      const log = logger(p);
      let invoices = p.invoices;
      let invoiceSeq = p.invoiceSeq;
      let credit = t.credit ?? 0;
      if (check.kind === 'upgrade' && check.amount > 0) {
        const { subtotal, iva, total } = withIva(check.amount);
        const last = [...p.invoices].reverse().find((i) => i.tenantId === tenantId);
        const inv: Invoice = {
          id: `inv-${invoiceSeq}`, number: `CD-${invoiceSeq}`, tenantId, period: DEMO_PERIOD, issuedAt: addMinutes(log.clock, 1),
          gross: check.amount, discount: 0, subtotal, iva, total, method: last?.method ?? 'tarjeta', concept: 'proration', plan: to,
        };
        invoiceSeq += 1;
        invoices = [...invoices, inv];
        log.audit('invoice.paid', tenantId, { number: inv.number }, 'sistema', '—');
        log.hook('invoice.paid', tenantId, { invoice: inv.number, total, currency: 'COP', method: inv.method, concept: 'proration' });
      }
      if (check.kind === 'downgrade') credit += check.amount;
      const modules = t.modules.filter((m) => moduleAllowed(to, m));
      log.audit('tenant.plan_changed', tenantId, { from: t.plan, to });
      log.hook('tenant.updated', tenantId, { plan: to });
      return log.apply({
        ...p,
        invoices,
        invoiceSeq,
        tenants: p.tenants.map((x) => (x.id === tenantId ? { ...x, plan: to, modules, credit } : x)),
      });
    });
    toast('toast.planChanged');
    return result;
  }, [update, toast]);

  /** Pago aprobado (simulado): emite la factura de ejemplo y deja al cliente al día. */
  const pay = useCallback((tenantId: string, method: PayMethod): string | null => {
    const cur = latest.current;
    const ct = cur.tenants.find((x) => x.id === tenantId);
    if (!ct || ct.status === 'cancelado') return null;
    if (cur.invoices.some((i) => i.tenantId === tenantId && i.period === DEMO_PERIOD && i.concept === 'subscription')) return null;
    const newId = `inv-${cur.invoiceSeq}`;
    update((p) => {
      const t = p.tenants.find((x) => x.id === tenantId);
      if (!t || t.status === 'cancelado') return p;
      if (p.invoices.some((i) => i.tenantId === tenantId && i.period === DEMO_PERIOD && i.concept === 'subscription')) return p;
      const log = logger(p);
      const gross = PLANS[t.plan].price;
      const discount = Math.min(gross, t.credit ?? 0);
      const { subtotal, iva, total } = withIva(gross - discount);
      const inv: Invoice = {
        id: `inv-${p.invoiceSeq}`, number: `CD-${p.invoiceSeq}`, tenantId, period: DEMO_PERIOD, issuedAt: addMinutes(log.clock, 1),
        gross, discount, subtotal, iva, total, method, concept: 'subscription', plan: t.plan,
      };
      log.audit('invoice.paid', tenantId, { number: inv.number, method });
      log.hook('invoice.paid', tenantId, { invoice: inv.number, total, currency: 'COP', method });
      if (t.status === 'suspendido') log.audit('tenant.reactivated', tenantId, {});
      return log.apply({
        ...p,
        invoices: [...p.invoices, inv],
        invoiceSeq: p.invoiceSeq + 1,
        dunning: p.dunning.filter((d) => d.tenantId !== tenantId),
        tenants: p.tenants.map((x) => (x.id === tenantId ? { ...x, status: 'activo', trialEndsAt: undefined, credit: (x.credit ?? 0) - discount } : x)),
        progress: method === 'pse' && t.custom ? { ...p.progress, pseInvoice: inv.id } : p.progress,
      });
    });
    return newId;
  }, [update]);

  const logRejected = useCallback((tenantId: string, method: PayMethod) => {
    update((p) => {
      const log = logger(p);
      log.audit('payment.rejected', tenantId, { method });
      return log.apply(p);
    });
  }, [update]);

  /** Fin de la prueba sin pago: arranca el cobro fallido (día 0). */
  const simulateFailure = useCallback((tenantId: string) => {
    update((p) => {
      const t = p.tenants.find((x) => x.id === tenantId);
      if (!t || t.status !== 'prueba') return p;
      const log = logger(p);
      const amount = withIva(PLANS[t.plan].price).total;
      log.audit('payment.failed', tenantId, {}, 'sistema', '—');
      log.audit('dunning.reminder', tenantId, { day: '0' }, 'sistema', '—');
      log.hook('payment.failed', tenantId, { period: DEMO_PERIOD, amount, currency: 'COP', reason: 'tarjeta_rechazada' });
      return log.apply({
        ...p,
        dunning: [...p.dunning.filter((d) => d.tenantId !== tenantId), { tenantId, period: DEMO_PERIOD, stage: 0, startedAt: log.clock }],
        tenants: p.tenants.map((x) => (x.id === tenantId ? { ...x, status: 'mora', trialEndsAt: undefined } : x)),
      });
    });
    toast('toast.failureSimulated', undefined, 'warn');
  }, [update, toast]);

  const advanceDunning = useCallback((tenantId: string) => {
    update((p) => {
      const d = p.dunning.find((x) => x.tenantId === tenantId);
      if (!d || d.stage >= 3) return p;
      const stage = (d.stage + 1) as 1 | 2 | 3;
      const log = logger(p);
      const day = ['0', '3', '7', '10'][stage];
      let tenants = p.tenants;
      if (stage === 3) {
        log.audit('tenant.suspended', tenantId, {}, 'sistema', '—');
        log.hook('tenant.updated', tenantId, { status: 'suspendido' });
        tenants = tenants.map((x) => (x.id === tenantId ? { ...x, status: 'suspendido' } : x));
      } else {
        log.audit('dunning.reminder', tenantId, { day }, 'sistema', '—');
      }
      return log.apply({ ...p, tenants, dunning: p.dunning.map((x) => (x.tenantId === tenantId ? { ...x, stage } : x)) });
    });
  }, [update]);

  const cancelTenant = useCallback((tenantId: string) => {
    update((p) => {
      const log = logger(p);
      log.audit('tenant.cancelled', tenantId, {});
      log.hook('tenant.updated', tenantId, { status: 'cancelado' });
      return log.apply({
        ...p,
        dunning: p.dunning.filter((d) => d.tenantId !== tenantId),
        impersonation: p.impersonation?.tenantId === tenantId ? null : p.impersonation,
        tenants: p.tenants.map((x) => (x.id === tenantId ? { ...x, status: 'cancelado', cancelledAt: DEMO_TODAY, trialEndsAt: undefined } : x)),
      });
    });
  }, [update]);

  /** Invita a un usuario. Devuelve la clave del error o null. */
  const invite = useCallback((tenantId: string, email: string, role: Role): string | null => {
    const sref = latest.current;
    const clean = email.trim().toLowerCase();
    if (!isEmail(clean)) return 'errors.email';
    if (sref.members.some((m) => m.tenantId === tenantId && m.email === clean)) return 'errors.duplicate';
    const t = sref.tenants.find((x) => x.id === tenantId);
    if (!t) return 'errors.generic';
    if (t.status === 'suspendido' || t.status === 'cancelado') return 'errors.tenantInactive';
    if (STAFF_ROLES.includes(role) && staffCount(sref.members, tenantId) >= PLANS[t.plan].maxStaff) return 'errors.staffLimit';
    update((p) => {
      const log = logger(p);
      log.audit('member.invited', tenantId, { email: clean });
      log.hook('member.invited', tenantId, { email: clean, role });
      const m: Member = { id: log.nextId('m'), tenantId, name: '', email: clean, role, status: 'invitado', invitedAt: log.clock, resent: 0 };
      return log.apply({ ...p, members: [...p.members, m] });
    });
    toast('toast.invited', { email: clean });
    return null;
  }, [update, toast]);

  const resend = useCallback((memberId: string) => {
    let email = '';
    update((p) => {
      const m = p.members.find((x) => x.id === memberId);
      if (!m || m.status !== 'invitado') return p;
      email = m.email;
      const log = logger(p);
      log.audit('member.invite_resent', m.tenantId, { email: m.email });
      return log.apply({ ...p, members: p.members.map((x) => (x.id === memberId ? { ...x, invitedAt: log.clock, resent: (x.resent ?? 0) + 1 } : x)) });
    });
    toast('toast.resent', { email });
  }, [update, toast]);

  const revoke = useCallback((memberId: string) => {
    update((p) => {
      const m = p.members.find((x) => x.id === memberId);
      if (!m || m.status !== 'invitado') return p;
      const log = logger(p);
      log.audit('member.invite_revoked', m.tenantId, { email: m.email });
      return log.apply({ ...p, members: p.members.filter((x) => x.id !== memberId) });
    });
    toast('toast.revoked', undefined, 'warn');
  }, [update, toast]);

  const accept = useCallback((memberId: string, name: string) => {
    update((p) => {
      const m = p.members.find((x) => x.id === memberId);
      if (!m || m.status !== 'invitado') return p;
      const log = logger(p);
      log.audit('member.joined', m.tenantId, { email: m.email }, m.email, '198.51.100.41');
      return log.apply({ ...p, members: p.members.map((x) => (x.id === memberId ? { ...x, status: 'activo', name: name.trim() || x.email.split('@')[0] } : x)) });
    });
    toast('toast.accepted');
  }, [update, toast]);

  /** Cambia el rol. Devuelve la clave del error o null. */
  const changeRole = useCallback((memberId: string, role: Role): string | null => {
    const sref = latest.current;
    const m = sref.members.find((x) => x.id === memberId);
    if (!m || m.role === role) return null;
    const t = sref.tenants.find((x) => x.id === m.tenantId);
    if (!t) return 'errors.generic';
    if (m.role === 'admin' && role !== 'admin') {
      const admins = sref.members.filter((x) => x.tenantId === m.tenantId && x.role === 'admin' && x.status === 'activo');
      if (admins.length <= 1 && m.status === 'activo') return 'errors.lastAdmin';
    }
    if (!STAFF_ROLES.includes(m.role) && STAFF_ROLES.includes(role) && staffCount(sref.members, m.tenantId) >= PLANS[t.plan].maxStaff) {
      return 'errors.staffLimit';
    }
    update((p) => {
      const log = logger(p);
      log.audit('member.role_changed', m.tenantId, { email: m.email, from: m.role, to: role });
      return log.apply({ ...p, members: p.members.map((x) => (x.id === memberId ? { ...x, role } : x)) });
    });
    toast('toast.roleChanged');
    return null;
  }, [update, toast]);

  const setAuth = useCallback((tenantId: string, key: keyof Tenant['sso'], value: boolean) => {
    update((p) => {
      const log = logger(p);
      log.audit('auth.settings_changed', tenantId, { setting: key, value: value ? 'on' : 'off' });
      return log.apply({ ...p, tenants: p.tenants.map((x) => (x.id === tenantId ? { ...x, sso: { ...x.sso, [key]: value } } : x)) });
    });
  }, [update]);

  const logLogin = useCallback((tenantId: string, email: string, method: string, ok: boolean) => {
    update((p) => {
      const log = logger(p);
      log.audit(ok ? 'auth.login' : 'auth.login_denied', tenantId, { email, method }, email || 'anónimo', '198.51.100.88');
      return log.apply(p);
    });
  }, [update]);

  const toggleModule = useCallback((tenantId: string, m: ModuleId) => {
    update((p) => {
      const t = p.tenants.find((x) => x.id === tenantId);
      if (!t || !MODULE_IDS.includes(m) || !moduleAllowed(t.plan, m)) return p;
      const on = !t.modules.includes(m);
      const log = logger(p);
      log.audit('module.toggled', tenantId, { module: m, value: on ? 'on' : 'off' });
      log.hook('tenant.updated', tenantId, { module: m, enabled: on });
      return log.apply({
        ...p,
        tenants: p.tenants.map((x) => (x.id === tenantId ? { ...x, modules: on ? [...x.modules, m] : x.modules.filter((y) => y !== m) } : x)),
      });
    });
  }, [update]);

  const startSupport = useCallback((tenantId: string, reason: string) => {
    update((p) => {
      const log = logger(p);
      log.audit('support.impersonation_started', tenantId, { reason: reason.trim() }, SUPPORT_ACTOR, '203.0.113.24');
      return log.apply({
        ...p,
        impersonation: { tenantId, reason: reason.trim(), startedAt: log.clock },
        selected: { ...p.selected, portal: tenantId },
        screen: 'portal',
        tour: { ...p.tour, support: true },
      });
    });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [update]);

  const endSupport = useCallback(() => {
    update((p) => {
      if (!p.impersonation) return p;
      const log = logger(p);
      log.audit('support.impersonation_ended', p.impersonation.tenantId, {}, SUPPORT_ACTOR, '203.0.113.24');
      return log.apply({ ...p, impersonation: null });
    });
    toast('toast.supportEnded');
  }, [update, toast]);

  const publishNotice = useCallback((tenantId: string, title: string, body: string, via: 'portal' | 'api') => {
    update((p) => {
      const log = logger(p);
      const t = p.tenants.find((x) => x.id === tenantId);
      const support = p.impersonation?.tenantId === tenantId;
      const actor = via === 'api' ? 'api' : support ? SUPPORT_ACTOR : t?.email ?? OWNER_ACTOR;
      log.audit('notice.published', tenantId, { title: title.trim(), via }, actor, support ? '203.0.113.24' : '198.51.100.41');
      const n = { id: log.nextId('n'), tenantId, title: title.trim(), body: body.trim(), at: log.clock };
      log.hook('notice.published', tenantId, { notice: n.id, title: n.title });
      return log.apply({ ...p, notices: [...p.notices, n] });
    });
  }, [update]);

  const payFee = useCallback((unitId: string) => {
    update((p) => ({ ...p, units: p.units.map((u) => (u.id === unitId ? { ...u, paid: true } : u)) }));
    toast('toast.feePaid');
  }, [update, toast]);

  const reserve = useCallback((tenantId: string, zone: string, date: string, unit: string): string | null => {
    const sref = latest.current;
    if (!zone || !date || !unit) return 'errors.required';
    if (date < DEMO_TODAY) return 'errors.pastDate';
    if (sref.reservations.some((r) => r.tenantId === tenantId && r.zone === zone && r.date === date)) return 'errors.zoneTaken';
    update((p) => {
      const log = logger(p);
      return log.apply({ ...p, reservations: [...p.reservations, { id: log.nextId('r'), tenantId, zone, date, unit }] });
    });
    toast('toast.reserved');
    return null;
  }, [update, toast]);

  const vote = useCallback((tenantId: string, option: 'si' | 'no' | 'abst') => {
    update((p) => {
      const v = p.votes[tenantId] ?? { si: 0, no: 0, abst: 0, voted: false };
      if (v.voted) return p;
      return { ...p, votes: { ...p.votes, [tenantId]: { ...v, [option]: v[option] + 1, voted: true } } };
    });
    toast('toast.voted');
  }, [update, toast]);

  const checkResource = useCallback((tenantId: string, resourceId: string): ResourceLookup => {
    const sref = latest.current;
    const res = findResource(sref, tenantId, resourceId);
    const viewer = sref.tenants.find((x) => x.id === tenantId);
    if (!res.ok && res.reason === 'forbidden') {
      update((p) => {
        const log = logger(p);
        const support = p.impersonation?.tenantId === tenantId;
        log.audit('portal.access_denied', tenantId, { resource: resourceId.trim() }, support ? SUPPORT_ACTOR : viewer?.email ?? OWNER_ACTOR, '198.51.100.41');
        const done = !!viewer?.custom;
        return log.apply({
          ...p,
          progress: { ...p.progress, isolationTested: p.progress.isolationTested || done },
          tour: done ? { ...p.tour, portal: true } : p.tour,
        });
      });
    }
    return res;
  }, [update]);

  const logApi = useCallback((tenantId: string | null, method: string, path: string, status: number) => {
    update((p) => {
      const log = logger(p);
      log.audit('api.request', tenantId, { method, path, status: String(status) }, 'api', '198.51.100.120');
      return log.apply(p);
    });
  }, [update]);

  const markInvoiceOpened = useCallback((invoiceId: string) => {
    update((p) => {
      if (p.progress.pseInvoice !== invoiceId) return p;
      return { ...p, progress: { ...p.progress, invoiceOpened: true }, tour: { ...p.tour, payment: true } };
    });
  }, [update]);

  return {
    s, ready, toasts, toast, dismissToast, go, select, markTour, setTourHidden, reset,
    createTenant, changePlan, pay, logRejected, simulateFailure, advanceDunning, cancelTenant,
    invite, resend, revoke, accept, changeRole, setAuth, logLogin, toggleModule,
    startSupport, endSupport, publishNotice, payFee, reserve, vote, checkResource, logApi, markInvoiceOpened,
  };
}

export type DemoApi = ReturnType<typeof useDemoState>;

const Ctx = createContext<DemoApi | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const api = useDemoState();
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useDemo(): DemoApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDemo fuera de DemoProvider');
  return v;
}
