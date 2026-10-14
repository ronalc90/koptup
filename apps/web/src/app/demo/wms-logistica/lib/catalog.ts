/**
 * Datos maestros de ejemplo. Todas las empresas, NIT, personas, direcciones y
 * transportadoras son ficticios; las ciudades y la nomenclatura de direcciones
 * son colombianas para que la operación se vea creíble.
 */
import type { CarrierId, ClientId, Product, WarehouseId, Zone } from './types';

/** Dígito de verificación del NIT (algoritmo de la DIAN, módulo 11). */
export function nitDv(nit: string): number {
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const digits = nit.replace(/\D/g, '').split('').reverse();
  const sum = digits.reduce((acc, d, i) => acc + Number(d) * weights[i], 0);
  const r = sum % 11;
  return r > 1 ? 11 - r : r;
}

export function fmtNit(nit: string): string {
  const n = nit.replace(/\D/g, '');
  return `${n.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${nitDv(n)}`;
}

/** Dígito de control EAN-13. */
export function ean13(base12: string): string {
  const sum = base12.split('').reduce((acc, d, i) => acc + Number(d) * (i % 2 ? 3 : 1), 0);
  return `${base12}${(10 - (sum % 10)) % 10}`;
}

export const COMPANY = {
  name: 'LogiSabana Demo S.A.S.',
  nit: '901583217',
  city: 'Funza, Cundinamarca',
};

export interface WarehouseInfo {
  id: WarehouseId;
  name: string;
  city: string;
  metro: string;
  clients: ClientId[];
  vehicles: { id: string; capacityKg: number }[];
}

export const WAREHOUSES: WarehouseInfo[] = [
  {
    id: 'fun',
    name: 'CEDI Funza',
    city: 'Funza, Cundinamarca',
    metro: 'bog',
    clients: ['lir', 'cth', 'nut'],
    vehicles: [
      { id: 'VAN-01', capacityKg: 600 },
      { id: 'VAN-02', capacityKg: 600 },
      { id: 'MOTO-03', capacityKg: 40 },
    ],
  },
  {
    id: 'ita',
    name: 'Bodega Itagüí',
    city: 'Itagüí, Antioquia',
    metro: 'med',
    clients: ['lir', 'cth'],
    vehicles: [
      { id: 'VAN-11', capacityKg: 600 },
      { id: 'MOTO-12', capacityKg: 40 },
    ],
  },
  {
    id: 'baq',
    name: 'Bodega Barranquilla',
    city: 'Barranquilla, Atlántico',
    metro: 'baq',
    clients: ['cth', 'nut'],
    vehicles: [
      { id: 'VAN-21', capacityKg: 600 },
      { id: 'MOTO-22', capacityKg: 40 },
    ],
  },
];

export const WAREHOUSE_BY_ID = Object.fromEntries(WAREHOUSES.map((w) => [w.id, w])) as Record<WarehouseId, WarehouseInfo>;

/* ---------------- Ubicaciones ---------------- */

export interface BinInfo {
  id: string;
  zone: Zone;
  aisle: number;
  module: number;
  /** Fila global (para medir recorridos dentro de la bodega). */
  row: number;
}

export const STORAGE_ZONES: Exclude<Zone, 'Q'>[] = ['A', 'B', 'C'];
export const AISLES = 4;
export const MODULES = 8;
/** Metros entre módulos y entre pasillos (para el recorrido de alistamiento). */
export const MODULE_M = 1.6;
export const AISLE_M = 3.2;

function buildBins(): BinInfo[] {
  const out: BinInfo[] = [];
  STORAGE_ZONES.forEach((zone, zi) => {
    for (let a = 1; a <= AISLES; a++) {
      for (let m = 1; m <= MODULES; m++) {
        out.push({ id: `${zone}-${String(a).padStart(2, '0')}-${String(m).padStart(2, '0')}`, zone, aisle: a, module: m, row: zi * AISLES + a });
      }
    }
  });
  for (let m = 1; m <= 4; m++) out.push({ id: `Q-01-${String(m).padStart(2, '0')}`, zone: 'Q', aisle: 1, module: m, row: 99 });
  return out;
}

