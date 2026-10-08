/**
 * Datos maestros de ejemplo: un grupo empresarial FICTICIO de Colombia.
 * Ningún nombre corresponde a una marca o persona real; los NIT son inventados
 * (el dígito de verificación se calcula con el algoritmo de la DIAN).
 */
import type { Bom, Customer, Employee, Item, Supplier, WarehouseId } from './types';

/** Fecha de trabajo de la demo: las operaciones nuevas se registran con esta fecha. */
export const WORK_DATE = '2026-09-30';
export const OPEN_MONTH = '2026-09';
/** Monto (IVA incluido) desde el cual una OC requiere aprobación de Gerencia. */
export const PO_LEVEL2_THRESHOLD = 20_000_000;
/** Retención en la fuente por compras (tarifa de ejemplo). */
export const PURCHASE_WITHHOLDING = 0.025;
/** Factores de nómina de ejemplo. */
export const PAYROLL_EMPLOYER_FACTOR = 0.3002;
export const PAYROLL_BENEFITS_FACTOR = 0.2183;
/** Tarifa de renta usada para la provisión estimada del estado de resultados. */
export const INCOME_TAX_RATE = 0.35;

export const COMPANIES = {
  com: { name: 'Surtidora Montevera S.A.S.', short: 'Montevera', nit: '901482337', city: 'Bogotá' },
  log: { name: 'Montevera Logística S.A.S.', short: 'Montevera Logística', nit: '901519064', city: 'Bogotá' },
} as const;

export const WAREHOUSES: WarehouseId[] = ['bog', 'med', 'baq'];

