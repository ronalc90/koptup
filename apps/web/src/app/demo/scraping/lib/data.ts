/**
 * Datos de ejemplo de la demo. Empresa, entidades, tiendas, proveedores,
 * documentos y cifras son ficticios; las tiendas usan dominios `.example`
 * (reservados para ejemplos, no existen). Fecha de corte: 8 oct. 2026.
 */
import type { SchedulePreset } from './cron';
import type { DocsConfig, Field, NormativaConfig, RadarConfig, Rule, SourceId, SourceKind } from './types';

export const COMPANY = {
  name: 'Suministros Demo del Café S.A.S.',
  nit: '901482736',
  city: 'Pereira, Risaralda',
};

export interface SourceMeta {
  id: SourceId;
  kind: SourceKind;
  /** Origen técnico mostrado en la ficha (texto de ejemplo, no se consulta). */
  origin: string;
  /** Serie de registros de las 13 ejecuciones diarias anteriores (25 sept. – 7 oct.). */
  series: number[];
  defaultPreset: SchedulePreset;
}

export const SOURCES: SourceMeta[] = [
  { id: 'contratacion', kind: 'api', origin: 'datos-abiertos.example/api/procesos', series: [1, 1, 1, 2, 2, 3, 4, 4, 4, 4, 4, 5, 5], defaultPreset: 'daily6' },
  { id: 'precios', kind: 'web', origin: 'la-tuerca.example · el-martillo.example · casa-del-tornillo.example', series: [15, 15, 15, 15, 15, 16, 16, 16, 16, 16, 16, 16, 16], defaultPreset: 'daily6' },
  { id: 'normativa', kind: 'web', origin: 'normas-demo.example/novedades', series: [2, 2, 2, 2, 3, 3, 4, 4, 4, 4, 5, 5, 5], defaultPreset: 'daily6' },
  { id: 'documentos', kind: 'documents', origin: 'Carpeta compartida «Proveedores/Documentos» (ejemplo)', series: [0, 0, 0, 0, 1, 1, 2, 2, 2, 3, 3, 3, 3], defaultPreset: 'daily6' },
];

export const SOURCE_IDS: SourceId[] = SOURCES.map((s) => s.id);

export function sourceMeta(id: SourceId): SourceMeta {
  return SOURCES.find((s) => s.id === id) ?? SOURCES[0];
}

// ---------------------------------------------------------------------------
// 1. Radar de contratación pública (simulado: en la demo se lee este arreglo)
// ---------------------------------------------------------------------------

export type Modality = 'minima' | 'abreviada' | 'licitacion' | 'directa';

export interface Process {
  ref: string;
  entity: string;
  object: string;
  modality: Modality;
  department: string;
  city: string;
  amount: number;
  published: string;
  closes: string;
  status: 'open' | 'closed';
}

export const DEPARTMENTS = ['Risaralda', 'Caldas', 'Quindío', 'Antioquia', 'Valle del Cauca'];

