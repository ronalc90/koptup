/**
 * Empresas ficticias por sector para los datos de ejemplo.
 *
 * Los nombres de empresas, clientes, vendedores y NIT son inventados (no
 * corresponden a empresas ni personas reales). Las cifras se generan con una
 * semilla fija a partir de estos parámetros (ver `dataset.ts`).
 */
import type { CompanyProfile, MonthKey, SectorId, Thresholds } from './types';

export type PayBehavior = 'puntual' | 'lento' | 'moroso';

export interface CustomerSeed {
  name: string;
  /** Ciudad/sede única, o reparto entre varias. */
  city: string | Record<string, number>;
  seller: number;
  /** Peso relativo dentro de las ventas. */
  size: number;
  /** Mezcla de líneas propia (si no, la del sector). */
  lines?: Record<string, number>;
  /** Plazo de pago en días. */
  term: number;
  pay: PayBehavior;
  /** Variación anual propia frente a la tendencia del sector (−0,3 = compra 30 % menos cada año). */
  trend: number;
  /** Primer mes de compra (clientes nuevos). */
  since?: MonthKey;
}

export interface LineSeed {
  id: string;
  weight: number;
  /** Margen bruto base (0–1). */
  margin: number;
}

export interface Shock {
  city?: string;
  line?: string;
  from: MonthKey;
  to: MonthKey;
  /** Multiplicador de ventas. */
  sales?: number;
  /** Puntos de margen que se suman (negativo = cae). */
  margin?: number;
}

export interface ExpenseSeed {
  id: string;
  /** Valor mensual de 2025 (fijo). */
  monthly?: number;
  /** Proporción de las ventas (gasto variable). */
  variable?: number;
  /** Incremento anual. */
  growth: number;
}

export interface Preset {
  id: SectorId;
  company: CompanyProfile;
  cities: string[];
  lines: LineSeed[];
  sellers: string[];
  customers: CustomerSeed[];
  /** Ventas promedio mensuales de 2025 (COP). */
  monthlyBase: number;
  /** Estacionalidad enero–diciembre. */
  season: number[];
  /** Crecimiento anual del sector. */
  growth: number;
  /** Meta por defecto: crecimiento frente al año anterior. */
  goalGrowth: number;
  /** Umbrales de alertas por defecto. */
  thresholds: Thresholds;
  invoicePrefix: string;
  invoiceStart: number;
  shocks: Shock[];
  expenses: ExpenseSeed[];
  /** Caja disponible al corte (COP). */
  cashStart: number;
  /** Días de pago a proveedores. */
  supplierDays: number;
  /** IVA: proporción gravada de ventas y de compras (null = servicios excluidos de IVA). */
  iva: { salesShare: number; purchasesShare: number } | null;
}

/** Primer mes con datos y fecha de corte de los datos de ejemplo. */
export const SAMPLE_FROM: MonthKey = '2025-01';
export const SAMPLE_TO: MonthKey = '2026-09';
export const SAMPLE_CUTOFF = '2026-09-30';