export const ITEMS: Item[] = [
  { sku: 'ARR-5K', name: 'Arroz blanco 5 kg', nameEn: 'White rice 5 kg', unit: 'und', kind: 'merch', vat: 0, price: 19400, cost: 15200, supplierId: 'S1', reorder: { bog: 1600, med: 960, baq: 960 }, target: { bog: 4000, med: 2400, baq: 2400 } },
  { sku: 'LEN-500', name: 'Lenteja 500 g', nameEn: 'Lentils 500 g', unit: 'und', kind: 'merch', vat: 0, price: 4900, cost: 3700, supplierId: 'S4', reorder: { bog: 3600, med: 2160, baq: 2160 }, target: { bog: 9000, med: 5400, baq: 5400 } },
  { sku: 'AZU-25', name: 'Azúcar blanca 2,5 kg', nameEn: 'White sugar 2.5 kg', unit: 'und', kind: 'merch', vat: 5, price: 11600, cost: 9000, supplierId: 'S2', reorder: { bog: 2400, med: 1440, baq: 1440 }, target: { bog: 6000, med: 3600, baq: 3600 } },
  { sku: 'ACE-3L', name: 'Aceite vegetal 3 L', nameEn: 'Vegetable oil 3 L', unit: 'und', kind: 'merch', vat: 5, price: 26900, cost: 21000, supplierId: 'S3', reorder: { bog: 1200, med: 720, baq: 720 }, target: { bog: 3000, med: 1800, baq: 1800 } },
  { sku: 'HAR-1K', name: 'Harina de trigo 1 kg', nameEn: 'Wheat flour 1 kg', unit: 'und', kind: 'merch', vat: 5, price: 3950, cost: 3000, supplierId: 'S1', reorder: { bog: 4800, med: 2880, baq: 2880 }, target: { bog: 12000, med: 7200, baq: 7200 } },
  { sku: 'DET-3K', name: 'Detergente en polvo 3 kg', nameEn: 'Laundry powder 3 kg', unit: 'und', kind: 'merch', vat: 19, price: 31500, cost: 23800, supplierId: 'S5', reorder: { bog: 960, med: 580, baq: 580 }, target: { bog: 2400, med: 1440, baq: 1440 } },
  { sku: 'BOL-30', name: 'Bolsas de basura x 30', nameEn: 'Trash bags x 30', unit: 'und', kind: 'merch', vat: 19, price: 6900, cost: 5000, supplierId: 'S6', reorder: { bog: 3200, med: 1920, baq: 1920 }, target: { bog: 8000, med: 4800, baq: 4800 } },
  { sku: 'LIM-1L', name: 'Limpiador multiusos 1 L', nameEn: 'All-purpose cleaner 1 L', unit: 'und', kind: 'merch', vat: 19, price: 8400, cost: 6100, supplierId: 'S5', reorder: { bog: 2400, med: 1440, baq: 1440 }, target: { bog: 6000, med: 3600, baq: 3600 } },
  { sku: 'JAB-3', name: 'Jabón de tocador x 3', nameEn: 'Bath soap x 3', unit: 'und', kind: 'merch', vat: 19, price: 9800, cost: 7200, supplierId: 'S5', reorder: { bog: 2000, med: 1200, baq: 1200 }, target: { bog: 5000, med: 3000, baq: 3000 } },
  { sku: 'ESP-6', name: 'Esponjas de cocina x 6', nameEn: 'Kitchen sponges x 6', unit: 'und', kind: 'merch', vat: 19, price: 6200, cost: 4400, supplierId: 'S6', reorder: { bog: 2400, med: 1440, baq: 1440 }, target: { bog: 6000, med: 3600, baq: 3600 } },
  { sku: 'CAF-500', name: 'Café tostado molido 500 g', nameEn: 'Ground roasted coffee 500 g', unit: 'und', kind: 'finished', vat: 5, price: 21500, cost: 13950, reorder: { bog: 1200, med: 720, baq: 720 }, target: { bog: 3000, med: 1800, baq: 1800 } },
  { sku: 'PAN-1K', name: 'Panela pulverizada 1 kg', nameEn: 'Powdered panela 1 kg', unit: 'und', kind: 'finished', vat: 0, price: 5600, cost: 3870, reorder: { bog: 3200, med: 1920, baq: 1920 }, target: { bog: 8000, med: 4800, baq: 4800 } },
  { sku: 'MP-CVE', name: 'Café verde excelso (kg)', nameEn: 'Green coffee, excelso (kg)', unit: 'kg', kind: 'raw', vat: 0, price: 0, cost: 22000, supplierId: 'S7', reorder: { bog: 1400 }, target: { bog: 3600 } },
  { sku: 'MP-PAN', name: 'Panela en bloque (kg)', nameEn: 'Block panela (kg)', unit: 'kg', kind: 'raw', vat: 0, price: 0, cost: 3600, supplierId: 'S2', reorder: { bog: 5600 }, target: { bog: 14000 } },
  { sku: 'EM-BV5', name: 'Bolsa con válvula 500 g', nameEn: 'Valve bag 500 g', unit: 'und', kind: 'raw', vat: 19, price: 0, cost: 650, supplierId: 'S6', reorder: { bog: 2400 }, target: { bog: 6000 } },
  { sku: 'EM-B1K', name: 'Bolsa para panela 1 kg', nameEn: 'Panela bag 1 kg', unit: 'und', kind: 'raw', vat: 19, price: 0, cost: 180, supplierId: 'S6', reorder: { bog: 6000 }, target: { bog: 15000 } },
  { sku: 'EM-ETQ', name: 'Etiqueta café 500 g', nameEn: 'Coffee label 500 g', unit: 'und', kind: 'raw', vat: 19, price: 0, cost: 120, supplierId: 'S6', reorder: { bog: 2400 }, target: { bog: 6000 } },
  { sku: 'SRV-ALM', name: 'Almacenamiento (posición de estiba-mes)', nameEn: 'Storage (pallet position-month)', unit: 'und', kind: 'service', vat: 19, price: 42000, cost: 0, reorder: {}, target: {} },
  { sku: 'SRV-ALI', name: 'Alistamiento de pedidos (por pedido)', nameEn: 'Order picking (per order)', unit: 'und', kind: 'service', vat: 19, price: 3200, cost: 0, reorder: {}, target: {} },
];