const P_YESTERDAY: Process[] = [
  { ref: 'PROC-26-0371', entity: 'Gobernación Demo del Eje', object: 'Suministro de elementos de ferretería y herramientas para el mantenimiento de vías terciarias', modality: 'abreviada', department: 'Risaralda', city: 'Pereira', amount: 486_200_000, published: '2026-09-28', closes: '2026-10-15', status: 'open' },
  { ref: 'PROC-26-0384', entity: 'Hospital Departamental Ejemplo', object: 'Compra de pintura epóxica y materiales para la adecuación del área de urgencias', modality: 'minima', department: 'Caldas', city: 'Manizales', amount: 74_800_000, published: '2026-09-30', closes: '2026-10-09', status: 'open' },
  { ref: 'PROC-26-0390', entity: 'Empresa de Servicios Públicos Demo E.S.P.', object: 'Suministro de tubería, válvulas y accesorios para redes de acueducto', modality: 'licitacion', department: 'Quindío', city: 'Armenia', amount: 1_385_000_000, published: '2026-09-22', closes: '2026-10-07', status: 'open' },
  { ref: 'PROC-26-0402', entity: 'Universidad Pública Ejemplo', object: 'Servicio de vigilancia y seguridad privada para las sedes', modality: 'licitacion', department: 'Antioquia', city: 'Medellín', amount: 2_140_000_000, published: '2026-09-25', closes: '2026-10-20', status: 'open' },
  { ref: 'PROC-26-0408', entity: 'Corporación Autónoma Demo del Río', object: 'Suministro de herramientas de mano y equipos para brigadas forestales', modality: 'minima', department: 'Risaralda', city: 'Dosquebradas', amount: 42_300_000, published: '2026-10-01', closes: '2026-10-14', status: 'open' },
  { ref: 'PROC-26-0415', entity: 'Terminal de Transporte Demo S.A.', object: 'Suministro de materiales eléctricos para el cambio de luminarias', modality: 'minima', department: 'Caldas', city: 'Manizales', amount: 18_900_000, published: '2026-10-02', closes: '2026-10-12', status: 'open' },
  { ref: 'PROC-26-0421', entity: 'Empresa Social del Estado Demo Salud', object: 'Suministro de alimentos para pacientes hospitalizados', modality: 'abreviada', department: 'Quindío', city: 'Calarcá', amount: 356_000_000, published: '2026-10-05', closes: '2026-10-19', status: 'open' },
  { ref: 'PROC-26-0433', entity: 'Alcaldía Demo de Villa Montaña', object: 'Compra de materiales de ferretería para el programa de mejoramiento de vivienda', modality: 'abreviada', department: 'Valle del Cauca', city: 'Tuluá', amount: 728_000_000, published: '2026-10-06', closes: '2026-10-23', status: 'open' },
  { ref: 'PROC-26-0437', entity: 'Secretaría de Educación Demo', object: 'Suministro de pintura y elementos de ferretería para instituciones educativas', modality: 'minima', department: 'Antioquia', city: 'Rionegro', amount: 61_500_000, published: '2026-10-06', closes: '2026-10-16', status: 'open' },
];

const P_NEW_TODAY: Process[] = [
  { ref: 'PROC-26-0446', entity: 'Universidad Pública Ejemplo', object: 'Suministro de herramientas y materiales de ferretería para el mantenimiento de sedes', modality: 'abreviada', department: 'Antioquia', city: 'Medellín', amount: 684_500_000, published: '2026-10-08', closes: '2026-10-22', status: 'open' },
  { ref: 'PROC-26-0449', entity: 'Instituto Demo de Vías Departamentales', object: 'Suministro de materiales eléctricos y luminarias para túneles viales', modality: 'licitacion', department: 'Antioquia', city: 'Santa Fe de Antioquia', amount: 1_240_000_000, published: '2026-10-08', closes: '2026-10-30', status: 'open' },
  { ref: 'PROC-26-0451', entity: 'Colegio Oficial Ejemplo La Esperanza', object: 'Compra de pintura y elementos de ferretería para el mantenimiento de aulas', modality: 'minima', department: 'Risaralda', city: 'Santa Rosa de Cabal', amount: 38_700_000, published: '2026-10-08', closes: '2026-10-13', status: 'open' },
  { ref: 'PROC-26-0453', entity: 'Aeropuerto Regional Ejemplo', object: 'Suministro de tubería y accesorios en PVC para redes sanitarias', modality: 'abreviada', department: 'Valle del Cauca', city: 'Cartago', amount: 512_000_000, published: '2026-10-08', closes: '2026-10-26', status: 'open' },
  { ref: 'PROC-26-0455', entity: 'Secretaría de Infraestructura Demo', object: 'Suministro de herramientas menores y equipos de ferretería para cuadrillas de obra', modality: 'abreviada', department: 'Antioquia', city: 'Envigado', amount: 596_300_000, published: '2026-10-08', closes: '2026-10-27', status: 'open' },
  { ref: 'PROC-26-0458', entity: 'Concejo Municipal Demo', object: 'Servicio de aseo y cafetería', modality: 'minima', department: 'Caldas', city: 'Chinchiná', amount: 64_000_000, published: '2026-10-08', closes: '2026-10-15', status: 'open' },
];

export const PROCESSES_YESTERDAY: Process[] = P_YESTERDAY;
export const PROCESSES_TODAY: Process[] = [
  ...P_YESTERDAY.map((p) => {
    if (p.ref === 'PROC-26-0390') return { ...p, status: 'closed' as const };
    if (p.ref === 'PROC-26-0408') return { ...p, closes: '2026-10-21' };
    return p;
  }),
  ...P_NEW_TODAY,
];

export const DEFAULT_RADAR: RadarConfig = {
  keywords: ['ferretería', 'herramientas', 'pintura', 'materiales eléctricos', 'tubería'],
  departments: ['Risaralda', 'Caldas', 'Quindío', 'Antioquia'],
  minAmount: 20_000_000,
};

