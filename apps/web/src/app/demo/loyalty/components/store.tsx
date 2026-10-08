'use client';

/**
 * Estado compartido de la demo (caja, app del miembro, configuración y
 * resultados). Se guarda solo en este navegador (localStorage) y se carga
 * después de montar la página para no romper la hidratación.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  DEFAULT_ALERTS,
  DEFAULT_ALLIES,
  DEFAULT_CAMPAIGNS,
  DEFAULT_DRAWS,
  DEFAULT_EXPERIMENTS,
  DEFAULT_MISSIONS,
  DEFAULT_RULES,
  FRAUD_RULES,
  INITIAL_LEDGER,
  MEMBERS,
  REWARDS,
  rewardById,
  type Ally,
  type AlertStatus,
  type Campaign,
  type CampaignStatus,
  type ChannelKey,
  type Draw,
  type Experiment,
  type ExperimentId,
  type FraudAlert,
  type LedgerTx,
  type Member,
  type Mission,
  type Rules,
  type SedeKey,
  type TierKey,
} from './data';
import {
  balanceOf,
  claimKey,
  couponCode,
  missionProgress,
  quoteSale,
  thresholdsValid,
  tierFor,
  yearPoints,
  type SaleLine,
} from './engine';

export interface Sale {
  id: string;
  memberId: string;
  date: string;
  time: string;
  sede: SedeKey;
  channel: ChannelKey;
  lines: SaleLine[];
  gross: number;
  discount: number;
  paid: number;
  points: number;
  dayApplied: boolean;
  redeemedPoints: number;
  redeemRewardId?: string;
  couponUsed?: string;
  reversed?: boolean;
  tierBefore: TierKey;
  tierAfter: TierKey;
  balanceAfter: number;
  whatsapp: boolean;
}

export interface Coupon {
  code: string;
  memberId: string;
  kind: 'reward' | 'birthday';
  rewardId?: string;
  /** Descuento en pesos si es un bono (0 si es producto, servicio o donación). */
  value: number;
  date: string;
  time: string;
  status: 'valid' | 'used';
  usedSaleId?: string;
}

export interface LoyaltyState {
  v: number;
  rules: Rules;
  members: Member[];
  ledger: LedgerTx[];
  sales: Sale[];
  coupons: Coupon[];
  stock: Record<string, number>;
  missions: Mission[];
  claims: string[];
  birthdayClaimed: string[];
  campaigns: Campaign[];
  alerts: FraudAlert[];
  experiments: Experiment[];
  allies: Ally[];
  draws: Draw[];
  activeMemberId: string;
  seq: number;
  saleSeq: number;
  couponSeq: number;
}

const STORAGE_KEY = 'koptup-demo-loyalty-v1';
const VERSION = 1;
export const BIRTHDAY_GIFT = 15000;

export function initialState(): LoyaltyState {
  const stock: Record<string, number> = {};
  REWARDS.forEach((r) => {
    if (typeof r.stock === 'number') stock[r.id] = r.stock;
  });
  return {
    v: VERSION,
    rules: structuredCloneSafe(DEFAULT_RULES),
    members: MEMBERS.map((m) => ({ ...m })),
    ledger: INITIAL_LEDGER.map((tx) => ({ ...tx })),
    sales: [],
    coupons: [],
    stock,
    missions: DEFAULT_MISSIONS.map((m) => ({ ...m })),
    claims: [],
    birthdayClaimed: [],
    campaigns: DEFAULT_CAMPAIGNS.map((c) => ({ ...c })),
    alerts: DEFAULT_ALERTS.map((a) => ({ ...a })),
    experiments: DEFAULT_EXPERIMENTS.map((e) => ({ ...e })),
    allies: DEFAULT_ALLIES.map((a) => ({ ...a })),
    draws: DEFAULT_DRAWS.map((d) => ({ ...d })),
    activeMemberId: 'm-laura',
    seq: 0,
    saleSeq: 0,
    couponSeq: 0,
  };
}