export const ITEM_BY_SKU: Record<string, Item> = Object.fromEntries(ITEMS.map((i) => [i.sku, i]));

export const BOMS: Bom[] = [
  {
    sku: 'CAF-500',
    components: [
      {
        sku: 'CAF-TOS',
        qty: 0.5,
        // Subensamble fantasma: 1 kg de café tostado requiere 1,19 kg de café verde (merma de tostión)
        phantom: {
          name: 'Café tostado en grano (kg)',
          nameEn: 'Roasted coffee beans (kg)',
          unit: 'kg',
          qty: 0.5,
          components: [{ sku: 'MP-CVE', qty: 1.19 }],
        },
      },
      { sku: 'EM-BV5', qty: 1 },
      { sku: 'EM-ETQ', qty: 1 },
    ],
  },
  {
    sku: 'PAN-1K',
    components: [
      { sku: 'MP-PAN', qty: 1.02 },
      { sku: 'EM-B1K', qty: 1 },
    ],
  },
];

/** Componentes de materia prima por unidad (explota los subensambles fantasma). */
export function explodeBom(sku: string): { sku: string; qty: number }[] {
  const bom = BOMS.find((b) => b.sku === sku);
  if (!bom) return [];
  const out: Record<string, number> = {};
  const walk = (comps: Bom['components'], factor: number) => {
    for (const c of comps) {
      if (c.phantom) walk(c.phantom.components, factor * c.phantom.qty);
      else out[c.sku] = (out[c.sku] || 0) + c.qty * factor;
    }
  };
  walk(bom.components, 1);
  return Object.entries(out).map(([k, q]) => ({ sku: k, qty: Math.round(q * 10000) / 10000 }));
}

export const CUSTOMERS: Customer[] = [
  { id: 'C01', name: 'Autoservicio Los Almendros S.A.S.', nit: '900736215', city: 'Bogotá', warehouse: 'bog', termDays: 30, phone: '+57 300 555 0101', payer: 'punctual', companies: ['com', 'log'] },
  { id: 'C02', name: 'Supermercado La Colina S.A.S.', nit: '901204588', city: 'Bogotá', warehouse: 'bog', termDays: 30, phone: '+57 300 555 0102', payer: 'punctual', companies: ['com'] },
  { id: 'C03', name: 'Minimercado El Portal S.A.S.', nit: '901377410', city: 'Soacha', warehouse: 'bog', termDays: 30, phone: '+57 300 555 0103', payer: 'late', companies: ['com'] },
  { id: 'C04', name: 'Casino Industrial Fontibón S.A.S.', nit: '900958132', city: 'Bogotá', warehouse: 'bog', termDays: 45, phone: '+57 300 555 0104', payer: 'punctual', companies: ['com'] },
  { id: 'C05', name: 'Autoservicio Laureles S.A.S.', nit: '901066794', city: 'Medellín', warehouse: 'med', termDays: 30, phone: '+57 300 555 0105', payer: 'punctual', companies: ['com'] },
  { id: 'C06', name: 'Tiendas El Vecino Itagüí S.A.S.', nit: '901290356', city: 'Itagüí', warehouse: 'med', termDays: 30, phone: '+57 300 555 0106', payer: 'slow', companies: ['com'] },
  { id: 'C07', name: 'Comercializadora Costa Brisa S.A.S.', nit: '900845603', city: 'Barranquilla', warehouse: 'baq', termDays: 60, phone: '+57 300 555 0107', payer: 'late', companies: ['com', 'log'] },
  { id: 'C08', name: 'Supermercado El Prado S.A.S.', nit: '901118427', city: 'Barranquilla', warehouse: 'baq', termDays: 30, phone: '+57 300 555 0108', payer: 'punctual', companies: ['com'] },
  { id: 'C09', name: 'Hotel Mirador del Río S.A.S.', nit: '900677941', city: 'Soledad', warehouse: 'baq', termDays: 30, phone: '+57 300 555 0109', payer: 'slow', companies: ['com'] },
  { id: 'C10', name: 'Importadora Ruta Norte S.A.S.', nit: '901433902', city: 'Bogotá', warehouse: 'bog', termDays: 30, phone: '+57 300 555 0110', payer: 'punctual', companies: ['log'] },
];