/** Las tres bodegas de ejemplo usan la misma distribución: 96 ubicaciones + 4 de cuarentena. */
export const BINS: BinInfo[] = buildBins();
export const BIN_BY_ID = Object.fromEntries(BINS.map((b) => [b.id, b])) as Record<string, BinInfo>;
export const STORAGE_BINS = BINS.filter((b) => b.zone !== 'Q');
export const QUARANTINE_BINS = BINS.filter((b) => b.zone === 'Q');

/* ---------------- Clientes del 3PL y proveedores ---------------- */

export interface ClientInfo {
  id: ClientId;
  name: string;
  nit: string;
  sector: 'beauty' | 'home' | 'supplements';
}

export const CLIENTS: ClientInfo[] = [
  { id: 'lir', name: 'Lirio Cosmética S.A.S.', nit: '901672408', sector: 'beauty' },
  { id: 'cth', name: 'Casa Tejo Hogar S.A.S.', nit: '901439615', sector: 'home' },
  { id: 'nut', name: 'Nutrilia Suplementos S.A.S.', nit: '901720583', sector: 'supplements' },
];
export const CLIENT_BY_ID = Object.fromEntries(CLIENTS.map((c) => [c.id, c])) as Record<ClientId, ClientInfo>;

export interface SupplierInfo {
  id: string;
  name: string;
  nit: string;
  city: string;
  client: ClientId;
}

export const SUPPLIERS: SupplierInfo[] = [
  { id: 'gua', name: 'Laboratorio Cosmético Guaduales S.A.S.', nit: '900874316', city: 'Cota', client: 'lir' },
  { id: 'cal', name: 'Textiles Calima S.A.S.', nit: '901295047', city: 'Cali', client: 'cth' },
  { id: 'pco', name: 'Importadora Puerto Cocina S.A.S.', nit: '901508732', city: 'Cartagena', client: 'cth' },
  { id: 'alt', name: 'Nutrición Altamira S.A.S.', nit: '901346129', city: 'Rionegro', client: 'nut' },
];
export const SUPPLIER_BY_ID = Object.fromEntries(SUPPLIERS.map((s) => [s.id, s])) as Record<string, SupplierInfo>;

/* ---------------- Productos ---------------- */

const p = (
  idx: number,
  sku: string,
  client: ClientId,
  unitCost: number,
  weightKg: number,
  dailyDemand: number,
  opts: { bulky?: boolean; expires?: boolean; kit?: { sku: string; qty: number }[] } = {},
): Product => ({
  sku,
  client,
  barcode: ean13(`2000001${String(idx).padStart(5, '0')}`),
  unitCost,
  weightKg,
  bulky: !!opts.bulky,
  expires: !!opts.expires,
  dailyDemand,
  kit: opts.kit,
});

export const BASE_PRODUCTS: Product[] = [
  p(1, 'LIR-CHA400', 'lir', 18500, 0.45, 170, { expires: true }),
  p(2, 'LIR-ACO400', 'lir', 19200, 0.45, 30, { expires: true }),
  p(3, 'LIR-CRE250', 'lir', 15900, 0.3, 40, { expires: true }),
  p(4, 'LIR-PRO120', 'lir', 32000, 0.16, 70, { expires: true }),
  p(5, 'LIR-JAB3', 'lir', 12400, 0.3, 14, { expires: true }),
  p(6, 'CTH-TOA70', 'cth', 39900, 0.6, 18, {}),
  p(7, 'CTH-COB220', 'cth', 89000, 2.2, 3, { bulky: true }),
  p(8, 'CTH-VAJ16', 'cth', 129000, 6.5, 2, { bulky: true }),
  p(9, 'CTH-SAR24', 'cth', 54900, 1.1, 5, {}),
  p(10, 'NUT-PRO907', 'nut', 119000, 1.05, 20, { expires: true }),
  p(11, 'NUT-COL300', 'nut', 64900, 0.35, 34, { expires: true }),
  p(12, 'NUT-VTC60', 'nut', 24500, 0.12, 26, { expires: true }),
  p(13, 'NUT-OMG90', 'nut', 58000, 0.2, 6, { expires: true }),
  p(14, 'LIR-KITBV', 'lir', 49800, 1.15, 3, {
    expires: true,
    kit: [
      { sku: 'LIR-CHA400', qty: 1 },
      { sku: 'LIR-CRE250', qty: 1 },
      { sku: 'LIR-JAB3', qty: 1 },
    ],
  }),
];

/* ---------------- Ciudades, transportadoras y tarifas de ejemplo ---------------- */

