/**
 * Datos de ejemplo de la demo de fidelización.
 *
 * Todo es inventado: la cadena "Droguerías Ceiba Verde", su NIT, sedes,
 * miembros, cédulas, celulares, aliados y cifras. Los valores están pensados
 * para ser coherentes entre pestañas (la suma de miembros por nivel es el
 * total de Resultados, el saldo sale del libro de puntos, etc.).
 */

export type TierKey = 'classic' | 'silver' | 'gold' | 'diamond';
export const TIERS: TierKey[] = ['classic', 'silver', 'gold', 'diamond'];

export type CategoryKey = 'personalCare' | 'otc' | 'dermo' | 'baby' | 'vitamins' | 'rx';
export const CATEGORIES: CategoryKey[] = ['personalCare', 'otc', 'dermo', 'baby', 'vitamins', 'rx'];

export type ChannelKey = 'store' | 'app' | 'delivery';
export const CHANNELS: ChannelKey[] = ['store', 'app', 'delivery'];

export type SedeKey = 'chapinero' | 'laureles' | 'granada';
export const SEDES: { id: SedeKey; name: string }[] = [
  { id: 'chapinero', name: 'Chapinero · Bogotá' },
  { id: 'laureles', name: 'Laureles · Medellín' },
  { id: 'granada', name: 'Granada · Cali' },
];

/** Marca ficticia del comercio que usa el club. */
export const CLUB = {
  brand: 'Droguerías Ceiba Verde',
  club: 'Club Ceiba Verde',
  nit: '901.555.214-1',
  domain: 'ceibaverde.example',
};

/** Calendario de la demo: la semana simulada del 5 al 11 de octubre de 2026. */
export const DEMO_YEAR = 2026;
export const DEMO_MONTH = 10;
export const DEMO_WEEK = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'];
export const DEMO_TODAY = '2026-10-06';

/* ------------------------------- Reglas ------------------------------- */

export interface Rules {
  /** Pesos que hay que comprar para ganar 1 punto (regla base). */
  baseAmount: number;
  /** Valor en pesos de 1 punto al canjear. */
  pointValue: number;
  categoryMult: Record<CategoryKey, number>;
  dayRule: { enabled: boolean; category: CategoryKey; weekday: number; mult: number };
  channelMult: Record<ChannelKey, number>;
  welcomeBonus: number;
  expiryMonths: number;
  referrerReward: number;
  refereeReward: number;
  /** Puntos de compras acumulados en el año para entrar a cada nivel. */
  thresholds: Record<TierKey, number>;
  downgradeMonths: number;
  /** Devolución en saldo (alternativa a puntos), en % por nivel. */
  cashback: Record<TierKey, number>;
  showLeaderboard: boolean;
}

export const DEFAULT_RULES: Rules = {
  baseAmount: 1000,
  pointValue: 10,
  categoryMult: { personalCare: 1, otc: 1, dermo: 1.5, baby: 1, vitamins: 1, rx: 0 },
  dayRule: { enabled: true, category: 'personalCare', weekday: 2, mult: 2 },
  channelMult: { store: 1, app: 1.5, delivery: 1 },
  welcomeBonus: 100,
  expiryMonths: 12,
  referrerReward: 500,
  refereeReward: 300,
  thresholds: { classic: 0, silver: 1500, gold: 4000, diamond: 8000 },
  downgradeMonths: 6,
  cashback: { classic: 0.5, silver: 1, gold: 1.5, diamond: 2 },
  showLeaderboard: false,
};

/* ----------------------------- Recompensas ----------------------------- */

export type RewardCat = 'vouchers' | 'products' | 'services' | 'donations';
export const REWARD_CATS: RewardCat[] = ['vouchers', 'products', 'services', 'donations'];

export interface Reward {
  id: string;
  cat: RewardCat;
  pts: number;
  /** Valor de referencia en pesos (para bonos, el descuento en caja). */
  value: number;
  stock?: number;
  color: string;
}