export const CUSTOMER_BY_ID: Record<string, Customer> = Object.fromEntries(CUSTOMERS.map((c) => [c.id, c]));

export const SUPPLIERS: Supplier[] = [
  { id: 'S1', name: 'Molinos del Llano S.A.S.', nit: '900514276', city: 'Villavicencio', termDays: 30 },
  { id: 'S2', name: 'Agroindustrial El Trapiche S.A.S.', nit: '900623819', city: 'Palmira', termDays: 30 },
  { id: 'S3', name: 'Oleaginosas del Caribe S.A.S.', nit: '901027345', city: 'Santa Marta', termDays: 30 },
  { id: 'S4', name: 'Granos y Legumbres Andinas S.A.S.', nit: '901155630', city: 'Bogotá', termDays: 30 },
  { id: 'S5', name: 'Químicos de Aseo Sabana S.A.S.', nit: '900892157', city: 'Funza', termDays: 45 },
  { id: 'S6', name: 'Plásticos y Empaques Tequendama S.A.S.', nit: '901340718', city: 'Soacha', termDays: 30 },
  { id: 'S7', name: 'Trilladora El Cafetal S.A.S.', nit: '900781463', city: 'Armenia', termDays: 15 },
];

export const SUPPLIER_BY_ID: Record<string, Supplier> = Object.fromEntries(SUPPLIERS.map((s) => [s.id, s]));