export type Region = 'centro' | 'antioquia' | 'caribe' | 'oriente' | 'pacifico' | 'special';

export interface CityInfo {
  id: string;
  name: string;
  dept: string;
  region: Region;
  /** Área metropolitana a la que pertenece (para la flota propia). */
  metro?: string;
}

export const CITIES: CityInfo[] = [
  { id: 'bog', name: 'Bogotá', dept: 'Bogotá D. C.', region: 'centro', metro: 'bog' },
  { id: 'chi', name: 'Chía', dept: 'Cundinamarca', region: 'centro', metro: 'bog' },
  { id: 'mos', name: 'Mosquera', dept: 'Cundinamarca', region: 'centro', metro: 'bog' },
  { id: 'cot', name: 'Cota', dept: 'Cundinamarca', region: 'centro', metro: 'bog' },
  { id: 'med', name: 'Medellín', dept: 'Antioquia', region: 'antioquia', metro: 'med' },
  { id: 'env', name: 'Envigado', dept: 'Antioquia', region: 'antioquia', metro: 'med' },
  { id: 'bel', name: 'Bello', dept: 'Antioquia', region: 'antioquia', metro: 'med' },
  { id: 'baq', name: 'Barranquilla', dept: 'Atlántico', region: 'caribe', metro: 'baq' },
  { id: 'sol', name: 'Soledad', dept: 'Atlántico', region: 'caribe', metro: 'baq' },
  { id: 'clo', name: 'Cali', dept: 'Valle del Cauca', region: 'pacifico' },
  { id: 'per', name: 'Pereira', dept: 'Risaralda', region: 'antioquia' },
  { id: 'man', name: 'Manizales', dept: 'Caldas', region: 'antioquia' },
  { id: 'buc', name: 'Bucaramanga', dept: 'Santander', region: 'oriente' },
  { id: 'cuc', name: 'Cúcuta', dept: 'Norte de Santander', region: 'oriente' },
  { id: 'ibg', name: 'Ibagué', dept: 'Tolima', region: 'centro' },
  { id: 'vvc', name: 'Villavicencio', dept: 'Meta', region: 'centro' },
  { id: 'ctg', name: 'Cartagena', dept: 'Bolívar', region: 'caribe' },
  { id: 'smr', name: 'Santa Marta', dept: 'Magdalena', region: 'caribe' },
  { id: 'mtr', name: 'Montería', dept: 'Córdoba', region: 'caribe' },
  { id: 'pso', name: 'Pasto', dept: 'Nariño', region: 'pacifico' },
  { id: 'let', name: 'Leticia', dept: 'Amazonas', region: 'special' },
  { id: 'adz', name: 'San Andrés', dept: 'San Andrés y Providencia', region: 'special' },
];
export const CITY_BY_ID = Object.fromEntries(CITIES.map((c) => [c.id, c])) as Record<string, CityInfo>;

export const WAREHOUSE_REGION: Record<WarehouseId, Region> = { fun: 'centro', ita: 'antioquia', baq: 'caribe' };

export type ShipZone = 'local' | 'regional' | 'national' | 'special';

export interface CarrierInfo {
  id: CarrierId;
  name: string;
  prefix: string;
  /** [tarifa base en COP, días hábiles] por zona; null = no cubre. */
  zones: Record<ShipZone, [number, number] | null>;
  perKg: number;
  /** Kilos incluidos en la tarifa base. */
  includedKg: number;
  maxKg: number;
}

export const CARRIERS: CarrierInfo[] = [
  {
    id: 'ran',
    name: 'Rápido Andino',
    prefix: 'RA',
    zones: { local: [9800, 1], regional: [12400, 1], national: [15900, 2], special: [38500, 5] },
    perKg: 1900,
    includedKg: 1,
    maxKg: 60,
  },
  {
    id: 'con',
    name: 'Envíos Cóndor',
    prefix: 'EC',
    zones: { local: [8700, 1], regional: [10900, 2], national: [13200, 3], special: null },
    perKg: 1600,
    includedKg: 1,
    maxKg: 40,
  },
  {
    id: 'cei',
    name: 'Mensajería Ceiba',
    prefix: 'MC',
    zones: { local: [7900, 1], regional: [11800, 2], national: [14600, 3], special: [41000, 6] },
    perKg: 2100,
    includedKg: 1,
    maxKg: 30,
  },
  {
    id: 'mac',
    name: 'Carga Macondo',
    prefix: 'CM',
    zones: { local: null, regional: [16500, 2], national: [18900, 3], special: [35500, 5] },
    perKg: 900,
    includedKg: 5,
    maxKg: 500,
  },
  {
    id: 'own',
    name: 'Flota propia',
    prefix: 'FP',
    zones: { local: [6500, 0], regional: null, national: null, special: null },
    perKg: 0,
    includedKg: 0,
    maxKg: 600,
  },
];
export const CARRIER_BY_ID = Object.fromEntries(CARRIERS.map((c) => [c.id, c])) as Record<CarrierId, CarrierInfo>;