const comercio: Preset = {
  id: 'comercio',
  company: { name: 'Distribuidora Cumbre Andina S.A.S.', nit: '901457832', city: 'Bogotá' },
  cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'],
  lines: [
    { id: 'lacteos', weight: 0.34, margin: 0.245 },
    { id: 'granos', weight: 0.38, margin: 0.262 },
    { id: 'aseo', weight: 0.28, margin: 0.33 },
  ],
  sellers: ['Andrea Rincón', 'Catalina Vélez', 'Felipe Moreno', 'Jorge Salcedo', 'Mónica Ortiz'],
  customers: [
    { name: 'Supermercados La Colmena del Valle', city: 'Cali', seller: 2, size: 9, term: 45, pay: 'lento', trend: 0 },
    { name: 'Autoservicio El Trébol', city: 'Bogotá', seller: 4, size: 8, term: 30, pay: 'puntual', trend: 0.05 },
    { name: 'Mercados Brisa Andina', city: 'Medellín', seller: 1, size: 8, term: 45, pay: 'puntual', trend: 0.02 },
    { name: 'Droguerías Vida Plena', city: 'Bogotá', seller: 0, size: 5, lines: { aseo: 0.9, granos: 0.1 }, term: 30, pay: 'puntual', trend: 0.04 },
    { name: 'Supertiendas El Faro Caribe', city: 'Barranquilla', seller: 3, size: 7, term: 45, pay: 'lento', trend: 0.03 },
    { name: 'Distribuciones Tiendas Unidas del Sur', city: 'Bogotá', seller: 0, size: 7, term: 30, pay: 'moroso', trend: -0.05 },
    { name: 'Comercializadora Montaña Verde', city: 'Medellín', seller: 1, size: 6, term: 60, pay: 'moroso', trend: 0 },
    { name: 'Hotel Las Garzas', city: 'Barranquilla', seller: 3, size: 3, lines: { lacteos: 0.5, granos: 0.4, aseo: 0.1 }, term: 30, pay: 'puntual', trend: 0 },
    { name: 'Casino Industrial Sabores del Cauca', city: 'Cali', seller: 2, size: 4, lines: { lacteos: 0.45, granos: 0.55 }, term: 30, pay: 'lento', trend: 0 },
    { name: 'Autoservicios La Economía Paisa', city: 'Medellín', seller: 1, size: 6, term: 30, pay: 'puntual', trend: -0.35 },
    { name: 'Red de Tiendas Barrio Amigo', city: 'Cali', seller: 2, size: 5, term: 45, pay: 'moroso', trend: -0.1 },
    { name: 'Supermercado El Molino Real', city: 'Bogotá', seller: 4, size: 6, term: 30, pay: 'puntual', trend: 0.06 },
    { name: 'Restaurantes Fogón Costeño', city: 'Barranquilla', seller: 3, size: 3, lines: { lacteos: 0.5, granos: 0.5 }, term: 30, pay: 'lento', trend: 0 },
    { name: 'Cafeterías Escolares Alegría', city: 'Bogotá', seller: 0, size: 3, lines: { lacteos: 0.6, granos: 0.4 }, term: 30, pay: 'puntual', trend: 0 },
    { name: 'Droguerías Botica Central', city: 'Cali', seller: 2, size: 3, lines: { aseo: 0.9, granos: 0.1 }, term: 30, pay: 'puntual', trend: -0.2 },
    { name: 'Mercaplaza del Río', city: 'Medellín', seller: 1, size: 4, term: 45, pay: 'lento', trend: 0.03 },
    { name: 'Mercados Frescos del Llano', city: 'Bogotá', seller: 4, size: 4, term: 30, pay: 'puntual', trend: 0, since: '2026-04' },
    { name: 'Tiendas de Conveniencia Punto Express', city: 'Medellín', seller: 1, size: 2, term: 30, pay: 'puntual', trend: 0, since: '2026-07' },
  ],
  monthlyBase: 1_700_000_000,
  season: [0.88, 0.9, 0.97, 0.95, 1.0, 0.98, 1.02, 1.0, 0.99, 1.03, 1.08, 1.2],
  growth: 0.085,
  goalGrowth: 10,
  thresholds: { goalGap: 5, marginDrop: 1.5, overdueGrowth: 10, cashFloor: 450, riskDrop: 25 },
  invoicePrefix: 'FE',
  invoiceStart: 18_240,
  shocks: [
    { city: 'Cali', from: '2026-08', to: '2026-09', sales: 0.72 },
    { line: 'lacteos', from: '2026-08', to: '2026-09', margin: -0.032 },
  ],
  expenses: [
    { id: 'nomina', monthly: 262_000_000, growth: 0.07 },
    { id: 'arriendo', monthly: 46_000_000, growth: 0.05 },
    { id: 'fletes', variable: 0.034, growth: 0 },
    { id: 'marketing', monthly: 21_000_000, growth: 0.05 },
    { id: 'tecnologia', monthly: 13_000_000, growth: 0.05 },
    { id: 'servicios', monthly: 9_000_000, growth: 0.05 },
    { id: 'otros', monthly: 15_000_000, growth: 0.05 },
  ],
  cashStart: 420_000_000,
  supplierDays: 45,
  iva: { salesShare: 0.55, purchasesShare: 0.55 },
};

