/**
 * Genera el conjunto de datos de ejemplo de forma determinista (generador
 * pseudoaleatorio con semilla fija) y con fechas relativas a `baseDate`, la
 * fecha del día en que se abre la demo. Así los cumpleaños, los contratos por
 * vencer y el período de nómina siempre tienen sentido frente a "hoy".
 */
import { addDays, addMonths, diffDays, endOfBusinessDays, isBusinessDay, type ISODate } from './dates';
import {
  AFP_LIST, BANKS, CCF_BY_SITE, COMPANY, COURSE_HOURS, EPS_LIST, FEMALE, MALE, POSITIONS, SURNAMES,
} from './catalog';
import type {
  AreaId, Candidate, ContractType, Course, CourseId, Employee, Exit, ExitReason, HrState, Leave, Novelty,
  Offboarding, Onboarding, PositionId, Review, SiteId, Survey, Vacancy,
} from './types';
import { currentPeriod, previousMonth } from './payroll';

export const STATE_VERSION = 5;

/** Nombre de la colaboradora que usa la app en la demo. */
export const APP_EMPLOYEE_NAME = 'Camila Rojas Parra';

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rand = ReturnType<typeof rng>;
const int = (r: Rand, min: number, max: number) => min + Math.floor(r() * (max - min + 1));
const pick = <T,>(r: Rand, list: readonly T[]) => list[Math.floor(r() * list.length)];
const round = (n: number, step: number) => Math.round(n / step) * step;

interface Slot {
  positionId: PositionId;
  site: SiteId;
  managerKey: string;
  area?: AreaId;
  name?: string;
  gender?: 'F' | 'M';
  key?: string;
}

const LEADERS: Slot[] = [
  { key: 'ceo', positionId: 'ceo', site: 'bogota', managerKey: '', name: 'Hernando Ospina Valencia', gender: 'M' },
  { key: 'plant', positionId: 'plantDirector', site: 'funza', managerKey: 'ceo', name: 'Claudia Patricia Mejía Arango', gender: 'F' },
  { key: 'cfo', positionId: 'cfo', site: 'bogota', managerKey: 'ceo', name: 'Ricardo Salazar Pineda', gender: 'M' },
  { key: 'sales', positionId: 'salesDirector', site: 'bogota', managerKey: 'ceo', name: 'Natalia Cárdenas Gómez', gender: 'F' },
  { key: 'hr', positionId: 'hrHead', site: 'bogota', managerKey: 'ceo', name: 'Luisa Fernanda Martínez Ortiz', gender: 'F' },
  { key: 'log', positionId: 'logisticsHead', site: 'medellin', managerKey: 'ceo', name: 'Jorge Iván Salas Zapata', gender: 'M' },
  { key: 'qa', positionId: 'qualityHead', site: 'funza', managerKey: 'plant', name: 'Andrea Bermúdez Rincón', gender: 'F' },
  { key: 'mnt', positionId: 'maintenanceHead', site: 'funza', managerKey: 'plant', name: 'Felipe Quintero Duarte', gender: 'M' },
];

function rosterSlots(): Slot[] {
  const slots: Slot[] = [...LEADERS];
  const add = (positionId: PositionId, n: number, site: SiteId | ((i: number) => SiteId), managerKey: string | ((i: number) => string), area?: AreaId) => {
    for (let i = 0; i < n; i++) {
      slots.push({ positionId, site: typeof site === 'function' ? site(i) : site, managerKey: typeof managerKey === 'function' ? managerKey(i) : managerKey, area });
    }
  };
  for (let s = 0; s < 6; s++) slots.push({ key: `sup${s}`, positionId: 'supervisor', site: 'funza', managerKey: 'plant' });
  // Camila Rojas: la colaboradora que usa la app en la demo.
  slots.push({ key: 'camila', positionId: 'packer', site: 'funza', managerKey: 'sup0', name: 'Camila Rojas Parra', gender: 'F' });
  add('packer', 59, 'funza', (i) => `sup${(i + 1) % 6}`);
  add('operator', 43, 'funza', (i) => `sup${i % 6}`);
  add('qualityAssistant', 8, 'funza', 'qa');
  add('qualityAnalyst', 3, 'funza', 'qa');
  add('technician', 8, 'funza', 'mnt');
  add('warehouseAssistant', 16, (i) => (i < 10 ? 'medellin' : 'funza'), 'log');
  add('driver', 6, (i) => (i < 4 ? 'medellin' : 'funza'), 'log');
  add('salesRep', 12, (i) => (i < 8 ? 'bogota' : 'medellin'), 'sales');
  add('accountant', 3, 'bogota', 'cfo');
  add('costAnalyst', 1, 'bogota', 'cfo');
  add('adminAssistant', 4, 'bogota', 'cfo');
  add('hrAnalyst', 2, 'bogota', 'hr');
  const apprentices: [AreaId, SiteId, string][] = [
    ['production', 'funza', 'plant'], ['production', 'funza', 'plant'], ['quality', 'funza', 'qa'],
    ['maintenance', 'funza', 'mnt'], ['finance', 'bogota', 'cfo'], ['people', 'bogota', 'hr'],
  ];
  apprentices.forEach(([area, site, mgr]) => slots.push({ positionId: 'apprentice', site, managerKey: mgr, area }));
  return slots;
}

