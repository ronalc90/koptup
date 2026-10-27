/**
 * Lógica pura de la demo de fidelización (sin React): cálculo de puntos,
 * niveles, saldo desde el libro de puntos, misiones, horarios permitidos
 * para mensajes comerciales y exportación CSV. Todo determinista, para que
 * el servidor y el navegador muestren lo mismo.
 */
import {
  ANALYTICS,
  CHANNEL_OPT_IN,
  INACTIVITY_HISTOGRAM,
  POINTS_HISTOGRAM,
  POINTS_HISTOGRAM_STEP,
  TIERS,
  type CampaignChannel,
  type CategoryKey,
  type ChannelKey,
  type LedgerTx,
  type Member,
  type Mission,
  type Rules,
  type Segment,
  type TierKey,
} from './data';
import { addDays, holidayOf, monthDay, monthKeyAgo, monthKeyOf, partsOf, weekdayOf, type HolidayKey } from './dates';

export { weekdayOf };

/* -------------------------------- Formato -------------------------------- */

const group = (n: number, sep: string) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep);

/** Número entero con separador de miles fijo (es: 1.234 · en: 1,234). */
export function num(n: number, locale: string) {
  const v = Math.round(n);
  return (v < 0 ? '−' : '') + group(Math.abs(v), locale === 'en' ? ',' : '.');
}

/** Monto en pesos colombianos sin decimales. */
export function money(n: number, locale: string) {
  const v = Math.round(n);
  return (v < 0 ? '−' : '') + '$' + group(Math.abs(v), locale === 'en' ? ',' : '.');
}

/** Monto abreviado en millones: $96 M / $1.600 M. */
export function moneyM(n: number, locale: string) {
  const m = n / 1_000_000;
  const rounded = m >= 100 ? Math.round(m) : Math.round(m * 10) / 10;
  const [int, dec] = String(rounded).split('.');
  const intTxt = group(Number(int), locale === 'en' ? ',' : '.');
  return `$${intTxt}${dec ? (locale === 'en' ? '.' : ',') + dec : ''} M`;
}

/** Decimal corto (1,5 / 1.5). */
export function dec(n: number, locale: string) {
  const s = String(Math.round(n * 100) / 100);
  return locale === 'en' ? s : s.replace('.', ',');
}

/** Puntos con signo (+370 / −600). */
export function signed(n: number, locale: string) {
  return (n > 0 ? '+' : '') + num(n, locale);
}

/** 3005550142 → 300 555 0142 */
export function phoneLabel(p: string) {
  const d = p.replace(/\D/g, '');
  return d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : d;
}

/** 1020456781 → 1.020.456.781 */
export function cedulaLabel(c: string) {
  return group(Number(c.replace(/\D/g, '') || 0), '.');
}


/* --------------------------------- Puntos --------------------------------- */

export interface SaleLine {
  category: CategoryKey;
  amount: number;
}

export interface LineQuote extends SaleLine {
  net: number;
  base: number;
  mult: number;
  dayApplied: boolean;
  points: number;
}

export interface SaleQuote {
  lines: LineQuote[];
  gross: number;
  discount: number;
  paid: number;
  points: number;
}

/** Multiplicador que aplica a una línea según categoría, día y canal. */
export function multiplierFor(category: CategoryKey, channel: ChannelKey, weekday: number, rules: Rules) {
  const cat = rules.categoryMult[category] ?? 1;
  const dayApplied = rules.dayRule.enabled && rules.dayRule.category === category && rules.dayRule.weekday === weekday && cat > 0;
  const day = dayApplied ? rules.dayRule.mult : 1;
  const chan = rules.channelMult[channel] ?? 1;
  return { mult: cat * day * chan, dayApplied };
}

/**
 * Cotiza una venta: reparte el descuento (canje en caja) en proporción a cada
 * línea y calcula los puntos sobre lo pagado. Los puntos se redondean hacia abajo.
 */
export function quoteSale(lines: SaleLine[], discount: number, channel: ChannelKey, dateIso: string, rules: Rules): SaleQuote {
  const valid = lines.filter((l) => l.amount > 0);
  const gross = valid.reduce((s, l) => s + l.amount, 0);
  const disc = Math.max(0, Math.min(discount, gross));
  const weekday = weekdayOf(dateIso);
  const quoted = valid.map((l) => {
    const net = gross > 0 ? l.amount - (disc * l.amount) / gross : 0;
    const base = Math.floor(net / rules.baseAmount);
    const { mult, dayApplied } = multiplierFor(l.category, channel, weekday, rules);
    return { ...l, net, base, mult, dayApplied, points: Math.floor(base * mult) };
  });
  return {
    lines: quoted,
    gross,
    discount: disc,
    paid: gross - disc,
    points: quoted.reduce((s, l) => s + l.points, 0),
  };
}