const salud: Preset = {
  id: 'salud',
  company: { name: 'Clínica Ambulatoria Brisas del Río S.A.S.', nit: '900874215', city: 'Bogotá' },
  cities: ['Usaquén', 'Kennedy', 'Chía', 'Soacha'],
  lines: [
    { id: 'consulta', weight: 0.32, margin: 0.34 },
    { id: 'laboratorio', weight: 0.22, margin: 0.46 },
    { id: 'imagenes', weight: 0.26, margin: 0.41 },
    { id: 'cirugia', weight: 0.2, margin: 0.29 },
  ],
  sellers: ['Paola Duarte', 'Ricardo Lozano', 'Sandra Beltrán'],
  customers: [
    { name: 'EPS Cordillera Salud', city: { Usaquén: 0.3, Kennedy: 0.35, Chía: 0.15, Soacha: 0.2 }, seller: 0, size: 14, term: 60, pay: 'lento', trend: 0.04 },
    { name: 'EPS Horizonte Vital', city: { Usaquén: 0.2, Kennedy: 0.4, Chía: 0.1, Soacha: 0.3 }, seller: 0, size: 11, term: 60, pay: 'moroso', trend: -0.05 },
    { name: 'EPS Llanos Unidos', city: { Kennedy: 0.5, Soacha: 0.5 }, seller: 1, size: 7, term: 90, pay: 'moroso', trend: 0 },
    { name: 'Medicina Prepagada Altavista', city: { Usaquén: 0.6, Chía: 0.4 }, seller: 2, size: 6, term: 30, pay: 'puntual', trend: 0.08 },
    { name: 'Aseguradora Faro (SOAT)', city: { Kennedy: 0.5, Soacha: 0.3, Usaquén: 0.2 }, seller: 1, size: 3, lines: { cirugia: 0.4, imagenes: 0.4, consulta: 0.2 }, term: 45, pay: 'lento', trend: 0 },
    { name: 'ARL Senda Segura', city: { Kennedy: 0.5, Usaquén: 0.5 }, seller: 1, size: 3, term: 30, pay: 'puntual', trend: 0.03 },
    { name: 'Particulares (pago directo)', city: { Usaquén: 0.35, Kennedy: 0.25, Chía: 0.25, Soacha: 0.15 }, seller: 2, size: 8, term: 0, pay: 'puntual', trend: 0.06 },
    { name: 'Plan Complementario Salud Plus Andes', city: { Usaquén: 0.5, Chía: 0.5 }, seller: 2, size: 4, term: 30, pay: 'puntual', trend: 0.02 },
    { name: 'Fondo de Empleados Docentes del Sur', city: { Kennedy: 0.6, Soacha: 0.4 }, seller: 1, size: 2, lines: { consulta: 0.6, laboratorio: 0.4 }, term: 30, pay: 'puntual', trend: -0.3 },
    { name: 'Convenio de Salud Pública Municipal', city: { Soacha: 0.7, Chía: 0.3 }, seller: 0, size: 3, lines: { consulta: 0.6, laboratorio: 0.4 }, term: 60, pay: 'lento', trend: 0 },
    { name: 'Cooperativa Médica Sabana', city: { Chía: 0.7, Usaquén: 0.3 }, seller: 2, size: 3, term: 45, pay: 'lento', trend: 0 },
    { name: 'Póliza Colectiva Constructora Peñas Blancas', city: { Kennedy: 1 }, seller: 1, size: 2, lines: { consulta: 0.5, laboratorio: 0.3, imagenes: 0.2 }, term: 30, pay: 'puntual', trend: 0, since: '2026-05' },
  ],
  monthlyBase: 720_000_000,
  season: [0.92, 0.97, 1.02, 0.98, 1.03, 0.97, 0.95, 1.02, 1.03, 1.04, 1.02, 0.86],
  growth: 0.09,
  goalGrowth: 12,
  thresholds: { goalGap: 5, marginDrop: 1.5, overdueGrowth: 10, cashFloor: 200, riskDrop: 25 },
  invoicePrefix: 'FEV',
  invoiceStart: 52_310,
  shocks: [
    { city: 'Soacha', from: '2026-08', to: '2026-09', sales: 0.75 },
    { line: 'cirugia', from: '2026-08', to: '2026-09', margin: -0.04 },
  ],
  expenses: [
    { id: 'nomina', monthly: 96_000_000, growth: 0.07 },
    { id: 'arriendo', monthly: 39_000_000, growth: 0.05 },
    { id: 'mantenimiento', monthly: 14_000_000, growth: 0.05 },
    { id: 'tecnologia', monthly: 9_000_000, growth: 0.05 },
    { id: 'servicios', monthly: 12_000_000, growth: 0.05 },
    { id: 'otros', monthly: 10_000_000, growth: 0.05 },
  ],
  cashStart: 260_000_000,
  supplierDays: 60,
  iva: null,
};