function structuredCloneSafe<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/* ------------------------------- Resultados ------------------------------- */

export type EnrollError = 'name' | 'cedula' | 'phone' | 'email' | 'consent' | 'duplicateCedula' | 'duplicatePhone' | 'referrerNotFound';

export interface EnrollInput {
  name: string;
  cedula: string;
  phone: string;
  email?: string;
  birthMonth?: number;
  referrerPhone?: string;
  whatsappOptIn: boolean;
  consent: boolean;
  sede: SedeKey;
  date: string;
  time: string;
}

export type Redeem = { type: 'reward'; rewardId: string } | { type: 'coupon'; code: string } | null;

export interface SaleInput {
  memberId: string;
  sede: SedeKey;
  channel: ChannelKey;
  date: string;
  time: string;
  lines: SaleLine[];
  redeem: Redeem;
}

export type SaleError = 'noLines' | 'insufficient' | 'couponInvalid' | 'frozen';

export type RedeemError = 'insufficient' | 'outOfStock' | 'frozen';

/** Un miembro con una alerta antifraude en "puntos congelados" no puede canjear. */
export function isFrozen(s: LoyaltyState, memberId: string) {
  return s.alerts.some((a) => a.memberId === memberId && a.status === 'frozen');
}

/* --------------------------------- Contexto --------------------------------- */

interface Ctx {
  state: LoyaltyState;
  hydrated: boolean;
  activeMember: Member;
  setActiveMember: (id: string) => void;
  enroll: (input: EnrollInput) => { ok: true; member: Member } | { ok: false; errors: EnrollError[] };
  registerSale: (input: SaleInput) => { ok: true; sale: Sale; alerts: FraudAlert[] } | { ok: false; error: SaleError };
  reverseSale: (saleId: string, date: string, time: string) => void;
  redeemReward: (memberId: string, rewardId: string, date: string, time: string) => { ok: true; coupon: Coupon; balance: number } | { ok: false; error: RedeemError };
  claimMission: (memberId: string, missionId: string, date: string, time: string) => number;
  claimBirthday: (memberId: string, date: string, time: string) => Coupon | null;
  setRules: (patch: Partial<Rules>) => void;
  resetRules: () => void;
  setThresholds: (th: Rules['thresholds']) => boolean;
  toggleMission: (id: string) => void;
  setMissionReward: (id: string, reward: number) => void;
  addMission: (m: Omit<Mission, 'id' | 'active'>) => void;
  addCampaign: (c: Omit<Campaign, 'id'>) => void;
  setCampaignStatus: (id: string, status: CampaignStatus) => void;
  setAlertStatus: (id: string, status: AlertStatus) => void;
  finishExperiment: (id: ExperimentId) => void;
  addAlly: (a: Omit<Ally, 'id' | 'monthPoints'>) => void;
  removeAlly: (id: string) => void;
  addDraw: (d: Omit<Draw, 'id' | 'status' | 'participants'>) => void;
  runDraw: (id: string, winner: string) => void;
  reset: () => void;
}

const LoyaltyCtx = createContext<Ctx | null>(null);

export function useLoyalty() {
  const ctx = useContext(LoyaltyCtx);
  if (!ctx) throw new Error('useLoyalty debe usarse dentro de <LoyaltyProvider>');
  return ctx;
}

function load(): LoyaltyState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LoyaltyState>;
    if (!parsed || parsed.v !== VERSION || !Array.isArray(parsed.ledger) || !Array.isArray(parsed.members)) return null;
    const base = initialState();
    return { ...base, ...parsed, rules: { ...base.rules, ...(parsed.rules ?? {}) } } as LoyaltyState;
  } catch {
    return null;
  }
}