export const REWARDS: Reward[] = [
  { id: 'voucher10', cat: 'vouchers', pts: 1000, value: 10000, color: 'from-emerald-600 to-teal-700' },
  { id: 'voucher25', cat: 'vouchers', pts: 2500, value: 25000, color: 'from-teal-600 to-cyan-800' },
  { id: 'handCream', cat: 'products', pts: 1200, value: 12000, stock: 40, color: 'from-rose-400 to-pink-600' },
  { id: 'travelKit', cat: 'products', pts: 1500, value: 15000, stock: 25, color: 'from-sky-500 to-blue-700' },
  { id: 'bottle', cat: 'products', pts: 1800, value: 18000, stock: 3, color: 'from-lime-500 to-green-700' },
  { id: 'delivery', cat: 'services', pts: 600, value: 6000, color: 'from-orange-500 to-amber-700' },
  { id: 'pressure', cat: 'services', pts: 400, value: 4000, color: 'from-red-500 to-rose-700' },
  { id: 'dermoAdvice', cat: 'services', pts: 800, value: 8000, color: 'from-fuchsia-500 to-purple-700' },
  { id: 'foodBank', cat: 'donations', pts: 500, value: 5000, color: 'from-amber-500 to-orange-700' },
  { id: 'schoolKits', cat: 'donations', pts: 1000, value: 10000, color: 'from-indigo-500 to-violet-700' },
];

export const rewardById = (id: string) => REWARDS.find((r) => r.id === id);

/* ------------------------------- Miembros ------------------------------- */

export interface Member {
  id: string;
  name: string;
  cedula: string;
  phone: string;
  email?: string;
  birthMonth?: number;
  since: string;
  sede: SedeKey;
  whatsappOptIn: boolean;
  /** Meses de 2026 con al menos una compra antes de la demo. */
  historyMonths: number[];
  /** Amigos referidos antes de la demo. */
  referralsBase: number;
  /** Puntos de 2025 que vencen el 31 de octubre de 2026 (antes de canjes de la sesión). */
  expiringBase: number;
  referredBy?: string;
  /** Inscrito durante la demo. */
  session?: boolean;
}

export const MEMBERS: Member[] = [
  {
    id: 'm-laura',
    name: 'Laura Martínez Ríos',
    cedula: '1020456781',
    phone: '3005550142',
    email: 'laura.martinez@correo.example',
    birthMonth: 10,
    since: '2023-03-14',
    sede: 'chapinero',
    whatsappOptIn: true,
    historyMonths: [1, 2, 4, 5, 6, 7, 8, 9, 10],
    referralsBase: 2,
    expiringBase: 240,
  },
  {
    id: 'm-andres',
    name: 'Andrés Felipe Gómez',
    cedula: '79845112',
    phone: '3105550187',
    email: 'andres.gomez@correo.example',
    birthMonth: 3,
    since: '2022-08-02',
    sede: 'chapinero',
    whatsappOptIn: true,
    historyMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    referralsBase: 1,
    expiringBase: 0,
  },
  {
    id: 'm-camila',
    name: 'Camila Rojas Peña',
    cedula: '1032778904',
    phone: '3155550123',
    since: '2026-05-28',
    sede: 'chapinero',
    whatsappOptIn: false,
    historyMonths: [5, 7, 9],
    referralsBase: 0,
    expiringBase: 0,
    referredBy: 'm-laura',
  },
  {
    id: 'm-jhon',
    name: 'Jhon Fredy Ospina',
    cedula: '1017223509',
    phone: '3015550198',
    birthMonth: 12,
    since: '2024-11-20',
    sede: 'laureles',
    whatsappOptIn: true,
    historyMonths: [2, 6, 8, 9],
    referralsBase: 0,
    expiringBase: 0,
  },
  {
    id: 'm-valentina',
    name: 'Valentina Cárdenas',
    cedula: '1144087336',
    phone: '3205550176',
    email: 'vcardenas@correo.example',
    birthMonth: 6,
    since: '2021-02-11',
    sede: 'granada',
    whatsappOptIn: true,
    historyMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    referralsBase: 4,
    expiringBase: 0,
  },
  {
    id: 'm-santiago',
    name: 'Santiago Restrepo Mejía',
    cedula: '1036654210',
    phone: '3045550111',
    since: '2026-08-15',
    sede: 'laureles',
    whatsappOptIn: false,
    historyMonths: [8],
    referralsBase: 0,
    expiringBase: 0,
  },
];

