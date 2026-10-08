/**
 * Datos de ejemplo de la demo POS. Todo es ficticio: negocios, NIT, sedes,
 * direcciones, personas, cédulas, celulares, códigos de barras (prefijo 200,
 * reservado para uso interno de la tienda) y cifras. Los precios están en COP
 * con impuestos incluidos, como se exhiben al público en Colombia.
 */

export type PresetId = 'retail' | 'restaurant';
/** iva19 / iva5: IVA; exento: excluido o exento (0 %); inc8: impuesto nacional al consumo de restaurantes. */
export type TaxKind = 'iva19' | 'iva5' | 'exento' | 'inc8';
export type Station = 'kitchen' | 'bar';
export type ModGroup = 'plate' | 'drink';
export type Role = 'cashier' | 'seller' | 'supervisor' | 'waiter' | 'cook' | 'bartender';
export type PayMethod = 'cash' | 'card' | 'qr' | 'gift';

export const TAX_RATES: Record<TaxKind, number> = { iva19: 0.19, iva5: 0.05, exento: 0, inc8: 0.08 };

export interface Product {
  id: string;
  name: string;
  /** Precio al público con impuestos incluidos (por unidad o por kg si `byWeight`). */
  price: number;
  category: string;
  emoji: string;
  tax: TaxKind;
  barcode?: string;
  byWeight?: boolean;
  station?: Station;
  mods?: ModGroup;
  happyHour?: boolean;
  /** Productos que componen el combo (se envían a su estación por separado). */
  combo?: { name: string; station: Station }[];
  /** Existencias iniciales por sede (mismo orden que `sedes`). */
  stock: [number, number, number];
  /** Umbral de alerta de existencias bajas. */
  min: number;
}

export interface Sede {
  id: string;
  name: string;
  address: string;
  /** Prefijo del documento equivalente POS de esta caja. */
  prefix: string;
  /** Siguiente consecutivo de ejemplo. */
  nextNumber: number;
  /** Ventas de hoy de las otras cajas de la sede (datos de ejemplo para la consola). */
  otherTills: { tickets: number; total: number };
}

export interface Employee {
  id: string;
  name: string;
  role: Role;
  sede: string;
  clockedIn: boolean;
  since: string;
}

export interface Customer {
  id: string;
  name: string;
  doc: string;
  phone: string;
  points: number;
}

export interface TableSeed {
  id: number;
  seats: number;
}

export interface Business {
  name: string;
  legalName: string;
  nit: string;
  resolution: string;
  invoicePrefix: string;
}

export interface Preset {
  id: PresetId;
  business: Business;
  categories: string[];
  products: Product[];
  sedes: Sede[];
  employees: Employee[];
  tables: TableSeed[];
}