/** % de la compra que se devuelve en puntos con la regla base. */
export function returnPct(rules: Rules) {
  return (rules.pointValue / rules.baseAmount) * 100;
}

/** Costo mensual estimado del programa con la regla base. */
export function programCost(monthlySales: number, rules: Rules, expiredPct: number) {
  const issued = monthlySales / rules.baseAmount;
  const gross = issued * rules.pointValue;
  return { issued, gross, net: gross * (1 - expiredPct / 100) };
}

/* --------------------------------- Niveles --------------------------------- */

export function tierFor(yearPts: number, thresholds: Rules['thresholds']): TierKey {
  let tier: TierKey = 'classic';
  for (const k of TIERS) if (yearPts >= thresholds[k]) tier = k;
  return tier;
}

export function nextTierOf(tier: TierKey): TierKey | null {
  const i = TIERS.indexOf(tier);
  return i < TIERS.length - 1 ? TIERS[i + 1] : null;
}

export function tierIndex(tier: TierKey) {
  return TIERS.indexOf(tier);
}

/** Los umbrales deben subir estrictamente: Clásico 0 < Plata < Oro < Diamante. */
export function thresholdsValid(th: Rules['thresholds']) {
  return th.classic === 0 && th.silver > 0 && th.silver < th.gold && th.gold < th.diamond;
}

/** Miembros de la base de ejemplo con al menos `t` puntos en el año (interpolando dentro de cada tramo). */
export function countAtLeast(t: number) {
  const step = POINTS_HISTOGRAM_STEP;
  let total = 0;
  POINTS_HISTOGRAM.forEach((count, i) => {
    const lo = i * step;
    const hi = i === POINTS_HISTOGRAM.length - 1 ? lo + step * 11 : lo + step;
    if (t <= lo) total += count;
    else if (t < hi) total += (count * (hi - t)) / (hi - lo);
  });
  return total;
}

/** Miembros por nivel con unos umbrales dados (base de ejemplo + puntos del año de los inscritos en la demo). */
export function tierCounts(thresholds: Rules['thresholds'], extraYearPoints: number[] = []) {
  const atLeast = (k: TierKey) => (k === 'classic' ? countAtLeast(0) : countAtLeast(thresholds[k]));
  const raw: Record<TierKey, number> = {
    classic: atLeast('classic') - atLeast('silver'),
    silver: atLeast('silver') - atLeast('gold'),
    gold: atLeast('gold') - atLeast('diamond'),
    diamond: atLeast('diamond'),
  };
  const out = {} as Record<TierKey, number>;
  TIERS.forEach((k) => (out[k] = Math.round(raw[k])));
  extraYearPoints.forEach((p) => (out[tierFor(p, thresholds)] += 1));
  return out;
}

/** Miembros a menos de `margin` puntos del siguiente nivel. */
export function nearNextTier(thresholds: Rules['thresholds'], margin = 500) {
  let total = 0;
  (['silver', 'gold', 'diamond'] as TierKey[]).forEach((k) => {
    const t = thresholds[k];
    total += countAtLeast(Math.max(0, t - margin)) - countAtLeast(t);
  });
  return Math.round(total);
}

/** Miembros con nivel que bajarían con la regla de meses sin compras. */
export function wouldDowngrade(months: number) {
  return INACTIVITY_HISTOGRAM.slice(Math.max(0, months)).reduce((s, n) => s + n, 0);
}

/* ------------------------------ Libro de puntos ------------------------------ */

export function memberLedger(ledger: LedgerTx[], memberId: string) {
  return ledger.filter((tx) => tx.memberId === memberId);
}

/** El saldo siempre se calcula sumando el libro de puntos. */
export function balanceOf(ledger: LedgerTx[], memberId: string) {
  return memberLedger(ledger, memberId).reduce((s, tx) => s + tx.points, 0);
}

/** Ids de movimientos de compra que fueron reversados. */
function reversedIds(txs: LedgerTx[]) {
  return new Set(txs.filter((tx) => tx.kind === 'reversal' && tx.saleId).map((tx) => tx.saleId as string));
}

