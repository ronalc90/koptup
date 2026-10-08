/**
 * Tipos del tablero ejecutivo de ejemplo.
 *
 * Todo el tablero sale de una sola lista de facturas (`SaleRow`) más los gastos
 * del mes (`ExpenseRow`): KPIs, gráficos, finanzas, clientes, alertas, preguntas
 * guiadas, resumen y PDF se calculan con las mismas filas, así las cifras cuadran
 * entre vistas. Con el CSV del visitante se reemplazan las filas de ventas.
 */

export type SectorId = 'comercio' | 'salud' | 'servicios';
export const SECTORS: SectorId[] = ['comercio', 'salud', 'servicios'];

/** Fecha ISO `AAAA-MM-DD` (sin hora ni zona: no se corre de día). */
export type ISODate = string;
/** Mes `AAAA-MM`. */
export type MonthKey = string;

export interface SaleRow {
  /** Número de factura. */
  id: string;
  date: ISODate;
  customer: string;
  /** Ciudad o sede. */
  city: string;
  /** Id de línea (datos de ejemplo) o texto tal cual (archivo del visitante). */
  line: string;
  seller: string;
  /** Venta neta en COP, sin IVA. */
  value: number;
  /** Costo de ventas en COP (null si el archivo no lo trae). */
  cost: number | null;
  /** Fecha de vencimiento (solo datos de ejemplo). */
  due: ISODate | null;
  /** Fecha de pago; null = pendiente al corte. */
  paid: ISODate | null;
}

export interface ExpenseRow {
  month: MonthKey;
  /** Id de categoría (`nomina`, `arriendo`…). */
  category: string;
  amount: number;
}

export interface Dataset {
  source: 'sample' | 'upload';
  sector: SectorId;
  fileName: string | null;
  rows: SaleRow[];
  /** Gastos operacionales por mes (null con el archivo del visitante). */
  expenses: ExpenseRow[] | null;
  /** Meses con datos, ordenados. */
  months: MonthKey[];
  /** Fecha de corte (última fecha con datos). */
  cutoff: ISODate;
  /** Caja disponible al corte (solo datos de ejemplo). */
  cashStart: number | null;
  /** Días de pago a proveedores (solo datos de ejemplo). */
  supplierDays: number | null;
  hasCost: boolean;
  hasReceivables: boolean;
  /** Parámetros de IVA para el flujo de caja (solo datos de ejemplo). */
  iva: { salesShare: number; purchasesShare: number } | null;
}

export type PeriodKind = 'month' | 'quarter' | 'year';

export interface Period {
  /** `m:2026-09`, `q:2026-3`, `y:2026`. */
  key: string;
  kind: PeriodKind;
  year: number;
  /** Mes (1–12) o trimestre (1–4) según el tipo. */
  index: number;
  months: MonthKey[];
}

export interface Thresholds {
  /** % bajo la meta que dispara la alerta (ventas totales y por ciudad). */
  goalGap: number;
  /** Puntos de margen bruto que puede caer una línea frente al año anterior. */
  marginDrop: number;
  /** % de aumento de la cartera > 90 días frente al cierre del período anterior. */
  overdueGrowth: number;
  /** Caja mínima aceptable en el flujo a 13 semanas (millones de COP). */
  cashFloor: number;
  /** % de caída frente al año anterior para marcar un cliente "en riesgo". */
  riskDrop: number;
}

export interface Recipient {
  id: string;
  /** Nombre escrito por el visitante; si está vacío se muestra el cargo (`role`). */
  name: string;
  role?: 'ceo' | 'cfo';
  channel: 'whatsapp' | 'email';
  address: string;
}

export interface CompanyProfile {
  name: string;
  nit: string;
  city: string;
}

export interface Settings {
  sector: SectorId;
  /** Empresa por sector (cada sector trae su empresa ficticia; el visitante la puede renombrar). */
  companies: Partial<Record<SectorId, CompanyProfile>>;
  /** Meta de ventas por sector: crecimiento frente al mismo mes del año anterior (%). */
  goals: Record<SectorId, number>;
  /** Umbrales de alertas por sector (la caja mínima depende del tamaño de la empresa). */
  thresholds: Record<SectorId, Thresholds>;
  recipients: Recipient[];
}

export type ViewId = 'resumen' | 'finanzas' | 'clientes' | 'preguntas' | 'alertas' | 'fuentes' | 'configuracion';
export const VIEWS: ViewId[] = ['resumen', 'finanzas', 'clientes', 'preguntas', 'alertas', 'fuentes', 'configuracion'];