/** Calcula el dígito de control EAN-13 para un código de 12 dígitos. */
function ean13(base12: string): string {
  const sum = base12.split('').reduce((s, d, i) => s + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  return base12 + ((10 - (sum % 10)) % 10);
}
const code = (n: number) => ean13('2000000' + String(n).padStart(5, '0'));

const RETAIL_PRODUCTS: Product[] = [
  { id: 'r01', name: 'Arroz blanco 1 kg', price: 5200, category: 'pantry', emoji: '🍚', tax: 'exento', barcode: code(101), stock: [64, 40, 52], min: 12 },
  { id: 'r02', name: 'Lentejas 500 g', price: 4300, category: 'pantry', emoji: '🫘', tax: 'exento', barcode: code(102), stock: [38, 22, 9], min: 10 },
  { id: 'r03', name: 'Café molido 500 g', price: 18900, category: 'pantry', emoji: '☕', tax: 'iva5', barcode: code(103), stock: [26, 7, 18], min: 8 },
  { id: 'r04', name: 'Azúcar 1 kg', price: 4900, category: 'pantry', emoji: '🧂', tax: 'iva5', barcode: code(104), stock: [45, 30, 36], min: 10 },
  { id: 'r05', name: 'Chocolate de mesa 250 g', price: 7800, category: 'pantry', emoji: '🍫', tax: 'iva5', barcode: code(105), stock: [20, 14, 11], min: 6 },
  { id: 'r06', name: 'Panela 500 g', price: 3400, category: 'pantry', emoji: '🟫', tax: 'exento', barcode: code(106), stock: [30, 25, 28], min: 8 },
  { id: 'r07', name: 'Huevos AA x 30', price: 19500, category: 'dairy', emoji: '🥚', tax: 'exento', barcode: code(107), stock: [18, 12, 5], min: 6 },
  { id: 'r08', name: 'Leche entera 1,1 L', price: 4600, category: 'dairy', emoji: '🥛', tax: 'exento', barcode: code(108), stock: [48, 36, 40], min: 12 },
  { id: 'r09', name: 'Queso campesino (kg)', price: 24000, category: 'dairy', emoji: '🧀', tax: 'exento', byWeight: true, stock: [9.5, 6, 3.2], min: 4 },
  { id: 'r10', name: 'Tomate chonto (kg)', price: 5800, category: 'produce', emoji: '🍅', tax: 'exento', byWeight: true, stock: [32, 18, 24], min: 8 },
  { id: 'r11', name: 'Papa pastusa (kg)', price: 3200, category: 'produce', emoji: '🥔', tax: 'exento', byWeight: true, stock: [60, 45, 50], min: 15 },
  { id: 'r12', name: 'Banano (kg)', price: 3900, category: 'produce', emoji: '🍌', tax: 'exento', byWeight: true, stock: [28, 4.5, 20], min: 6 },
  { id: 'r13', name: 'Agua sin gas 600 ml', price: 2300, category: 'drinks', emoji: '💧', tax: 'iva19', barcode: code(113), stock: [72, 60, 48], min: 18 },
  { id: 'r14', name: 'Detergente en polvo 1 kg', price: 12900, category: 'cleaning', emoji: '🧺', tax: 'iva19', barcode: code(114), stock: [22, 15, 6], min: 6 },
  { id: 'r15', name: 'Papel higiénico x 12', price: 21900, category: 'cleaning', emoji: '🧻', tax: 'iva19', barcode: code(115), stock: [16, 10, 12], min: 5 },
  { id: 'r16', name: 'Jabón de baño x 3', price: 8700, category: 'cleaning', emoji: '🧼', tax: 'iva19', barcode: code(116), stock: [25, 19, 14], min: 6 },
];

const RESTAURANT_PRODUCTS: Product[] = [
  { id: 'f01', name: 'Bandeja paisa', price: 38000, category: 'mains', emoji: '🍛', tax: 'inc8', station: 'kitchen', mods: 'plate', stock: [24, 30, 18], min: 6 },
  { id: 'f02', name: 'Ajiaco santafereño', price: 32000, category: 'mains', emoji: '🍲', tax: 'inc8', station: 'kitchen', mods: 'plate', stock: [20, 12, 10], min: 6 },
  { id: 'f03', name: 'Sancocho de gallina', price: 30000, category: 'mains', emoji: '🥘', tax: 'inc8', station: 'kitchen', mods: 'plate', stock: [18, 16, 22], min: 6 },
  { id: 'f04', name: 'Mojarra frita', price: 42000, category: 'mains', emoji: '🐟', tax: 'inc8', station: 'kitchen', mods: 'plate', stock: [8, 10, 14], min: 4 },
  {
    id: 'f05', name: 'Combo almuerzo: sancocho + jugo', price: 36000, category: 'mains', emoji: '🍱', tax: 'inc8', station: 'kitchen',
    combo: [{ name: 'Sancocho de gallina', station: 'kitchen' }, { name: 'Jugo de lulo en agua', station: 'bar' }],
    stock: [15, 15, 15], min: 5,
  },
  { id: 'f06', name: 'Arepa de huevo', price: 9000, category: 'starters', emoji: '🫓', tax: 'inc8', station: 'kitchen', stock: [30, 26, 40], min: 8 },
  { id: 'f07', name: 'Empanadas x 3', price: 10500, category: 'starters', emoji: '🥟', tax: 'inc8', station: 'kitchen', stock: [36, 40, 28], min: 8 },
  { id: 'f08', name: 'Patacón con hogao', price: 12000, category: 'starters', emoji: '🍌', tax: 'inc8', station: 'kitchen', stock: [25, 20, 5], min: 6 },
  { id: 'f09', name: 'Jugo de lulo en agua', price: 8000, category: 'drinks', emoji: '🧃', tax: 'inc8', station: 'bar', mods: 'drink', stock: [40, 35, 30], min: 10 },
  { id: 'f10', name: 'Limonada de coco', price: 12000, category: 'drinks', emoji: '🥥', tax: 'inc8', station: 'bar', mods: 'drink', stock: [30, 28, 25], min: 8 },
  { id: 'f11', name: 'Tinto', price: 3500, category: 'drinks', emoji: '☕', tax: 'inc8', station: 'bar', stock: [80, 90, 70], min: 15 },
  { id: 'f12', name: 'Aguapanela con queso', price: 7000, category: 'drinks', emoji: '🍵', tax: 'inc8', station: 'bar', stock: [30, 25, 20], min: 8 },
  { id: 'f13', name: 'Cerveza nacional', price: 9000, category: 'drinks', emoji: '🍺', tax: 'inc8', station: 'bar', happyHour: true, stock: [48, 7, 36], min: 12 },
  { id: 'f14', name: 'Postre de natas', price: 11000, category: 'desserts', emoji: '🍮', tax: 'inc8', station: 'kitchen', stock: [12, 9, 6], min: 4 },
  { id: 'f15', name: 'Arroz con leche', price: 9500, category: 'desserts', emoji: '🍚', tax: 'inc8', station: 'kitchen', stock: [15, 14, 12], min: 4 },
  { id: 'f16', name: 'Brevas con arequipe', price: 10000, category: 'desserts', emoji: '🍯', tax: 'inc8', station: 'kitchen', stock: [10, 3, 9], min: 4 },
];

const emp = (id: string, name: string, role: Role, sede: string, clockedIn: boolean, since: string): Employee => ({
  id, name, role, sede, clockedIn, since,
});

export const PRESETS: Record<PresetId, Preset> = {
  retail: {
    id: 'retail',
    business: {
      name: 'Mercado La Ceiba',
      legalName: 'Comercializadora La Ceiba S.A.S.',
      nit: '901.482.736-8',
      resolution: '18760000012345',
      invoicePrefix: 'FELC',
    },
    categories: ['pantry', 'dairy', 'produce', 'drinks', 'cleaning'],
    products: RETAIL_PRODUCTS,
    sedes: [
      { id: 'lc-chapinero', name: 'Bogotá · Chapinero', address: 'Cra. 13 # 54-21, Bogotá', prefix: 'LC1', nextNumber: 4821, otherTills: { tickets: 46, total: 2184300 } },
      { id: 'lc-suba', name: 'Bogotá · Suba', address: 'Av. Calle 145 # 91-19, Bogotá', prefix: 'LC2', nextNumber: 2310, otherTills: { tickets: 31, total: 1402800 } },
      { id: 'lc-laureles', name: 'Medellín · Laureles', address: 'Cra. 76 # 33-12, Medellín', prefix: 'LC3', nextNumber: 1765, otherTills: { tickets: 39, total: 1876500 } },
    ],
    employees: [
      emp('e-r1', 'Sofía Pardo', 'cashier', 'lc-chapinero', true, '07:00'),
      emp('e-r2', 'Camila Ortiz', 'seller', 'lc-chapinero', true, '07:30'),
      emp('e-r3', 'Mateo Salcedo', 'seller', 'lc-chapinero', false, '—'),
      emp('e-r4', 'Julián Vargas', 'supervisor', 'lc-chapinero', true, '06:45'),
      emp('e-r5', 'Daniela Muñoz', 'cashier', 'lc-suba', true, '07:00'),
      emp('e-r6', 'Kevin Arango', 'seller', 'lc-suba', true, '08:00'),
      emp('e-r7', 'Luisa Becerra', 'seller', 'lc-suba', false, '—'),
      emp('e-r8', 'Óscar Rincón', 'supervisor', 'lc-suba', true, '06:50'),
      emp('e-r9', 'Natalia Restrepo', 'cashier', 'lc-laureles', true, '07:15'),
      emp('e-r10', 'Santiago Henao', 'seller', 'lc-laureles', true, '07:45'),
      emp('e-r11', 'Manuela Zapata', 'seller', 'lc-laureles', false, '—'),
      emp('e-r12', 'Carlos Mejía', 'supervisor', 'lc-laureles', true, '06:30'),
    ],
    tables: [],
  },
  restaurant: {
    id: 'restaurant',
    business: {
      name: 'Fogón Andino',
      legalName: 'Fogón Andino Restaurantes S.A.S.',
      nit: '901.563.204-1',
      resolution: '18760000067890',
      invoicePrefix: 'FEFA',
    },
    categories: ['mains', 'starters', 'drinks', 'desserts'],
    products: RESTAURANT_PRODUCTS,
    sedes: [
      { id: 'fa-usaquen', name: 'Bogotá · Usaquén', address: 'Cl. 119 # 6-24, Bogotá', prefix: 'FA1', nextNumber: 3307, otherTills: { tickets: 28, total: 2964000 } },
      { id: 'fa-poblado', name: 'Medellín · El Poblado', address: 'Cra. 37 # 8A-30, Medellín', prefix: 'FA2', nextNumber: 5120, otherTills: { tickets: 35, total: 3588500 } },
      { id: 'fa-granada', name: 'Cali · Granada', address: 'Av. 9N # 12-18, Cali', prefix: 'FA3', nextNumber: 1984, otherTills: { tickets: 22, total: 2101000 } },
    ],
    employees: [
      emp('e-f1', 'Paula Guerrero', 'cashier', 'fa-usaquen', true, '11:00'),
      emp('e-f2', 'Ana Martínez', 'waiter', 'fa-usaquen', true, '11:00'),
      emp('e-f3', 'Luis Gómez', 'waiter', 'fa-usaquen', true, '11:30'),
      emp('e-f4', 'Diego Ruiz', 'cook', 'fa-usaquen', true, '10:00'),
      emp('e-f5', 'Felipe Castro', 'bartender', 'fa-usaquen', false, '—'),
      emp('e-f6', 'Laura Cardona', 'cashier', 'fa-poblado', true, '11:00'),
      emp('e-f7', 'Jhon Ospina', 'waiter', 'fa-poblado', true, '11:00'),
      emp('e-f8', 'Valeria Giraldo', 'waiter', 'fa-poblado', false, '—'),
      emp('e-f9', 'Esteban Arias', 'cook', 'fa-poblado', true, '10:00'),
      emp('e-f10', 'Sara Montoya', 'bartender', 'fa-poblado', true, '11:00'),
      emp('e-f11', 'Marcela Lozano', 'cashier', 'fa-granada', true, '11:15'),
      emp('e-f12', 'Brayan Mosquera', 'waiter', 'fa-granada', true, '11:15'),
      emp('e-f13', 'Yuliana Caicedo', 'waiter', 'fa-granada', true, '12:00'),
      emp('e-f14', 'Hernán Valencia', 'cook', 'fa-granada', true, '10:30'),
      emp('e-f15', 'Tatiana Rivas', 'bartender', 'fa-granada', false, '—'),
    ],
    tables: [
      { id: 1, seats: 2 }, { id: 2, seats: 2 }, { id: 3, seats: 4 }, { id: 4, seats: 4 }, { id: 5, seats: 4 },
      { id: 6, seats: 4 }, { id: 7, seats: 6 }, { id: 8, seats: 6 }, { id: 9, seats: 8 }, { id: 10, seats: 2 },
    ],
  },
};

/** Clientes frecuentes de ejemplo (cada negocio tiene su propia copia de puntos). */
export const SEED_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Valentina Rojas', doc: '52384917', phone: '3001234567', points: 5420 },
  { id: 'c2', name: 'Jorge Castañeda', doc: '79615204', phone: '3159876543', points: 1860 },
  { id: 'c3', name: 'Luz Marina Pérez', doc: '41927380', phone: '3104567890', points: 640 },
  { id: 'c4', name: 'Andrés Felipe Gil', doc: '1020734851', phone: '3202223344', points: 2150 },
  { id: 'c5', name: 'Carolina Muñoz', doc: '1152468903', phone: '3017654321', points: 320 },
];