function makeName(r: Rand, used: Set<string>, gender: 'F' | 'M'): string {
  for (;;) {
    const name = `${pick(r, gender === 'F' ? FEMALE : MALE)} ${pick(r, SURNAMES)} ${pick(r, SURNAMES)}`;
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
}

function slug(name: string) {
  const parts = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(' ');
  return `${parts[0]}.${parts[parts.length - 2] ?? parts[1]}`;
}

function phone(r: Rand) {
  return `3${int(r, 0, 2)}${int(r, 0, 9)} ${int(r, 100, 999)} ${int(r, 1000, 9999)}`;
}

/** Duración en meses de cada contrato a término fijo. */
const FIXED_TERMS = [6, 12];

export function buildEmployees(base: ISODate): Employee[] {
  const r = rng(7331);
  const used = new Set<string>(LEADERS.map((l) => l.name!));
  used.add('Camila Rojas Parra');
  const slots = rosterSlots();
  const keyToId = new Map<string, string>();
  slots.forEach((s, i) => {
    if (s.key) keyToId.set(s.key, `E${String(i + 1).padStart(3, '0')}`);
  });

  // Fin de los contratos a término fijo: 6 vencen en los próximos 30 días.
  const soonOffsets = [5, 9, 14, 19, 24, 29];
  let fixedCount = 0;
  const probationOffsets = [3, 8, 12];
  let probationCount = 0;
  const birthdaySoon = [0, 2, 5, 9, 13];
  const usedDocs = new Set<string>();

  return slots.map((s, i): Employee => {
    const id = `E${String(i + 1).padStart(3, '0')}`;
    const info = POSITIONS[s.positionId];
    const gender = s.gender ?? (r() < 0.5 ? 'F' : 'M');
    const name = s.name ?? makeName(r, used, gender);
    const birthYear = s.positionId === 'apprentice' ? int(r, 2004, 2007) : s.key && s.key !== 'camila' ? int(r, 1970, 1988) : int(r, 1975, 2003);
    let docId = '';
    while (!docId || usedDocs.has(docId)) docId = birthYear >= 1990 ? `10${int(r, 0, 3)}${int(r, 1000000, 9999999)}` : `${pick(r, gender === 'F' ? ['52', '39', '41', '43'] : ['79', '80', '19', '71'])}${int(r, 100000, 999999)}`;
    usedDocs.add(docId);

    let contract: ContractType = 'indefinite';
    if (s.positionId === 'apprentice') contract = 'apprentice';
    else if (!s.key && (s.positionId === 'packer' || s.positionId === 'operator' || s.positionId === 'warehouseAssistant')) {
      const roll = r();
      if (s.positionId === 'packer' ? roll < 0.4 : roll < 0.2) contract = 'fixed';
      else if (s.positionId === 'operator' && roll < 0.27) contract = 'work';
    }

    let joined: ISODate;
    let contractEnd: ISODate | null = null;
    let termMonths: number | undefined;
    if (s.key === 'camila') {
      // 1.008 días de servicio → 42 días hábiles causados; con 30 tomados queda un saldo de 12.
      joined = addDays(base, -1008);
    } else if (s.key) {
      joined = addDays(base, -int(r, 900, 3600));
    } else if (contract === 'fixed') {
      termMonths = pick(r, FIXED_TERMS);
      const offset = fixedCount < soonOffsets.length ? soonOffsets[fixedCount] : int(r, 35, termMonths * 30 - 5);
      fixedCount++;
      contractEnd = addDays(base, offset);
      const renewals = int(r, 1, 3);
      joined = addDays(addMonths(contractEnd, -termMonths * renewals), 1);
    } else if (contract === 'apprentice') {
      joined = addDays(base, -int(r, 60, 300));
      contractEnd = addDays(addMonths(joined, 12), -1);
    } else if (contract === 'work') {
      joined = addDays(base, -int(r, 90, 400));
      contractEnd = null;
    } else if (probationCount < probationOffsets.length && (s.positionId === 'operator' || s.positionId === 'qualityAssistant')) {
      joined = addDays(base, -(60 - probationOffsets[probationCount]));
      probationCount++;
    } else {
      joined = addDays(base, -int(r, 120, 4200));
    }

    const [min, max] = info.salary;
    const salary = min === max ? min : Math.max(min, round(min + r() * (max - min), 10000));

    let birthday: string;
    if (i % 37 === 3 && birthdaySoon.length) birthday = addDays(base, birthdaySoon.shift()!).slice(5);
    else birthday = `${String(int(r, 1, 12)).padStart(2, '0')}-${String(int(r, 1, 28)).padStart(2, '0')}`;

    const service = diffDays(joined, base);
    const accrued = contract === 'apprentice' ? 0 : (service / 360) * 15;
    const accumulator = s.key === 'cfo' || i === 120 || i === 150;
    const target = s.key === 'camila' ? 12 : accumulator ? int(r, 31, 36) : int(r, 2, 18);
    const vacTaken = contract === 'apprentice' ? 0 : Math.max(0, Math.floor(accrued) - Math.min(target, Math.floor(accrued)));

    const examAge = i % 23 === 7 ? int(r, 366, 420) : i % 29 === 11 ? int(r, 340, 362) : int(r, 20, 330);
    const lastExam = addDays(base, -Math.min(examAge, Math.max(service - 1, 0)));
    const emailOk = info.shift === 'office' || s.positionId === 'qualityAnalyst' || s.positionId === 'supervisor';

    return {
      id,
      name,
      gender,
      docId,
      positionId: s.positionId,
      area: s.area ?? info.area,
      site: s.site,
      managerId: s.managerKey ? keyToId.get(s.managerKey) ?? null : null,
      contract,
      termMonths,
      joined,
      contractEnd,
      salary,
      birthday,
      birthYear,
      phone: phone(r),
      email: emailOk ? `${slug(name)}@${COMPANY.domain}` : null,
      eps: pick(r, EPS_LIST),
      afp: pick(r, AFP_LIST),
      ccf: CCF_BY_SITE[s.site],
      arlClass: info.arl,
      shift: info.shift,
      vacTaken,
      lastExam,
      bank: pick(r, BANKS),
      account: `${int(r, 100, 999)}${int(r, 1000000, 9999999)}`,
      status: 'active',
    };
  });
}

function buildLeaves(base: ISODate, emps: Employee[]): Leave[] {
  const r = rng(909);
  const out: Leave[] = [];
  let k = 0;
  const nextId = () => `L${String(++k).padStart(2, '0')}`;
  const veteran = (pos: PositionId, n: number) =>
    emps.filter((e) => e.positionId === pos && e.contract !== 'apprentice' && e.name !== APP_EMPLOYEE_NAME && diffDays(e.joined, base) > 420)[n];
  const startOn = (iso: ISODate) => {
    let d = iso;
    while (!isBusinessDay(d)) d = addDays(d, 1);
    return d;
  };
  // Vacaciones: se ajusta lo ya disfrutado para que el saldo alcance (nunca queda negativo).
  const vacation = (e: Employee | undefined, fromOff: number, days: number, status: Leave['status'], rejectReason?: string) => {
    if (!e) return;
    const from = startOn(addDays(base, fromOff));
    const accrued = Math.floor((diffDays(e.joined, base) / 360) * 15);
    const booked = out.filter((l) => l.employeeId === e.id && l.type === 'vacation' && l.status !== 'rejected').reduce((a, l) => a + l.days, 0);
    const maxTaken = accrued - booked - (status === 'rejected' ? 0 : days) - int(r, 2, 6);
    e.vacTaken = Math.max(0, Math.min(e.vacTaken, maxTaken));
    out.push({ id: nextId(), employeeId: e.id, type: 'vacation', from, to: endOfBusinessDays(from, days), days, status, rejectReason, source: 'seed' });
  };
  vacation(veteran('technician', 2), 12, 5, 'pending');
  vacation(veteran('salesRep', 3), 20, 10, 'pending');
  vacation(veteran('accountant', 1), 6, 3, 'pending');
  vacation(veteran('packer', 14), 15, 6, 'pending');
  vacation(veteran('qualityAnalyst', 0), -3, 10, 'approved');
  vacation(veteran('operator', 7), -1, 5, 'approved');
  vacation(veteran('driver', 1), 25, 8, 'approved');
  vacation(veteran('warehouseAssistant', 2), -12, 5, 'approved');
  vacation(veteran('packer', 30), -40, 6, 'rejected', 'peak');

  // Incapacidades, permisos y licencias de los últimos 30 días (base del ausentismo).
  const plant = emps.filter((e) => ['packer', 'operator', 'warehouseAssistant', 'driver', 'technician', 'qualityAssistant'].includes(e.positionId) && e.name !== APP_EMPLOYEE_NAME && e.contract !== 'apprentice');
  const used = new Set(out.map((l) => l.employeeId));
  const pickFree = () => {
    for (;;) {
      const e = pick(r, plant);
      if (!used.has(e.id)) {
        used.add(e.id);
        return e;
      }
    }
  };
  for (let i = 0; i < 20; i++) {
    const days = pick(r, [1, 2, 2, 3, 3, 3, 4, 5, 7, 10, 15]);
    const from = addDays(base, -int(r, 1, 29));
    out.push({ id: nextId(), employeeId: pickFree().id, type: 'sick', from, to: addDays(from, days - 1), days, status: 'approved', note: i % 6 === 0 ? 'arl' : 'eps', source: 'seed' });
  }
  for (let i = 0; i < 4; i++) {
    const from = startOn(addDays(base, -int(r, 2, 26)));
    out.push({ id: nextId(), employeeId: pickFree().id, type: 'permit', from, to: from, days: 1, status: 'approved', note: 'medical', source: 'seed' });
  }
  const unpaidFrom = startOn(addDays(base, -9));
  out.push({ id: nextId(), employeeId: pickFree().id, type: 'unpaid', from: unpaidFrom, to: addDays(unpaidFrom, 2), days: 3, status: 'approved', note: 'personal', source: 'seed' });
  const permitFrom = startOn(addDays(base, 4));
  out.push({ id: nextId(), employeeId: pickFree().id, type: 'permit', from: permitFrom, to: permitFrom, days: 1, status: 'pending', note: 'medical', source: 'seed' });
  return out;
}

function buildExits(base: ISODate): Exit[] {
  const r = rng(99);
  const used = new Set<string>();
  const reasons: ExitReason[] = ['resignation', 'resignation', 'resignation', 'endOfTerm', 'endOfTerm', 'dismissal', 'agreement'];
  const positions: PositionId[] = ['packer', 'packer', 'packer', 'operator', 'operator', 'warehouseAssistant', 'salesRep', 'driver', 'qualityAssistant'];
  return Array.from({ length: 22 }, (_, i) => ({
    id: `X${i + 1}`,
    name: makeName(r, used, r() < 0.5 ? 'F' : 'M'),
    positionId: pick(r, positions),
    date: addDays(base, -int(r, 12, 360)),
    reason: pick(r, reasons),
  })).sort((a, b) => (a.date < b.date ? 1 : -1));
}

function buildTalent(base: ISODate): { vacancies: Vacancy[]; candidates: Candidate[] } {
  const vacancies: Vacancy[] = [
    { id: 'V1', positionId: 'packer', site: 'funza', openings: 12, hired: 2, minYears: 0, education: 'highSchool', shifts: true },
    { id: 'V2', positionId: 'warehouseAssistant', site: 'medellin', openings: 2, hired: 0, minYears: 1, education: 'highSchool', shifts: true },
    { id: 'V3', positionId: 'costAnalyst', site: 'bogota', openings: 1, hired: 0, minYears: 3, education: 'professional', shifts: false },
    { id: 'V4', positionId: 'technician', site: 'funza', openings: 1, hired: 0, minYears: 2, education: 'technical', shifts: true },
  ];
  const r = rng(4242);
  const used = new Set<string>();
  const spec: [string, Candidate['stage'], number][] = [
    ['V1', 'applied', 3], ['V1', 'screening', 2], ['V1', 'interview', 2], ['V1', 'offer', 1], ['V1', 'hired', 2],
    ['V2', 'applied', 2], ['V2', 'screening', 1], ['V2', 'interview', 1],
    ['V3', 'applied', 1], ['V3', 'interview', 1], ['V3', 'offer', 1],
    ['V4', 'applied', 1], ['V4', 'screening', 1],
  ];
  const candidates: Candidate[] = [];
  const edu: Record<string, Candidate['education'][]> = {
    V1: ['highSchool', 'highSchool', 'technical'], V2: ['highSchool', 'technical'], V3: ['technologist', 'professional', 'professional'], V4: ['highSchool', 'technical', 'technologist'],
  };
  spec.forEach(([vacancyId, stage, n]) => {
    for (let k = 0; k < n; k++) {
      const g = r() < 0.5 ? 'F' : 'M';
      candidates.push({
        id: `C${candidates.length + 1}`,
        name: makeName(r, used, g),
        gender: g,
        vacancyId,
        stage,
        source: pick(r, ['jobBoard', 'jobBoard', 'referral', 'publicService', 'socialMedia', 'walkIn'] as const),
        years: vacancyId === 'V3' ? int(r, 2, 7) : int(r, 0, 5),
        education: pick(r, edu[vacancyId]),
        shifts: vacancyId === 'V3' ? false : r() < 0.8,
        distanceKm: int(r, 3, 40),
        appliedOn: addDays(base, -int(r, 3, 30)),
        phone: phone(r),
      });
    }
  });
  return { vacancies, candidates };
}

function buildProcesses(base: ISODate, emps: Employee[], candidates: Candidate[]): (Onboarding | Offboarding)[] {
  const hired = candidates.filter((c) => c.stage === 'hired');
  const r = rng(515);
  const leaving = emps.filter((e) => e.positionId === 'warehouseAssistant' && e.site === 'medellin' && e.contract === 'indefinite')[0];
  leaving.status = 'leaving';
  return [
    { id: 'P1', kind: 'in', candidateId: hired[0].id, name: hired[0].name, gender: hired[0].gender, docId: `10${int(r, 0, 3)}${int(r, 1000000, 9999999)}`, positionId: 'packer', site: 'funza', startDate: addDays(base, 3), done: ['contract', 'arl', 'eps', 'pension', 'ccf', 'medical'], closed: false },
    { id: 'P2', kind: 'in', candidateId: hired[1].id, name: hired[1].name, gender: hired[1].gender, docId: `10${int(r, 0, 3)}${int(r, 1000000, 9999999)}`, positionId: 'packer', site: 'funza', startDate: addDays(base, 10), done: ['medical'], closed: false },
    { id: 'P3', kind: 'out', employeeId: leaving.id, lastDay: addDays(base, 7), reason: 'resignation', done: ['letter'], closed: false },
  ];
}

function buildNovelties(emps: Employee[]): Novelty[] {
  const r = rng(808);
  const out: Novelty[] = [];
  const ops = emps.filter((e) => e.positionId === 'operator' || e.positionId === 'packer');
  for (let i = 0; i < 6; i++) out.push({ id: `N${out.length + 1}`, employeeId: ops[i * 7].id, kind: 'hed', qty: int(r, 4, 12) });
  for (let i = 0; i < 4; i++) out.push({ id: `N${out.length + 1}`, employeeId: ops[i * 9 + 3].id, kind: 'rn', qty: int(r, 24, 48) });
  for (let i = 0; i < 2; i++) out.push({ id: `N${out.length + 1}`, employeeId: ops[i * 11 + 5].id, kind: 'hen', qty: int(r, 3, 8) });
  for (let i = 0; i < 3; i++) out.push({ id: `N${out.length + 1}`, employeeId: ops[i * 13 + 2].id, kind: 'rdf', qty: 8 });
  emps.filter((e) => e.positionId === 'salesRep').slice(0, 4).forEach((e) => out.push({ id: `N${out.length + 1}`, employeeId: e.id, kind: 'commission', qty: round(300000 + r() * 600000, 10000) }));
  return out;
}

function buildReviews(emps: Employee[]): Review[] {
  const r = rng(321);
  return emps.filter((e) => POSITIONS[e.positionId].evaluated && e.status === 'active').map((e, i) => {
    const done = i % 5 !== 1 && i % 7 !== 4;
    // Cada persona tiene su nivel (de 2,6 a 4,9) y cada competencia varía un poco alrededor.
    const level = 2.6 + r() * 2.3;
    const s = () => Math.min(5, Math.max(1, Math.round(level + (r() - 0.5) * 1.4)));
    return done
      ? { employeeId: e.id, scores: { goals: s(), quality: s(), teamwork: s(), safety: s(), initiative: s() }, comment: '', status: 'done' as const }
      : { employeeId: e.id, scores: {}, comment: '', status: 'pending' as const };
  });
}

function buildCourses(base: ISODate, emps: Employee[]): Course[] {
  const r = rng(616);
  const all = emps.filter((e) => e.status !== 'retired');
  const ids = (f: (e: Employee) => boolean) => all.filter(f).map((e) => e.id);
  const spec: [CourseId, number, string[], number][] = [
    ['induction', 20, ids(() => true), 0.93],
    ['sst50', -5, ids((e) => e.positionId === 'supervisor' || e.positionId === 'hrHead' || e.positionId === 'hrAnalyst' || e.positionId === 'qualityHead'), 0.7],
    ['food', 45, ids((e) => e.area === 'production' || e.area === 'quality'), 0.72],
    ['heights', 10, ids((e) => e.area === 'maintenance'), 0.5],
    ['pesv', -12, ids((e) => e.positionId === 'driver'), 0.67],
    ['sagrilaft', 60, ids((e) => e.area === 'finance' || e.area === 'sales' || e.area === 'management'), 0.4],
    ['dataProtection', 30, ids((e) => e.area === 'people' || e.area === 'sales' || e.area === 'finance' || e.area === 'management'), 0.65],
    ['harassment', 90, ids(() => true), 0.3],
  ];
  return spec.map(([id, dueOff, assigned, pct]) => ({
    id,
    hours: COURSE_HOURS[id],
    due: addDays(base, dueOff),
    assigned,
    completed: assigned.filter(() => r() < pct),
  }));
}

function buildSurveys(base: ISODate): Survey[] {
  return [
    { id: 'S1', question: 'enps', audience: 'all', sentOn: addDays(base, -110), invited: 181, promoters: 58, passives: 50, detractors: 30, closed: true },
    { id: 'S2', question: 'enps', audience: 'all', sentOn: addDays(base, -50), invited: 184, promoters: 63, passives: 49, detractors: 27, closed: true },
    { id: 'S3', question: 'enps', audience: 'all', sentOn: addDays(base, -20), invited: 186, promoters: 71, passives: 45, detractors: 26, closed: true },
  ];
}

export function buildState(base: ISODate): HrState {
  const employees = buildEmployees(base);
  const { vacancies, candidates } = buildTalent(base);
  const processes = buildProcesses(base, employees, candidates);
  const period = currentPeriod(base);
  return {
    version: STATE_VERSION,
    baseDate: base,
    employees,
    leaves: buildLeaves(base, employees),
    exits: buildExits(base),
    vacancies,
    candidates,
    processes,
    run: { periodId: period.id, status: 'draft', novelties: buildNovelties(employees) },
    filing: { month: previousMonth(base), einvoice: 'pending', cunes: {}, pila: 'pending' },
    reviews: buildReviews(employees),
    courses: buildCourses(base, employees),
    surveys: buildSurveys(base),
    seq: 1000,
  };
}