/** Primer día que cuenta para el nivel: los últimos 12 meses terminando hoy (del 15 oct 2025 al 14 oct 2026). */
export function tierWindowStart(today: string) {
  return addDays(monthDay(today, 12, partsOf(today).d), 1);
}

/** Puntos de compras de los últimos 12 meses (los que cuentan para el nivel). */
export function tierPoints(ledger: LedgerTx[], memberId: string, today: string) {
  const from = tierWindowStart(today);
  const txs = memberLedger(ledger, memberId);
  const rev = reversedIds(txs);
  return txs
    .filter((tx) => (tx.kind === 'earn' || tx.kind === 'summary') && tx.date >= from && tx.date <= today)
    .filter((tx) => !(tx.saleId && rev.has(tx.saleId)))
    .reduce((s, tx) => s + tx.points, 0);
}

/** Compras vigentes (no reversadas) del miembro en un mes (AAAA-MM). */
export function purchasesInMonth(ledger: LedgerTx[], memberId: string, monthKey: string, channels?: ChannelKey[]) {
  const txs = memberLedger(ledger, memberId);
  const rev = reversedIds(txs);
  return txs.filter(
    (tx) =>
      tx.kind === 'earn' &&
      monthKeyOf(tx.date) === monthKey &&
      !(tx.saleId && rev.has(tx.saleId)) &&
      (!channels || (tx.channel && channels.includes(tx.channel))),
  );
}

/** Puntos de compras del mes (para el ranking). */
export function monthPoints(ledger: LedgerTx[], memberId: string, monthKey: string) {
  return purchasesInMonth(ledger, memberId, monthKey).reduce((s, tx) => s + tx.points, 0);
}

/** Amigos referidos: los de antes de la demo más los inscritos en la demo con su celular. */
export function referralsOf(member: Member, members: Member[], sessionOnly = false) {
  const session = members.filter((m) => m.session && m.referredBy === member.id).length;
  return sessionOnly ? session : member.referralsBase + session;
}

/** Puntos ganados por referidos según el libro. */
export function referralPoints(ledger: LedgerTx[], memberId: string) {
  return memberLedger(ledger, memberId)
    .filter((tx) => tx.kind === 'referral')
    .reduce((s, tx) => s + tx.points, 0);
}

/** Puntos que vencen al final de este mes: los ganados hace un año que quedan después de los canjes de la demo (primero se usan los más viejos). */
export function expiringPoints(member: Member, ledger: LedgerTx[]) {
  const sessionRedeemed = memberLedger(ledger, member.id)
    .filter((tx) => tx.session && tx.kind === 'redeem')
    .reduce((s, tx) => s - tx.points, 0);
  return Math.max(0, member.expiringBase - sessionRedeemed);
}

/** Meses (AAAA-MM) con compra: historial de ejemplo + compras del libro que no fueron reversadas. */
export function purchaseMonths(member: Member, ledger: LedgerTx[]) {
  const set = new Set(member.historyMonths);
  const txs = memberLedger(ledger, member.id);
  const rev = reversedIds(txs);
  txs.forEach((tx) => {
    if (tx.kind === 'earn' && !(tx.saleId && rev.has(tx.saleId))) set.add(monthKeyOf(tx.date));
  });
  return set;
}

/** Racha: meses seguidos con compra que terminan en el mes de hoy (o en el anterior si aún no compra este mes). */
export function streakOf(months: Set<string>, today: string) {
  let back = months.has(monthKeyOf(today)) ? 0 : 1;
  let n = 0;
  while (n < 120 && months.has(monthKeyAgo(today, back))) {
    n++;
    back++;
  }
  return n;
}

/* --------------------------------- Misiones --------------------------------- */

export function missionProgress(mission: Mission, member: Member, members: Member[], ledger: LedgerTx[], today: string) {
  const month = monthKeyOf(today);
  let current = 0;
  if (mission.type === 'purchasesMonth') current = purchasesInMonth(ledger, member.id, month).length;
  if (mission.type === 'appPurchases') current = purchasesInMonth(ledger, member.id, month, ['app', 'delivery']).length;
  if (mission.type === 'referrals') current = referralsOf(member, members, true);
  if (mission.type === 'profile') current = member.email && member.birthMonth ? 1 : 0;
  return { current: Math.min(current, mission.target), done: current >= mission.target };
}