/** Bonos de regalo de ejemplo con su saldo. */
export const SEED_GIFT_CARDS: Record<string, number> = { BONO50: 50000, BONO20: 20000 };

/** Pedidos abiertos de ejemplo por mesa (iguales en las tres sedes del restaurante). */
export const SEED_TABLE_ORDERS: {
  table: number;
  waiterIdx: number;
  guests: number;
  billRequested?: boolean;
  lines: { productId: string; qty: number; note?: string }[];
}[] = [
  { table: 3, waiterIdx: 0, guests: 3, lines: [{ productId: 'f02', qty: 2, note: 'Sin alcaparras' }, { productId: 'f10', qty: 2 }] },
  { table: 5, waiterIdx: 1, guests: 4, lines: [{ productId: 'f07', qty: 1 }, { productId: 'f03', qty: 2 }, { productId: 'f09', qty: 2 }] },
  { table: 7, waiterIdx: 0, guests: 2, billRequested: true, lines: [{ productId: 'f01', qty: 1 }, { productId: 'f13', qty: 2 }] },
];

/** Estado de cocina de los pedidos de ejemplo: minutos transcurridos y estado por estación. */
export const SEED_KDS: { table: number; station: Station; ageMin: number; status: 'new' | 'preparing' | 'ready' }[] = [
  { table: 3, station: 'kitchen', ageMin: 9, status: 'preparing' },
  { table: 3, station: 'bar', ageMin: 9, status: 'ready' },
  { table: 5, station: 'kitchen', ageMin: 2, status: 'new' },
  { table: 5, station: 'bar', ageMin: 2, status: 'preparing' },
];

/** Puntos: se acumulan por cada $1.000 pagados y se canjean en bloques. */
export const POINTS = {
  perThousand: { bronze: 1, silver: 1.5, gold: 2 } as Record<'bronze' | 'silver' | 'gold', number>,
  blockPoints: 500,
  blockValue: 5000,
  silverFrom: 1500,
  goldFrom: 5000,
};

/** Base de caja sugerida al abrir el turno. */
export const DEFAULT_BASE = 200000;
/** Comisión de asesores de venta (retail) sobre la base sin impuestos. */
export const SELLER_COMMISSION = 0.015;
/** Descuento de la hora feliz. */
export const HAPPY_HOUR_OFF = 0.2;
/** Lecturas simuladas de la balanza, en kg (se recorren en orden). */
export const SCALE_READINGS = [0.735, 1.25, 0.48, 2.105, 0.92];