/* ---------------------------- Libro de puntos ---------------------------- */

export type TxKind = 'opening' | 'earn' | 'redeem' | 'welcome' | 'referral' | 'mission' | 'reversal' | 'summary';

export interface LedgerTx {
  id: string;
  memberId: string;
  date: string;
  time?: string;
  kind: TxKind;
  /** Con signo: positivo suma, negativo resta. */
  points: number;
  saleId?: string;
  amount?: number;
  category?: CategoryKey;
  channel?: ChannelKey;
  sede?: SedeKey;
  rewardId?: string;
  missionId?: string;
  /** Texto libre (nombre de una misión creada o del referido). */
  label?: string;
  /** Movimiento hecho durante la demo. */
  session?: boolean;
}

type Purchase = [date: string, sede: SedeKey, channel: ChannelKey, category: CategoryKey, amount: number, points: number];

/** Compras de 2026 de Laura (los puntos ya aplican las reglas por defecto). */
const LAURA_PURCHASES: Purchase[] = [
  ['2026-01-13', 'chapinero', 'store', 'personalCare', 142000, 284],
  ['2026-02-20', 'chapinero', 'store', 'dermo', 236000, 354],
  ['2026-04-07', 'chapinero', 'store', 'personalCare', 98000, 196],
  ['2026-04-25', 'chapinero', 'store', 'vitamins', 164000, 164],
  ['2026-05-16', 'chapinero', 'store', 'baby', 310000, 310],
  ['2026-06-09', 'chapinero', 'store', 'personalCare', 205000, 410],
  ['2026-07-03', 'chapinero', 'store', 'otc', 87000, 87],
  ['2026-07-18', 'chapinero', 'store', 'dermo', 268000, 402],
  ['2026-08-21', 'chapinero', 'app', 'vitamins', 190000, 285],
  ['2026-09-12', 'chapinero', 'store', 'baby', 276000, 276],
  ['2026-09-26', 'chapinero', 'store', 'personalCare', 221000, 221],
  ['2026-10-02', 'chapinero', 'store', 'otc', 121000, 121],
];

function buildLedger(): LedgerTx[] {
  const out: LedgerTx[] = [];
  let n = 0;
  const id = () => `h${++n}`;
  out.push({ id: id(), memberId: 'm-laura', date: '2026-01-01', kind: 'opening', points: 1840 });
  LAURA_PURCHASES.forEach(([date, sede, channel, category, amount, points]) => {
    out.push({ id: id(), memberId: 'm-laura', date, kind: 'earn', points, amount, category, channel, sede });
  });
  out.push({ id: id(), memberId: 'm-laura', date: '2026-05-28', kind: 'referral', points: 500, label: 'Camila R.' });
  out.push({ id: id(), memberId: 'm-laura', date: '2026-07-18', kind: 'redeem', points: -1000, rewardId: 'voucher10', sede: 'chapinero' });
  out.push({ id: id(), memberId: 'm-laura', date: '2026-08-30', kind: 'referral', points: 500, label: 'Paola C.' });
  out.push({ id: id(), memberId: 'm-laura', date: '2026-09-12', kind: 'redeem', points: -600, rewardId: 'delivery', sede: 'chapinero' });

  // Resto de miembros: saldo de 2025 + resumen de compras de 2026 (+ canjes).
  const rest: [string, number, number, number][] = [
    // memberId, saldo inicial, puntos de compras 2026, puntos canjeados 2026
    ['m-andres', 2160, 5420, 2600],
    ['m-camila', 0, 640, 0],
    ['m-jhon', 880, 2150, 600],
    ['m-valentina', 3150, 9360, 6300],
    ['m-santiago', 0, 380, 0],
  ];
  rest.forEach(([memberId, opening, earned, redeemed]) => {
    if (opening) out.push({ id: id(), memberId, date: '2026-01-01', kind: 'opening', points: opening });
    if (memberId === 'm-camila' || memberId === 'm-santiago') {
      out.push({ id: id(), memberId, date: memberId === 'm-camila' ? '2026-05-28' : '2026-08-15', kind: 'welcome', points: 100 });
    }
    if (memberId === 'm-camila') out.push({ id: id(), memberId, date: '2026-05-28', kind: 'referral', points: 300, label: 'Laura M.' });
    out.push({ id: id(), memberId, date: '2026-09-30', kind: 'summary', points: earned });
    if (redeemed) out.push({ id: id(), memberId, date: '2026-09-30', kind: 'redeem', points: -redeemed });
  });
  return out;
}