// ---------------------------------------------------------------------------
// 2. Precios de la competencia: 3 tiendas ficticias servidas por la demo
// ---------------------------------------------------------------------------

export interface Store { id: 'a' | 'b' | 'c'; name: string; domain: string; city: string; initials: string; color: string }

export const STORES: Store[] = [
  { id: 'a', name: 'Ferretería La Tuerca Demo', domain: 'la-tuerca.example', city: 'Pereira', initials: 'LT', color: '#b45309' },
  { id: 'b', name: 'Herramientas El Martillo Demo', domain: 'el-martillo.example', city: 'Manizales', initials: 'EM', color: '#1d4ed8' },
  { id: 'c', name: 'Casa del Tornillo Demo', domain: 'casa-del-tornillo.example', city: 'Armenia', initials: 'CT', color: '#047857' },
];

export interface Product {
  sku: string;
  name: string;
  price: number;
  listPrice?: number;
  stock: number;
  shipping: number;
}

export type Catalog = Record<Store['id'], Product[]>;

const NAMES: Record<string, string> = {
  P1: 'Taladro percutor 1/2" 650 W',
  P2: 'Pulidora angular 4 1/2" 850 W',
  P3: 'Juego de destornilladores x 6',
  P4: 'Martillo de uña 16 oz mango de fibra',
  P5: 'Cinta métrica 5 m',
  P6: 'Pintura vinilo tipo 1 blanca, galón',
  P7: 'Disco de corte para metal 4 1/2"',
  P8: 'Rotomartillo SDS Plus 800 W',
};

const p = (sku: string, price: number, stock: number, shipping: number, listPrice?: number): Product => ({ sku, name: NAMES[sku], price, stock, shipping, listPrice });

export const CATALOG_YESTERDAY: Catalog = {
  a: [p('P1', 179_900, 8, 9_900), p('P2', 159_900, 5, 9_900), p('P3', 34_900, 20, 9_900), p('P4', 29_900, 14, 9_900), p('P6', 89_900, 30, 9_900), p('P7', 6_500, 120, 9_900)],
  b: [p('P1', 189_900, 12, 12_000), p('P2', 164_900, 7, 12_000), p('P3', 36_500, 15, 12_000), p('P5', 18_900, 40, 12_000), p('P7', 6_900, 200, 12_000)],
  c: [p('P1', 182_500, 4, 0), p('P2', 158_000, 6, 0), p('P4', 31_500, 9, 0), p('P5', 19_500, 25, 0), p('P6', 92_000, 18, 0)],
};

export const CATALOG_TODAY: Catalog = {
  a: [p('P1', 179_900, 8, 9_900), p('P2', 159_900, 5, 9_900), p('P3', 34_900, 20, 9_900), p('P4', 29_900, 14, 9_900), p('P6', 84_900, 30, 9_900, 89_900), p('P7', 6_500, 120, 9_900), p('P8', 389_900, 6, 0)],
  b: [p('P1', 169_900, 3, 0, 189_900), p('P2', 164_900, 7, 12_000), p('P3', 36_500, 15, 12_000), p('P5', 18_900, 40, 12_000), p('P7', 6_900, 200, 12_000)],
  c: [p('P1', 182_500, 4, 0), p('P2', 158_000, 0, 0), p('P4', 33_900, 9, 0), p('P6', 92_000, 18, 0)],
};

/** Cambios que el visitante puede aplicar a las tiendas para ver cómo los detecta la siguiente ejecución. */
export const SIMULATED_STORE_CHANGES: ((c: Catalog) => Catalog)[] = [
  (c) => ({ ...c, a: c.a.map((x) => (x.sku === 'P1' ? { ...x, price: 164_900, listPrice: 179_900 } : x)) }),
  (c) => ({ ...c, c: c.c.map((x) => (x.sku === 'P1' ? { ...x, stock: 0 } : x)) }),
  (c) => ({ ...c, b: [...c.b, p('P6', 86_500, 22, 12_000)] }),
];

export function catalogToday(simulated: number): Catalog {
  let c = CATALOG_TODAY;
  for (let i = 0; i < Math.min(simulated, SIMULATED_STORE_CHANGES.length); i++) c = SIMULATED_STORE_CHANGES[i](c);
  return c;
}