export function LoyaltyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LoyaltyState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const ref = useRef(state);
  ref.current = state;

  useEffect(() => {
    const stored = load();
    if (stored) {
      ref.current = stored;
      setState(stored);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* almacenamiento no disponible: la demo sigue funcionando en memoria */
    }
  }, [state, hydrated]);

  /** Aplica un cambio con el estado más reciente y devuelve un resultado. */
  const commit = useCallback(<R,>(fn: (s: LoyaltyState) => { next: LoyaltyState; result: R }): R => {
    const { next, result } = fn(ref.current);
    ref.current = next;
    setState(next);
    return result;
  }, []);

  const update = useCallback((fn: (s: LoyaltyState) => LoyaltyState) => commit((s) => ({ next: fn(s), result: undefined })), [commit]);

  const api = useMemo<Omit<Ctx, 'state' | 'hydrated' | 'activeMember'>>(() => {
    const txId = (s: LoyaltyState, n: number) => `s${s.seq + n}`;

    return {
      setActiveMember: (id) => update((s) => ({ ...s, activeMemberId: id })),

      enroll: (input) =>
        commit<ReturnType<Ctx['enroll']>>((s) => {
          const errors: EnrollError[] = [];
          const cedula = input.cedula.replace(/\D/g, '');
          const phone = input.phone.replace(/\D/g, '');
          const refPhone = (input.referrerPhone ?? '').replace(/\D/g, '');
          if (input.name.trim().length < 3) errors.push('name');
          if (!/^\d{6,10}$/.test(cedula)) errors.push('cedula');
          if (!/^3\d{9}$/.test(phone)) errors.push('phone');
          if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) errors.push('email');
          if (!input.consent) errors.push('consent');
          if (s.members.some((m) => m.cedula === cedula)) errors.push('duplicateCedula');
          if (s.members.some((m) => m.phone === phone)) errors.push('duplicatePhone');
          const referrer = refPhone ? s.members.find((m) => m.phone === refPhone) : undefined;
          if (refPhone && !referrer) errors.push('referrerNotFound');
          if (errors.length) return { next: s, result: { ok: false as const, errors } };

          const id = `m-new-${s.seq + 1}`;
          const member: Member = {
            id,
            name: input.name.trim(),
            cedula,
            phone,
            email: input.email?.trim() || undefined,
            birthMonth: input.birthMonth || undefined,
            since: input.date,
            sede: input.sede,
            whatsappOptIn: input.whatsappOptIn,
            historyMonths: [],
            referralsBase: 0,
            expiringBase: 0,
            referredBy: referrer?.id,
            session: true,
          };
          const [first, last] = member.name.split(/\s+/);
          const short = last ? `${first} ${last[0]}.` : first;
          const txs: LedgerTx[] = [];
          let n = 1;
          if (s.rules.welcomeBonus > 0) {
            txs.push({ id: txId(s, ++n), memberId: id, date: input.date, time: input.time, kind: 'welcome', points: s.rules.welcomeBonus, session: true });
          }
          if (referrer) {
            const [rf, rl] = referrer.name.split(/\s+/);
            txs.push({ id: txId(s, ++n), memberId: id, date: input.date, time: input.time, kind: 'referral', points: s.rules.refereeReward, label: rl ? `${rf} ${rl[0]}.` : rf, session: true });
            txs.push({ id: txId(s, ++n), memberId: referrer.id, date: input.date, time: input.time, kind: 'referral', points: s.rules.referrerReward, label: short, session: true });
          }
          return {
            next: { ...s, seq: s.seq + n + 1, members: [...s.members, member], ledger: [...s.ledger, ...txs], activeMemberId: id },
            result: { ok: true as const, member },
          };
        }),

      registerSale: (input) =>
        commit<ReturnType<Ctx['registerSale']>>((s) => {
          const lines = input.lines.filter((l) => l.amount > 0);
          if (!lines.length) return { next: s, result: { ok: false as const, error: 'noLines' as SaleError } };
          const balance = balanceOf(s.ledger, input.memberId);
          let discount = 0;
          let redeemedPoints = 0;
          let redeemRewardId: string | undefined;
          let couponUsed: string | undefined;
          if (input.redeem && isFrozen(s, input.memberId)) return { next: s, result: { ok: false as const, error: 'frozen' as SaleError } };
          if (input.redeem?.type === 'reward') {
            const r = rewardById(input.redeem.rewardId);
            if (!r || balance < r.pts) return { next: s, result: { ok: false as const, error: 'insufficient' as SaleError } };
            discount = r.value;
            redeemedPoints = r.pts;
            redeemRewardId = r.id;
          } else if (input.redeem?.type === 'coupon') {
            const code = input.redeem.code;
            const c = s.coupons.find((x) => x.code === code && x.memberId === input.memberId && x.status === 'valid');
            if (!c) return { next: s, result: { ok: false as const, error: 'couponInvalid' as SaleError } };
            discount = c.value;
            couponUsed = c.code;
          }
          const quote = quoteSale(lines, discount, input.channel, input.date, s.rules);
          const tierBefore = tierFor(yearPoints(s.ledger, input.memberId), s.rules.thresholds);
          const saleId = `V-${String(s.saleSeq + 1).padStart(4, '0')}`;
          const txs: LedgerTx[] = [];
          let n = 0;
          if (redeemedPoints > 0) {
            txs.push({ id: txId(s, ++n), memberId: input.memberId, date: input.date, time: input.time, kind: 'redeem', points: -redeemedPoints, rewardId: redeemRewardId, saleId, sede: input.sede, session: true });
          }
          const main = lines.reduce((a, b) => (b.amount > a.amount ? b : a), lines[0]);
          txs.push({
            id: txId(s, ++n),
            memberId: input.memberId,
            date: input.date,
            time: input.time,
            kind: 'earn',
            points: quote.points,
            saleId,
            amount: quote.paid,
            category: main.category,
            channel: input.channel,
            sede: input.sede,
            session: true,
          });
          const ledger = [...s.ledger, ...txs];
          const tierAfter = tierFor(yearPoints(ledger, input.memberId), s.rules.thresholds);
          const member = s.members.find((m) => m.id === input.memberId);
          const sale: Sale = {
            id: saleId,
            memberId: input.memberId,
            date: input.date,
            time: input.time,
            sede: input.sede,
            channel: input.channel,
            lines,
            gross: quote.gross,
            discount: quote.discount,
            paid: quote.paid,
            points: quote.points,
            dayApplied: quote.lines.some((l) => l.dayApplied),
            redeemedPoints,
            redeemRewardId,
            couponUsed,
            tierBefore,
            tierAfter,
            balanceAfter: balanceOf(ledger, input.memberId),
            whatsapp: !!member?.whatsappOptIn,
          };
          const coupons = couponUsed
            ? s.coupons.map((c) => (c.code === couponUsed ? { ...c, status: 'used' as const, usedSaleId: saleId } : c))
            : s.coupons;

          // Reglas antifraude que la demo evalúa de verdad.
          const newAlerts: FraudAlert[] = [];
          let alerts = s.alerts;
          const sameDay = [...s.sales.filter((x) => x.memberId === input.memberId && x.date === input.date && !x.reversed), sale];
          const isOpenSameDay = (a: FraudAlert) => a.kind === 'sameDay' && a.memberId === input.memberId && a.status === 'open';
          if (alerts.some(isOpenSameDay)) {
            // Suma la venta a la alerta abierta del mismo miembro.
            alerts = alerts.map((a) => (isOpenSameDay(a) ? { ...a, saleIds: [...(a.saleIds ?? []), saleId] } : a));
          } else if (sameDay.length >= FRAUD_RULES.sameDayPurchases) {
            newAlerts.push({ id: `fs${s.seq + n + 1}`, kind: 'sameDay', severity: 'medium', status: 'open', memberId: input.memberId, saleIds: sameDay.map((x) => x.id), session: true });
          }
          if (quote.gross >= FRAUD_RULES.highAmount) {
            newAlerts.push({ id: `fh${s.seq + n + 2}`, kind: 'highAmount', severity: 'low', status: 'open', memberId: input.memberId, saleIds: [saleId], session: true });
          }

          return {
            next: {
              ...s,
              seq: s.seq + n + 3,
              saleSeq: s.saleSeq + 1,
              ledger,
              sales: [sale, ...s.sales],
              coupons,
              alerts: [...newAlerts, ...alerts],
              activeMemberId: input.memberId,
            },
            result: { ok: true as const, sale, alerts: newAlerts },
          };
        }),

      reverseSale: (saleId, date, time) =>
        update((s) => {
          const sale = s.sales.find((x) => x.id === saleId);
          if (!sale || sale.reversed) return s;
          const txs: LedgerTx[] = [];
          let n = 0;
          txs.push({ id: txId(s, ++n), memberId: sale.memberId, date, time, kind: 'reversal', points: sale.points ? -sale.points : 0, saleId, session: true });
          if (sale.redeemedPoints) txs.push({ id: txId(s, ++n), memberId: sale.memberId, date, time, kind: 'reversal', points: sale.redeemedPoints, saleId: `${saleId}-canje`, session: true });
          return {
            ...s,
            seq: s.seq + n + 1,
            ledger: [...s.ledger, ...txs],
            sales: s.sales.map((x) => (x.id === saleId ? { ...x, reversed: true } : x)),
            coupons: s.coupons.map((c) => (c.usedSaleId === saleId ? { ...c, status: 'valid' as const, usedSaleId: undefined } : c)),
          };
        }),

      redeemReward: (memberId, rewardId, date, time) =>
        commit<ReturnType<Ctx['redeemReward']>>((s) => {
          const r = rewardById(rewardId);
          const balance = balanceOf(s.ledger, memberId);
          if (isFrozen(s, memberId)) return { next: s, result: { ok: false as const, error: 'frozen' as RedeemError } };
          if (!r || balance < r.pts) return { next: s, result: { ok: false as const, error: 'insufficient' as RedeemError } };
          if (typeof s.stock[rewardId] === 'number' && s.stock[rewardId] <= 0) return { next: s, result: { ok: false as const, error: 'outOfStock' as RedeemError } };
          const code = couponCode(s.couponSeq + 1);
          const coupon: Coupon = { code, memberId, kind: 'reward', rewardId, value: r.cat === 'vouchers' ? r.value : 0, date, time, status: r.cat === 'donations' ? 'used' : 'valid' };
          const tx: LedgerTx = { id: txId(s, 1), memberId, date, time, kind: 'redeem', points: -r.pts, rewardId, session: true };
          const stock = typeof s.stock[rewardId] === 'number' ? { ...s.stock, [rewardId]: s.stock[rewardId] - 1 } : s.stock;
          const ledger = [...s.ledger, tx];
          return {
            next: { ...s, seq: s.seq + 2, couponSeq: s.couponSeq + 1, ledger, coupons: [coupon, ...s.coupons], stock },
            result: { ok: true as const, coupon, balance: balanceOf(ledger, memberId) },
          };
        }),

      claimMission: (memberId, missionId, date, time) =>
        commit((s) => {
          const mission = s.missions.find((m) => m.id === missionId);
          const member = s.members.find((m) => m.id === memberId);
          const key = claimKey(memberId, missionId);
          if (!mission || !member || s.claims.includes(key)) return { next: s, result: 0 };
          if (!missionProgress(mission, member, s.members, s.ledger).done) return { next: s, result: 0 };
          const tx: LedgerTx = { id: txId(s, 1), memberId, date, time, kind: 'mission', points: mission.reward, missionId, label: mission.name, session: true };
          return { next: { ...s, seq: s.seq + 2, ledger: [...s.ledger, tx], claims: [...s.claims, key] }, result: mission.reward };
        }),

      claimBirthday: (memberId, date, time) =>
        commit<Coupon | null>((s) => {
          if (s.birthdayClaimed.includes(memberId)) return { next: s, result: null };
          const coupon: Coupon = { code: couponCode(s.couponSeq + 1), memberId, kind: 'birthday', value: BIRTHDAY_GIFT, date, time, status: 'valid' };
          return {
            next: { ...s, couponSeq: s.couponSeq + 1, coupons: [coupon, ...s.coupons], birthdayClaimed: [...s.birthdayClaimed, memberId] },
            result: coupon,
          };
        }),

      setRules: (patch) => update((s) => ({ ...s, rules: { ...s.rules, ...patch } })),
      resetRules: () =>
        update((s) => ({ ...s, rules: { ...structuredCloneSafe(DEFAULT_RULES), thresholds: s.rules.thresholds, showLeaderboard: s.rules.showLeaderboard } })),
      setThresholds: (th) =>
        commit((s) => {
          if (!thresholdsValid(th)) return { next: s, result: false };
          return { next: { ...s, rules: { ...s.rules, thresholds: { ...th } } }, result: true };
        }),

      toggleMission: (id) => update((s) => ({ ...s, missions: s.missions.map((m) => (m.id === id ? { ...m, active: !m.active } : m)) })),
      setMissionReward: (id, reward) =>
        update((s) => ({ ...s, missions: s.missions.map((m) => (m.id === id ? { ...m, reward: Math.max(0, Math.round(reward)) } : m)) })),
      addMission: (m) => update((s) => ({ ...s, seq: s.seq + 1, missions: [...s.missions, { ...m, id: `mi${s.seq + 1}`, active: true }] })),

      addCampaign: (c) => update((s) => ({ ...s, seq: s.seq + 1, campaigns: [{ ...c, id: `c${s.seq + 100}` }, ...s.campaigns] })),
      setCampaignStatus: (id, status) => update((s) => ({ ...s, campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, status } : c)) })),

      setAlertStatus: (id, status) => update((s) => ({ ...s, alerts: s.alerts.map((a) => (a.id === id ? { ...a, status } : a)) })),

      finishExperiment: (id) =>
        update((s) => {
          const exp = s.experiments.find((e) => e.id === id);
          if (!exp || exp.status === 'finished') return s;
          const rules = id === 'welcome300' ? { ...s.rules, welcomeBonus: 300 } : s.rules;
          return { ...s, rules, experiments: s.experiments.map((e) => (e.id === id ? { ...e, status: 'finished' as const } : e)) };
        }),

      addAlly: (a) => update((s) => ({ ...s, seq: s.seq + 1, allies: [...s.allies, { ...a, id: `a${s.seq + 100}`, monthPoints: 0 }] })),
      removeAlly: (id) => update((s) => ({ ...s, allies: s.allies.filter((a) => a.id !== id) })),

      addDraw: (d) => update((s) => ({ ...s, seq: s.seq + 1, draws: [{ ...d, id: `d${s.seq + 100}`, status: 'scheduled', participants: 0 }, ...s.draws] })),
      runDraw: (id, winner) => update((s) => ({ ...s, draws: s.draws.map((d) => (d.id === id ? { ...d, status: 'done' as const, winner } : d)) })),

      reset: () => {
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* sin almacenamiento */
        }
        const fresh = initialState();
        ref.current = fresh;
        setState(fresh);
      },
    };
  }, [commit, update]);

  const activeMember = state.members.find((m) => m.id === state.activeMemberId) ?? state.members[0];

  const value = useMemo<Ctx>(() => ({ ...api, state, hydrated, activeMember }), [api, state, hydrated, activeMember]);

  return <LoyaltyCtx.Provider value={value}>{children}</LoyaltyCtx.Provider>;
}

/** Hora actual hh:mm (solo se llama en respuesta a una acción del usuario). */
export function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