const servicios: Preset = {
  id: 'servicios',
  company: { name: 'Meridiano Consultores Asociados S.A.S.', nit: '901236548', city: 'Bogotá' },
  cities: ['Bogotá', 'Medellín', 'Bucaramanga', 'Pereira'],
  lines: [
    { id: 'consultoria', weight: 0.34, margin: 0.46 },
    { id: 'auditoria', weight: 0.26, margin: 0.52 },
    { id: 'outsourcing', weight: 0.28, margin: 0.41 },
    { id: 'capacitacion', weight: 0.12, margin: 0.55 },
  ],
  sellers: ['Natalia Gómez', 'Esteban Ríos', 'Diana Carvajal'],
  customers: [
    { name: 'Constructora Peñas Blancas S.A.S.', city: 'Bogotá', seller: 0, size: 8, term: 45, pay: 'lento', trend: 0.05 },
    { name: 'Lácteos La Pradera del Norte S.A.S.', city: 'Bucaramanga', seller: 2, size: 6, term: 30, pay: 'puntual', trend: 0.02 },
    { name: 'Transportes Cóndor del Sur S.A.S.', city: 'Medellín', seller: 1, size: 7, term: 60, pay: 'moroso', trend: 0 },
    { name: 'Odontología Integral Alameda', city: 'Pereira', seller: 2, size: 3, lines: { outsourcing: 0.7, capacitacion: 0.3 }, term: 30, pay: 'puntual', trend: 0.04 },
    { name: 'Agroindustrial Cafetera Los Nevados S.A.S.', city: 'Pereira', seller: 2, size: 5, term: 45, pay: 'lento', trend: -0.3 },
    { name: 'Colegio Bilingüe Montebello', city: 'Bogotá', seller: 0, size: 3, lines: { auditoria: 0.5, capacitacion: 0.5 }, term: 30, pay: 'puntual', trend: 0 },
    { name: 'Fundación Social Semillas de Paz', city: 'Medellín', seller: 1, size: 3, lines: { auditoria: 0.6, consultoria: 0.4 }, term: 30, pay: 'puntual', trend: 0 },
    { name: 'Hoteles Altamira del Parque', city: 'Bogotá', seller: 0, size: 4, term: 45, pay: 'lento', trend: 0.03 },
    { name: 'Comercializadora Textil Arrayanes', city: 'Medellín', seller: 1, size: 5, term: 30, pay: 'puntual', trend: 0.06 },
    { name: 'Ferretería Industrial El Yunque', city: 'Bucaramanga', seller: 2, size: 4, term: 30, pay: 'moroso', trend: -0.1 },
    { name: 'Grupo Inmobiliario Cerros Orientales', city: 'Bogotá', seller: 0, size: 6, term: 45, pay: 'puntual', trend: 0.04 },
    { name: 'Laboratorios Naturales Guayacán', city: 'Bogotá', seller: 0, size: 4, term: 30, pay: 'puntual', trend: 0, since: '2026-03' },
    { name: 'Cooperativa de Ahorro Futuro Solidario', city: 'Bucaramanga', seller: 2, size: 3, term: 30, pay: 'puntual', trend: 0, since: '2026-06' },
  ],
  monthlyBase: 390_000_000,
  season: [0.78, 0.95, 1.06, 1.03, 1.05, 1.0, 0.98, 1.04, 1.06, 1.07, 1.05, 0.93],
  growth: 0.06,
  goalGrowth: 12,
  thresholds: { goalGap: 5, marginDrop: 1.5, overdueGrowth: 10, cashFloor: 150, riskDrop: 25 },
  invoicePrefix: 'SETP',
  invoiceStart: 7_120,
  shocks: [
    { city: 'Medellín', from: '2026-08', to: '2026-09', sales: 0.78 },
    { line: 'outsourcing', from: '2026-08', to: '2026-09', margin: -0.045 },
  ],
  expenses: [
    { id: 'nomina', monthly: 52_000_000, growth: 0.07 },
    { id: 'arriendo', monthly: 22_000_000, growth: 0.05 },
    { id: 'tecnologia', monthly: 9_000_000, growth: 0.05 },
    { id: 'marketing', monthly: 7_000_000, growth: 0.05 },
    { id: 'viajes', variable: 0.025, growth: 0 },
    { id: 'otros', monthly: 6_000_000, growth: 0.05 },
  ],
  cashStart: 210_000_000,
  supplierDays: 30,
  iva: { salesShare: 1, purchasesShare: 0.15 },
};

export const PRESETS: Record<SectorId, Preset> = { comercio, salud, servicios };

/** Dígito de verificación del NIT (algoritmo de la DIAN, módulo 11). */
export function nitDv(nit: string): number {
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const digits = nit.replace(/\D/g, '').split('').reverse().map(Number);
  const sum = digits.reduce((acc, d, i) => acc + d * (weights[i] ?? 0), 0);
  const r = sum % 11;
  return r >= 2 ? 11 - r : r;
}

/** `901457832` → `901.457.832-1`. Si ya trae guion o no son 9 dígitos, se deja como está. */
export function formatNit(nit: string): string {
  const clean = nit.trim();
  if (!/^\d{9}$/.test(clean)) return clean;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}-${nitDv(clean)}`;
}
