/**
 * Lógica pura de la demo de fidelización (sin React): cálculo de puntos,
 * niveles, saldo desde el libro de puntos, misiones, horarios permitidos
 * para mensajes comerciales y exportación CSV. Todo determinista, para que
 * el servidor y el navegador muestren lo mismo.
 */
import {
  ANALYTICS,
  CHANNEL_OPT_IN,
  DEMO_MONTH,
  DEMO_YEAR,
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

/** Día de la semana (0 = domingo) de una fecha ISO, sin depender de la zona horaria. */
export function weekdayOf(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function monthOf(iso: string) {
  return Number(iso.slice(5, 7));
}

export function yearOf(iso: string) {
  return Number(iso.slice(0, 4));
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

/** Puntos de compras del año (los que cuentan para el nivel). */
export function yearPoints(ledger: LedgerTx[], memberId: string, year = DEMO_YEAR) {
  const txs = memberLedger(ledger, memberId);
  const rev = reversedIds(txs);
  return txs
    .filter((tx) => (tx.kind === 'earn' || tx.kind === 'summary') && yearOf(tx.date) === year)
    .filter((tx) => !(tx.saleId && rev.has(tx.saleId)))
    .reduce((s, tx) => s + tx.points, 0);
}

/** Compras vigentes (no reversadas) del miembro en un mes. */
export function purchasesInMonth(ledger: LedgerTx[], memberId: string, month = DEMO_MONTH, channels?: ChannelKey[]) {
  const txs = memberLedger(ledger, memberId);
  const rev = reversedIds(txs);
  return txs.filter(
    (tx) =>
      tx.kind === 'earn' &&
      yearOf(tx.date) === DEMO_YEAR &&
      monthOf(tx.date) === month &&
      !(tx.saleId && rev.has(tx.saleId)) &&
      (!channels || (tx.channel && channels.includes(tx.channel))),
  );
}

/** Puntos de compras del mes (para el ranking). */
export function monthPoints(ledger: LedgerTx[], memberId: string, month = DEMO_MONTH) {
  return purchasesInMonth(ledger, memberId, month).reduce((s, tx) => s + tx.points, 0);
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

/** Puntos que vencen el 31 de octubre: los de 2025 que quedan después de los canjes (primero se usan los más viejos). */
export function expiringPoints(member: Member, ledger: LedgerTx[]) {
  const sessionRedeemed = memberLedger(ledger, member.id)
    .filter((tx) => tx.session && tx.kind === 'redeem')
    .reduce((s, tx) => s - tx.points, 0);
  return Math.max(0, member.expiringBase - sessionRedeemed);
}

/** Meses del año con compra (historial + compras registradas en la demo). */
export function purchaseMonths(member: Member, ledger: LedgerTx[]) {
  const set = new Set(member.historyMonths);
  if (purchasesInMonth(ledger, member.id).length > 0) set.add(DEMO_MONTH);
  return set;
}

/** Racha: meses seguidos con compra que terminan en el mes actual (o en el anterior si aún no compra este mes). */
export function streakOf(months: Set<number>, current = DEMO_MONTH) {
  let m = months.has(current) ? current : current - 1;
  let n = 0;
  while (m >= 1 && months.has(m)) {
    n++;
    m--;
  }
  return n;
}

/* --------------------------------- Misiones --------------------------------- */

export function missionProgress(mission: Mission, member: Member, members: Member[], ledger: LedgerTx[]) {
  let current = 0;
  if (mission.type === 'purchasesMonth') current = purchasesInMonth(ledger, member.id).length;
  if (mission.type === 'appPurchases') current = purchasesInMonth(ledger, member.id, DEMO_MONTH, ['app', 'delivery']).length;
  if (mission.type === 'referrals') current = referralsOf(member, members, true);
  if (mission.type === 'profile') current = member.email && member.birthMonth ? 1 : 0;
  return { current: Math.min(current, mission.target), done: current >= mission.target };
}

export const claimKey = (memberId: string, missionId: string) => `${memberId}|${missionId}|${DEMO_YEAR}-${DEMO_MONTH}`;

/* ------------------------- Horario de mensajes (Ley 2300) ------------------------- */

/**
 * Ley 2300 de 2023: mensajes comerciales de lunes a viernes de 7:00 a. m. a
 * 7:00 p. m. y sábados de 8:00 a. m. a 3:00 p. m.; nunca domingos ni festivos
 * (la demo no revisa el calendario de festivos).
 */
export function ley2300Check(day: number, time: string): 'ok' | 'sunday' | 'weekday' | 'saturday' {
  const [h, m] = time.split(':').map(Number);
  const minutes = (h || 0) * 60 + (m || 0);
  if (day === 0) return 'sunday';
  if (day === 6) return minutes >= 8 * 60 && minutes <= 15 * 60 ? 'ok' : 'saturday';
  return minutes >= 7 * 60 && minutes <= 19 * 60 ? 'ok' : 'weekday';
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

/** Código de cupón legible y determinista: CV-2026-0007. */
export const couponCode = (seq: number) => `CV-${DEMO_YEAR}-${String(seq).padStart(4, '0')}`;

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