export const INITIAL_LEDGER: LedgerTx[] = buildLedger();

/* ------------------------------- Misiones ------------------------------- */

export type MissionType = 'purchasesMonth' | 'appPurchases' | 'referrals' | 'profile';
export const MISSION_TYPES: MissionType[] = ['purchasesMonth', 'appPurchases', 'referrals', 'profile'];

export interface Mission {
  id: string;
  type: MissionType;
  target: number;
  reward: number;
  active: boolean;
  /** Nombre libre (misiones creadas en la demo). */
  name?: string;
  /** Resultados de ejemplo: % de miembros que la completan y aumento en compras. */
  stats?: { completion: number; lift: number };
}

export const DEFAULT_MISSIONS: Mission[] = [
  { id: 'buy2', type: 'purchasesMonth', target: 2, reward: 300, active: true, stats: { completion: 41, lift: 12 } },
  { id: 'app1', type: 'appPurchases', target: 1, reward: 150, active: true, stats: { completion: 18, lift: 7 } },
  { id: 'refer1', type: 'referrals', target: 1, reward: 200, active: true, stats: { completion: 6, lift: 4 } },
  { id: 'profile', type: 'profile', target: 1, reward: 50, active: true, stats: { completion: 63, lift: 0 } },
];

/* ------------------------------- Campañas ------------------------------- */

export type Segment = 'all' | 'silverGold' | 'vip' | 'atRisk' | 'nearTier' | 'dormant' | 'birthdays';
export const SEGMENTS: Segment[] = ['all', 'silverGold', 'vip', 'atRisk', 'nearTier', 'dormant', 'birthdays'];
export type CampaignChannel = 'whatsapp' | 'email' | 'sms' | 'app';
export const CAMPAIGN_CHANNELS: CampaignChannel[] = ['whatsapp', 'email', 'sms', 'app'];
export type CampaignStatus = 'scheduled' | 'active' | 'paused' | 'draft';

export interface Campaign {
  id: string;
  /** Clave de texto de ejemplo; si no hay, se usa `name`. */
  key?: string;
  name?: string;
  message?: string;
  segment: Segment;
  channel: CampaignChannel;
  /** 0 = domingo … 6 = sábado. */
  day: number;
  time: string;
  status: CampaignStatus;
  daily?: boolean;
}

export const DEFAULT_CAMPAIGNS: Campaign[] = [
  { id: 'c1', key: 'doublePoints', segment: 'silverGold', channel: 'whatsapp', day: 6, time: '10:00', status: 'scheduled' },
  { id: 'c2', key: 'winback', segment: 'atRisk', channel: 'email', day: 1, time: '09:00', status: 'active' },
  { id: 'c3', key: 'birthday', segment: 'birthdays', channel: 'whatsapp', day: 1, time: '09:30', status: 'active', daily: true },
  { id: 'c4', key: 'dermoLaunch', segment: 'vip', channel: 'app', day: 5, time: '11:00', status: 'draft' },
];