export const EMPLOYEES: Employee[] = [
  { id: 'E01', name: 'Andrés Cárdenas', position: 'Gerente general', positionEn: 'General manager', dept: 'management', company: 'com', salary: 14_500_000, city: 'Bogotá' },
  { id: 'E02', name: 'Laura Pineda', position: 'Contadora', positionEn: 'Accountant', dept: 'finance', company: 'com', salary: 7_200_000, city: 'Bogotá' },
  { id: 'E03', name: 'Valentina Herrera', position: 'Auxiliar contable', positionEn: 'Accounting assistant', dept: 'finance', company: 'com', salary: 2_600_000, city: 'Bogotá' },
  { id: 'E04', name: 'Diana Rojas', position: 'Analista de cartera', positionEn: 'Collections analyst', dept: 'finance', company: 'com', salary: 3_100_000, city: 'Bogotá' },
  { id: 'E05', name: 'Paula Restrepo', position: 'Jefe de compras', positionEn: 'Purchasing manager', dept: 'purchasing', company: 'com', salary: 6_400_000, city: 'Bogotá' },
  { id: 'E06', name: 'Carlos Mejía', position: 'Ejecutivo comercial', positionEn: 'Sales executive', dept: 'sales', company: 'com', salary: 3_800_000, city: 'Bogotá' },
  { id: 'E07', name: 'Natalia Ospina', position: 'Ejecutiva comercial', positionEn: 'Sales executive', dept: 'sales', company: 'com', salary: 3_800_000, city: 'Medellín' },
  { id: 'E08', name: 'Ricardo Pertuz', position: 'Ejecutivo comercial', positionEn: 'Sales executive', dept: 'sales', company: 'com', salary: 3_800_000, city: 'Barranquilla' },
  { id: 'E09', name: 'Juan Camilo Ortiz', position: 'Jefe de bodega', positionEn: 'Warehouse lead', dept: 'warehouse', company: 'com', salary: 4_200_000, city: 'Bogotá' },
  { id: 'E10', name: 'Jorge Iván Arango', position: 'Jefe de bodega', positionEn: 'Warehouse lead', dept: 'warehouse', company: 'com', salary: 3_900_000, city: 'Itagüí' },
  { id: 'E11', name: 'Luis Fernando Barrios', position: 'Jefe de bodega', positionEn: 'Warehouse lead', dept: 'warehouse', company: 'com', salary: 3_900_000, city: 'Barranquilla' },
  { id: 'E12', name: 'Mauricio Peña', position: 'Auxiliar de bodega', positionEn: 'Warehouse assistant', dept: 'warehouse', company: 'com', salary: 1_950_000, city: 'Bogotá' },
  { id: 'E13', name: 'Santiago Gil', position: 'Operario de tostión', positionEn: 'Roasting operator', dept: 'production', company: 'com', salary: 2_100_000, city: 'Bogotá' },
  { id: 'E14', name: 'Yesenia Mosquera', position: 'Operaria de empaque', positionEn: 'Packing operator', dept: 'production', company: 'com', salary: 1_950_000, city: 'Bogotá' },
  { id: 'E15', name: 'Camila Torres', position: 'Analista de talento humano', positionEn: 'HR analyst', dept: 'people', company: 'com', salary: 3_400_000, city: 'Bogotá' },
  { id: 'E16', name: 'Sergio Vargas', position: 'Coordinador logístico', positionEn: 'Logistics coordinator', dept: 'operations', company: 'log', salary: 5_200_000, city: 'Bogotá' },
  { id: 'E17', name: 'Daniela Quintero', position: 'Auxiliar de almacenamiento', positionEn: 'Storage assistant', dept: 'operations', company: 'log', salary: 2_050_000, city: 'Bogotá' },
  { id: 'E18', name: 'Héctor Salazar', position: 'Operador de montacargas', positionEn: 'Forklift operator', dept: 'operations', company: 'log', salary: 2_300_000, city: 'Bogotá' },
  { id: 'E19', name: 'Lina Marín', position: 'Asistente administrativa', positionEn: 'Administrative assistant', dept: 'finance', company: 'log', salary: 2_700_000, city: 'Bogotá' },
  { id: 'E20', name: 'Kevin Moreno', position: 'Auxiliar de alistamiento', positionEn: 'Picking assistant', dept: 'operations', company: 'log', salary: 1_950_000, city: 'Bogotá' },
];

export const EMPLOYEE_BY_ID: Record<string, Employee> = Object.fromEntries(EMPLOYEES.map((e) => [e.id, e]));

/** Cuentas del PUC (Decreto 2650 de 1993) usadas en la demo. */
export const ACCOUNTS = [
  '1105', '1110', '1305', '1405', '1410', '1430', '1435', '1520', '1524', '1540', '1592',
  '2205', '2365', '2408', '2610', '2805',
  '3105', '3705',
  '4120', '4135', '4145', '4175',
  '5105', '5115', '5120', '5135', '5145', '5160', '5195', '5305',
  '6120', '6135', '6145',
] as const;

/** Cuentas de inventario y costo según el tipo de ítem. */
export const INVENTORY_ACCOUNT: Record<string, string> = { merch: '1435', finished: '1430', raw: '1405' };
export const COST_ACCOUNT: Record<string, string> = { merch: '6135', finished: '6120', service: '6145' };
export const REVENUE_ACCOUNT: Record<string, string> = { merch: '4135', finished: '4120', service: '4145' };

/** Cuenta del gasto por tipo de causación. */
export const EXPENSE_ACCOUNT: Record<string, string> = {
  rent: '5120',
  utilities: '5135',
  maintenance: '5145',
  depreciation: '5160',
  bankFee: '5305',
  gmf: '5115',
  opCost: '6145',
};

/** Prefijo de factura electrónica por empresa (resolución de ejemplo). */
export const INVOICE_PREFIX: Record<string, string> = { com: 'SMV', log: 'MLG' };