function money(n: number) {
  return `$ ${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** HTML de la página de la tienda ficticia (lo que "vería" el extractor). */
export function storeHtml(store: Store, products: Product[]): string {
  const items = products
    .map((x) => {
      const stock = x.stock > 0 ? `${x.stock} disponibles` : 'Agotado';
      const ship = x.shipping === 0 ? 'Envío gratis' : `Envío ${money(x.shipping)}`;
      const before = x.listPrice && x.listPrice > x.price ? ` <span class="precio-antes">${money(x.listPrice)}</span>` : '';
      return `<li class="producto" data-sku="${x.sku}"><div class="producto-imagen" aria-hidden="true">${x.sku}</div><div class="producto-info"><h2 class="producto-nombre"><a class="producto-enlace" href="/producto/${x.sku.toLowerCase()}">${escapeHtml(x.name)}</a></h2><p class="precios"><span class="precio-actual">${money(x.price)}</span>${before}</p><p class="stock${x.stock > 0 ? '' : ' agotado'}">${stock}</p><p class="envio">${ship}</p></div><span class="producto-boton">Agregar al carrito</span></li>`;
    })
    .join('');
  return `<div class="tienda"><header class="tienda-encabezado"><span class="tienda-logo" style="background:${store.color}">${store.initials}</span><div><p class="tienda-nombre">${escapeHtml(store.name)}</p><p class="tienda-dominio">${store.domain} · ${escapeHtml(store.city)}</p></div></header><nav class="tienda-ruta">Inicio › Herramientas y ferretería</nav><h1 class="tienda-titulo">Herramientas y ferretería</h1><ul class="productos">${items}</ul><footer class="tienda-pie">Tienda ficticia creada para la demo · Precios en pesos colombianos con IVA incluido</footer></div>`;
}

export const RECORD_SELECTOR = '.producto';

export const DEFAULT_FIELDS: Field[] = [
  { id: 'f1', name: 'Producto', selector: '.producto-nombre', type: 'text', required: true, scope: 'record' },
  { id: 'f2', name: 'Precio', selector: '.precio-actual', type: 'price', required: true, scope: 'record' },
  { id: 'f3', name: 'Precio anterior', selector: '.precio-antes', type: 'price', required: false, scope: 'record' },
  { id: 'f4', name: 'Disponibilidad', selector: '.stock', type: 'number', required: true, scope: 'record' },
];

// ---------------------------------------------------------------------------
// 3. Normativa y circulares (entidades ficticias)
// ---------------------------------------------------------------------------

export interface NormDoc {
  id: string;
  type: 'resolucion' | 'circular' | 'decreto' | 'concepto';
  number: string;
  date: string;
  entity: string;
  title: string;
  url: string;
}

export const NORM_ENTITIES = [
  'Entidad Demo de Contratación Pública',
  'Comisión Demo de Reglamentos Técnicos',
  'Superintendencia Demo de Comercio',
  'Ministerio Demo de Vivienda',
];

const N_YESTERDAY: NormDoc[] = [
  { id: 'N1', type: 'circular', number: 'Circular externa 009 de 2026', date: '2026-09-15', entity: NORM_ENTITIES[0], title: 'Uso de documentos tipo en procesos de obra pública', url: 'https://normas-demo.example/circular-009-2026.pdf' },
  { id: 'N2', type: 'resolucion', number: 'Resolución 1874 de 2026', date: '2026-09-21', entity: NORM_ENTITIES[1], title: 'Requisitos de etiquetado para herramientas eléctricas portátiles', url: 'https://normas-demo.example/resolucion-1874-2026.pdf' },
  { id: 'N3', type: 'concepto', number: 'Concepto 220-31 de 2026', date: '2026-09-29', entity: NORM_ENTITIES[2], title: 'Publicidad de precios con descuento en tiendas en línea', url: 'https://normas-demo.example/concepto-220-31-2026.pdf' },
  { id: 'N4', type: 'decreto', number: 'Decreto 0612 de 2026', date: '2026-10-01', entity: NORM_ENTITIES[3], title: 'Subsidios para el mejoramiento de vivienda rural', url: 'https://normas-demo.example/decreto-0612-2026.pdf' },
  { id: 'N5', type: 'circular', number: 'Circular 011 de 2026', date: '2026-10-05', entity: NORM_ENTITIES[0], title: 'Plazos para observaciones en procesos de mínima cuantía', url: 'https://normas-demo.example/circular-011-2026.pdf' },
];

export const NORMS_YESTERDAY = N_YESTERDAY;
export const NORMS_TODAY: NormDoc[] = [
  ...N_YESTERDAY,
  { id: 'N6', type: 'resolucion', number: 'Resolución 2031 de 2026', date: '2026-10-07', entity: NORM_ENTITIES[1], title: 'Reglamento técnico de seguridad para pulidoras y taladros', url: 'https://normas-demo.example/resolucion-2031-2026.pdf' },
  { id: 'N7', type: 'circular', number: 'Circular externa 014 de 2026', date: '2026-10-07', entity: NORM_ENTITIES[0], title: 'Garantías exigibles en contratos de suministro', url: 'https://normas-demo.example/circular-014-2026.pdf' },
];

export const DEFAULT_NORMATIVA: NormativaConfig = { entities: [...NORM_ENTITIES], keyword: '' };

// ---------------------------------------------------------------------------
// 4. Documentos de proveedores (PDF ficticios)
// ---------------------------------------------------------------------------

export interface SupplierDoc {
  id: string;
  file: string;
  docType: 'rut' | 'camara' | 'factura';
  nit: string;
  /** Dígito de verificación tal como se leyó del documento. */
  dvRead: number;
  name: string;
  legalRep: string | null;
  ciiu: string;
  docDate: string;
  confidence: number;
  processed: string;
}

export const SUPPLIER_DOCS: SupplierDoc[] = [
  { id: 'D1', file: 'rut_ferrelectricos_andinos.pdf', docType: 'rut', nit: '900315247', dvRead: 1, name: 'Ferreléctricos Andinos Demo S.A.S.', legalRep: 'Carolina Restrepo Giraldo', ciiu: '4663', docDate: '2026-08-12', confidence: 97, processed: '2026-09-29' },
  { id: 'D2', file: 'camara_pinturas_ejemplo.pdf', docType: 'camara', nit: '830512964', dvRead: 3, name: 'Pinturas y Recubrimientos Ejemplo Ltda.', legalRep: 'Jorge Iván Salazar Mejía', ciiu: '2022', docDate: '2026-09-30', confidence: 94, processed: '2026-10-01' },
  { id: 'D3', file: 'rut_herrajes_la_montana.pdf', docType: 'rut', nit: '901207583', dvRead: 6, name: 'Herrajes La Montaña Demo S.A.S.', legalRep: 'Diana Patricia Ocampo Ríos', ciiu: '2593', docDate: '2026-07-03', confidence: 91, processed: '2026-10-08' },
  { id: 'D4', file: 'factura_FE-8812_tornilleria_express.pdf', docType: 'factura', nit: '901639402', dvRead: 1, name: 'Tornillería Express Demo S.A.S.', legalRep: null, ciiu: '4752', docDate: '2026-10-06', confidence: 62, processed: '2026-10-08' },
  { id: 'D5', file: 'camara_transportes_demo_cafe.pdf', docType: 'camara', nit: '900874215', dvRead: 1, name: 'Transportes de Carga Demo del Café S.A.S.', legalRep: 'Luis Fernando Arango Toro', ciiu: '4923', docDate: '2026-09-18', confidence: 96, processed: '2026-10-04' },
];

export const CIIU: Record<string, string> = {
  '4663': 'Comercio al por mayor de materiales de construcción y artículos de ferretería',
  '2022': 'Fabricación de pinturas, barnices y revestimientos similares',
  '2593': 'Fabricación de herramientas de mano y artículos de ferretería',
  '4752': 'Comercio al por menor de artículos de ferretería, pinturas y vidrios',
  '4923': 'Transporte de carga por carretera',
};

export const DOC_COLUMNS = ['file', 'docType', 'nit', 'name', 'legalRep', 'ciiu', 'docDate', 'confidence', 'status'];
export const DEFAULT_DOCS: DocsConfig = { threshold: 80, columns: [...DOC_COLUMNS] };

// ---------------------------------------------------------------------------
// Reglas de alerta iniciales
// ---------------------------------------------------------------------------

export const DEFAULT_RULES: Rule[] = [
  { id: 'r1', sourceId: 'contratacion', type: 'newProcessOver', value: 500_000_000, enabled: true },
  { id: 'r2', sourceId: 'contratacion', type: 'closingSoon', value: 5, enabled: true },
  { id: 'r3', sourceId: 'precios', type: 'priceDrop', value: 10, enabled: true },
  { id: 'r4', sourceId: 'precios', type: 'stockBelow', value: 3, enabled: true },
  { id: 'r5', sourceId: 'normativa', type: 'newDoc', value: '', enabled: true },
  { id: 'r6', sourceId: 'documentos', type: 'docReview', value: 0, enabled: true },
];