/** % de la base que autorizó cada canal (datos de ejemplo). */
export const CHANNEL_OPT_IN: Record<CampaignChannel, number> = { whatsapp: 0.74, email: 0.58, sms: 0.81, app: 0.33 };

/* ------------------------------ Antifraude ------------------------------ */

export type AlertKind = 'anomalous' | 'duplicate' | 'referral' | 'redeem' | 'sameDay' | 'highAmount';
export type Severity = 'high' | 'medium' | 'low';
export type AlertStatus = 'open' | 'frozen' | 'dismissed';

export interface FraudAlert {
  id: string;
  kind: AlertKind;
  severity: Severity;
  status: AlertStatus;
  /** Miembro de ejemplo (texto) o id de un miembro de la demo. */
  memberLabel?: string;
  memberId?: string;
  /** Ventas de la sesión que dispararon la regla. */
  saleIds?: string[];
  session?: boolean;
}

export const DEFAULT_ALERTS: FraudAlert[] = [
  { id: 'f1', kind: 'anomalous', severity: 'high', status: 'open', memberId: 'm-jhon', memberLabel: 'Jhon Fredy O. · 301 *** 0198' },
  { id: 'f2', kind: 'duplicate', severity: 'high', status: 'open', memberLabel: 'C.C. *** 552 (3 cuentas)' },
  { id: 'f3', kind: 'referral', severity: 'medium', status: 'open', memberLabel: 'Kevin A. · 318 *** 0144' },
  { id: 'f4', kind: 'redeem', severity: 'low', status: 'open', memberLabel: 'Natalia S. · 312 *** 0109' },
];

/** Reglas antifraude que la demo evalúa de verdad sobre las compras que registras. */
export const FRAUD_RULES = { sameDayPurchases: 3, highAmount: 2_000_000 };

/* ------------------------------ Pruebas A/B ------------------------------ */

export type ExperimentId = 'tripleTuesday' | 'welcome300' | 'birthdayBonus';
export interface Experiment {
  id: ExperimentId;
  status: 'running' | 'finished';
  /** Resultado de ejemplo de cada variante (en %). */
  a: number;
  b: number;
  winner: 'a' | 'b';
  days: number;
}

export const DEFAULT_EXPERIMENTS: Experiment[] = [
  { id: 'tripleTuesday', status: 'running', a: 12.4, b: 13.1, winner: 'a', days: 21 },
  { id: 'welcome300', status: 'running', a: 22, b: 27, winner: 'b', days: 28 },
  { id: 'birthdayBonus', status: 'running', a: 9, b: 21, winner: 'b', days: 30 },
];

/* -------------------------------- Aliados -------------------------------- */

export type AllyCategory = 'bakery' | 'optics' | 'laundry' | 'gym' | 'other';
export const ALLY_CATEGORIES: AllyCategory[] = ['bakery', 'optics', 'laundry', 'gym', 'other'];

export interface Ally {
  id: string;
  name: string;
  city: string;
  category: AllyCategory;
  /** Puntos que da el aliado por cada $1.000 comprados allí. */
  rate: number;
  /** Puntos emitidos en el mes (datos de ejemplo). */
  monthPoints: number;
}

export const DEFAULT_ALLIES: Ally[] = [
  { id: 'a1', name: 'Panadería Trigo Dorado', city: 'Bogotá', category: 'bakery', rate: 1, monthPoints: 184000 },
  { id: 'a2', name: 'Óptica Mirada Clara', city: 'Bogotá', category: 'optics', rate: 2, monthPoints: 96000 },
  { id: 'a3', name: 'Lavandería Espuma Blanca', city: 'Bogotá', category: 'laundry', rate: 1, monthPoints: 41000 },
];

/* -------------------------------- Sorteos -------------------------------- */