/* ---------------- Personas y direcciones (ficticias) ---------------- */

export const CUSTOMERS = [
  'Laura M.', 'Andrés P.', 'Camila G.', 'Julián R.', 'Valentina C.', 'Santiago O.', 'Daniela V.', 'Felipe T.',
  'Natalia B.', 'Sebastián H.', 'Mariana L.', 'Cristian A.', 'Paula S.', 'Juan D.', 'Luisa F.', 'Esteban N.',
];

export const WHOLESALERS = ['Droguería Sanavida', 'Almacén El Trébol', 'Distribuidora La Pradera', 'Minimercado Los Robles'];

export const PICKERS = ['Carlos R.', 'Marcela L.', 'Jhon P.', 'Andrea S.'];

export const STREETS = ['Cl', 'Cra', 'Av. Cra', 'Tv', 'Dg'];

/** Barrios de ejemplo por área metropolitana con su posición (km este, km norte) desde la bodega. */
export const LOCALITIES: Record<string, { name: string; city: string; x: number; y: number }[]> = {
  bog: [
    { name: 'Chapinero', city: 'bog', x: 17.5, y: 4.5 },
    { name: 'Usaquén', city: 'bog', x: 19.5, y: 10.5 },
    { name: 'Suba', city: 'bog', x: 13.5, y: 10 },
    { name: 'Engativá', city: 'bog', x: 8.5, y: 4.5 },
    { name: 'Kennedy', city: 'bog', x: 10, y: -3.5 },
    { name: 'Teusaquillo', city: 'bog', x: 14.5, y: 2 },
    { name: 'Fontibón', city: 'bog', x: 6.5, y: 0.5 },
    { name: 'Centro', city: 'cot', x: 7, y: 9 },
    { name: 'Centro', city: 'chi', x: 15, y: 18 },
    { name: 'Centro', city: 'mos', x: -2.5, y: -2 },
    { name: 'Cedritos', city: 'bog', x: 18, y: 8.5 },
    { name: 'Modelia', city: 'bog', x: 9, y: 1 },
  ],
  med: [
    { name: 'El Poblado', city: 'med', x: 3.5, y: 5.5 },
    { name: 'Laureles', city: 'med', x: 1, y: 8.5 },
    { name: 'Belén', city: 'med', x: -0.5, y: 6 },
    { name: 'Zona Centro', city: 'env', x: 4, y: 2 },
    { name: 'Niquía', city: 'bel', x: 4, y: 17 },
    { name: 'Robledo', city: 'med', x: -1, y: 11.5 },
    { name: 'Buenos Aires', city: 'med', x: 4.5, y: 9.5 },
  ],
  baq: [
    { name: 'El Prado', city: 'baq', x: 1.5, y: 3.5 },
    { name: 'Riomar', city: 'baq', x: 1, y: 7 },
    { name: 'Alto Prado', city: 'baq', x: 0.5, y: 5 },
    { name: 'Centro', city: 'sol', x: 3, y: -3.5 },
    { name: 'Boston', city: 'baq', x: 2.5, y: 4.5 },
    { name: 'La Concepción', city: 'baq', x: -1, y: 3 },
  ],
};

/** Tarifas 3PL de ejemplo en COP (antes de IVA). */
export const DEFAULT_TARIFFS: Record<ClientId, { storage: number; line: number; order: number; parcel: number; rma: number }> = {
  lir: { storage: 2100, line: 420, order: 1900, parcel: 800, rma: 5200 },
  cth: { storage: 2400, line: 480, order: 2300, parcel: 950, rma: 6800 },
  nut: { storage: 2100, line: 420, order: 1900, parcel: 800, rma: 5200 },
};

export const IVA = 0.19;