export const claimKey = (memberId: string, missionId: string, today: string) => `${memberId}|${missionId}|${monthKeyOf(today)}`;

/* ------------------------- Horario de mensajes (Ley 2300) ------------------------- */

export type Ley2300Result = { ok: true } | { ok: false; reason: 'sunday' | 'weekday' | 'saturday' | 'time' } | { ok: false; reason: 'holiday'; holiday: HolidayKey };

/**
 * Ley 2300 de 2023: mensajes comerciales de lunes a viernes de 7:00 a. m. a
 * 7:00 p. m. y sábados de 8:00 a. m. a 3:00 p. m.; nunca domingos ni festivos
 * (los festivos de Colombia se calculan para cada año).
 */
export function ley2300Check(date: string, time: string): Ley2300Result {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return { ok: false, reason: 'time' };
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  const day = weekdayOf(date);
  if (day === 0) return { ok: false, reason: 'sunday' };
  const holiday = holidayOf(date);
  if (holiday) return { ok: false, reason: 'holiday', holiday };
  if (day === 6) return minutes >= 8 * 60 && minutes <= 15 * 60 ? { ok: true } : { ok: false, reason: 'saturday' };
  return minutes >= 7 * 60 && minutes <= 19 * 60 ? { ok: true } : { ok: false, reason: 'weekday' };
}

/** Primer día desde mañana en que se puede enviar a las 10:00 a. m. (no domingo ni festivo). */
export function firstSendDate(dates: string[]) {
  return dates.find((d) => ley2300Check(d, '10:00').ok) ?? dates[0];
}

/* --------------------------------- Segmentos --------------------------------- */

export function segmentSize(segment: Segment, thresholds: Rules['thresholds'], extraYearPoints: number[]) {
  const counts = tierCounts(thresholds, extraYearPoints);
  const total = TIERS.reduce((s, k) => s + counts[k], 0);
  switch (segment) {
    case 'all':
      return total;
    case 'silverGold':
      return counts.silver + counts.gold;
    case 'vip':
      return Math.round((counts.gold + counts.diamond) * ANALYTICS.vipShare);
    case 'atRisk':
      return ANALYTICS.atRisk;
    case 'nearTier':
      return nearNextTier(thresholds);
    case 'dormant':
      return ANALYTICS.dormant;
    case 'birthdays':
      return Math.round(total / 12);
    default:
      return 0;
  }
}

export function audienceFor(segment: Segment, channel: CampaignChannel, thresholds: Rules['thresholds'], extraYearPoints: number[]) {
  return Math.round(segmentSize(segment, thresholds, extraYearPoints) * CHANNEL_OPT_IN[channel]);
}

/* --------------------------------- Validación --------------------------------- */

/** Celular colombiano: 10 dígitos que empiezan por 3. */
export const phoneValid = (p: string) => /^3\d{9}$/.test(p.replace(/\D/g, ''));
/** Cédula de ciudadanía: 6 a 10 dígitos. */
export const cedulaValid = (c: string) => /^\d{6,10}$/.test(c.replace(/\D/g, ''));
export const emailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

/* ----------------------------------- CSV ----------------------------------- */

export function toCsv(rows: (string | number)[][], sep: string) {
  const esc = (v: string | number) => {
    const s = String(v);
    return /["\n\r;,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(sep)).join('\r\n');
}

/** Descarga un texto como archivo (CSV con BOM para que Excel lea las tildes). */
export function downloadText(filename: string, text: string, mime = 'text/csv;charset=utf-8') {
  if (typeof window === 'undefined') return;
  const blob = new Blob(['﻿' + text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* --------------------------------- Códigos --------------------------------- */

/** Código de cupón legible y determinista: CV-2026-0007 (año de hoy y consecutivo). */
export const couponCode = (seq: number, today: string) => `CV-${today.slice(0, 4)}-${String(seq).padStart(4, '0')}`;

/** Código de miembro para el pase: CV-0142-81 (últimos dígitos del celular y la cédula). */
export function memberCode(m: Member) {
  return `CV-${m.phone.slice(-4)}-${m.cedula.slice(-2)}`;
}

/** Barras decorativas deterministas a partir de un texto (no es un código de barras real). */
export function barsFor(text: string, n = 38) {
  const out: number[] = [];
  let h = 7;
  for (let i = 0; i < n; i++) {
    h = (h * 31 + text.charCodeAt(i % text.length)) % 997;
    out.push((h % 3) + 1);
  }
  return out;
}