export interface Draw {
  id: string;
  key?: string;
  name?: string;
  prize?: string;
  date: string;
  ticketCost: number;
  participants: number;
  status: 'scheduled' | 'done';
  winner?: string;
}

export const DEFAULT_DRAWS: Draw[] = [
  { id: 'd1', key: 'basket', date: '2026-10-30', ticketCost: 200, participants: 1284, status: 'scheduled' },
  { id: 'd2', key: 'skincare', date: '2026-09-30', ticketCost: 300, participants: 962, status: 'done', winner: 'Diana P. · Laureles' },
];

/** Participantes ficticios para el sorteo simulado. */
export const DRAW_PARTICIPANTS = [
  'Diana P. · Laureles',
  'Mateo G. · Chapinero',
  'Luisa F. · Granada',
  'Óscar V. · Chapinero',
  'Paola C. · Laureles',
  'Esteban M. · Granada',
  'Natalia S. · Chapinero',
  'Kevin A. · Laureles',
];

/* ------------------------------ Resultados ------------------------------ */

/**
 * Miembros por puntos de compras acumulados en el año, en tramos de 250
 * puntos (el último tramo incluye 12.250 o más). Suma 29.200 miembros.
 * Con los umbrales por defecto da 18.300 Clásico, 7.500 Plata, 2.700 Oro y 700 Diamante.
 */
export const POINTS_HISTOGRAM_STEP = 250;
export const POINTS_HISTOGRAM = [
  4232, 3669, 3180, 2757, 2390, 2072, 1313, 1138, 987, 855, 742, 643, 557, 483, 419, 363, 399, 347, 301, 261, 226, 196, 170, 147, 128,
  111, 96, 83, 72, 62, 54, 47, 101, 87, 76, 66, 57, 49, 43, 37, 32, 28, 24, 21, 18, 16, 14, 12, 10, 9,
];

/** Miembros de Plata, Oro y Diamante por meses sin comprar (0…24), para la regla de bajada de nivel. */
export const INACTIVITY_HISTOGRAM = [
  3120, 2210, 1340, 820, 610, 420, 300, 230, 190, 160, 140, 120, 110, 90, 80, 70, 60, 50, 45, 40, 35, 30, 25, 20, 15,
];

export const ANALYTICS = {
  active90: 18400,
  redemptionRate: 31,
  ticketMember: 68000,
  ticketNonMember: 49000,
  expiredPct: 18,
  /** Puntos vigentes de toda la base antes de la demo. */
  outstandingPoints: 9_600_000,
  /** Ventas mensuales a miembros (para el costo estimado). */
  monthlyMemberSales: 1_600_000_000,
  atRisk: 3400,
  dormant: 6300,
  vipShare: 0.72,
  /** Retención por cohorte (mes de inscripción mayo–octubre 2026). */
  cohortStartMonth: 5,
  cohort: [
    [100, 78, 66, 59, 54, 51],
    [100, 80, 67, 60, 55],
    [100, 76, 64, 58],
    [100, 81, 69],
    [100, 79],
    [100],
  ] as number[][],
  /** Canjes de los últimos 30 días (ejemplo). */
  topRewards: { delivery: 1920, voucher10: 1480, pressure: 860, handCream: 640, foodBank: 410, voucher25: 390 } as Record<string, number>,
};

/** Puntos del mes de otros miembros para el ranking (nombres ficticios). */
export const LEADERBOARD_SAMPLE: { name: string; pts: number }[] = [
  { name: 'Diana P.', pts: 1240 },
  { name: 'Mateo G.', pts: 1115 },
  { name: 'Óscar V.', pts: 905 },
  { name: 'Paola C.', pts: 860 },
  { name: 'Esteban M.', pts: 655 },
  { name: 'Natalia S.', pts: 540 },
  { name: 'Kevin A.', pts: 410 },
  { name: 'Luisa F.', pts: 330 },
  { name: 'Ana María T.', pts: 260 },
  { name: 'Felipe R.', pts: 180 },
];
