// Catálogo de ejemplo de la demo de tienda (24 referencias, precios en COP con
// IVA incluido). Nombres genéricos, sin marcas registradas.
//
// Fotos: una foto propia por producto, servida desde Unsplash por ID estable
// (https://images.unsplash.com/<photoId>). Cada ID se revisó a mano para que
// muestre exactamente el tipo de producto, sin logos ni texto legible de marcas.
// La galería del detalle usa la misma foto con dos acercamientos (imgix
// `crop=focalpoint`), así nunca muestra un producto distinto.
//
// Las existencias se guardan por bodega (Bogotá, Medellín, Cali); el total es la
// suma. Las unidades vendidas, los "más vendidos" y los reportes NO están
// escritos a mano: se calculan con los pedidos de ejemplo (ver data.ts).

export type ProductCategory =
  | 'tech'
  | 'fashion'
  | 'home'
  | 'sports'
  | 'beauty'
  | 'wines';

export type WarehouseId = 'bog' | 'mde' | 'cli';
export const WAREHOUSE_IDS: WarehouseId[] = ['bog', 'mde', 'cli'];

/** Acercamiento sobre la foto: centro (0–1) y zoom (≥ 1). */
export interface PhotoDetail {
  x: number;
  y: number;
  z: number;
}

export interface Product {
  id: number;
  sku: string;
  /** Clave i18n en demoEcommerce2.productNames (productos del catálogo base). */
  nameKey?: string;
  /** Nombre libre (productos creados en el panel de la tienda). */
  name?: string;
  description?: string;
  category: ProductCategory;
  price: number; // COP, IVA incluido
  originalPrice?: number; // COP, IVA incluido (precio antes del descuento)
  rating: number;
  reviews: number;
  /** Foto de Unsplash (catálogo base). */
  photoId?: string;
  /** Foto subida en el panel, reducida en el navegador (data URL JPEG). */
  imageData?: string;
  details: [PhotoDetail, PhotoDetail];
  badges: Array<'new' | 'eco'>;
  warehouses: Record<WarehouseId, number>;
  /** Peso relativo de demanda para generar los pedidos de ejemplo. */
  demand: number;
  hidden?: boolean;
  /** Creado por el visitante en esta demo. */
  custom?: boolean;
}

// Hero: bolsas de compra de papel sin marca.
export const HERO_PHOTO_ID = 'photo-1760565030309-8a56664f8901';

export function imageUrl(photoId: string, w = 800, h = 800, detail?: PhotoDetail): string {
  const focus = detail
    ? `&crop=focalpoint&fp-x=${detail.x}&fp-y=${detail.y}&fp-z=${detail.z}`
    : '';
  return `https://images.unsplash.com/${photoId}?w=${w}&h=${h}&fit=crop${focus}&q=80&auto=format`;
}

export function heroImageUrl(photoId: string): string {
  // Encuadre algo más alto que el centro para que se vean las asas de las bolsas.
  return `https://images.unsplash.com/${photoId}?w=1600&h=600&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.4&q=80&auto=format`;
}

export function totalStock(p: Pick<Product, 'warehouses'>): number {
  return p.warehouses.bog + p.warehouses.mde + p.warehouses.cli;
}

/** Descuento en % calculado a partir de price y originalPrice. */
export function discountPct(p: Pick<Product, 'price' | 'originalPrice'>): number | undefined {
  if (!p.originalPrice || p.originalPrice <= p.price) return undefined;
  return Math.round((1 - p.price / p.originalPrice) * 100);
}

// Acercamientos por defecto: centro de la foto a 1,6× y a 2,4×.
export const DEFAULT_DETAILS: [PhotoDetail, PhotoDetail] = [
  { x: 0.5, y: 0.5, z: 1.6 },
  { x: 0.5, y: 0.5, z: 2.4 },
];

type ProductInput = Omit<Product, 'details'> & { details?: [PhotoDetail, PhotoDetail] };

const CATALOG: ProductInput[] = [
  // Tecnología
  { id: 1,  sku: 'TEC-POR-15',  nameKey: 'laptop15',       category: 'tech',    price: 6499000, originalPrice: 7299000, rating: 4.9, reviews: 1240, photoId: 'photo-1759661142441-d77ffb3ca943', badges: [],             warehouses: { bog: 12, mde: 7,  cli: 4  }, demand: 1   },
  { id: 2,  sku: 'TEC-SMP-61',  nameKey: 'smartphone61',   category: 'tech',    price: 4299000,                         rating: 4.8, reviews: 2103, photoId: 'photo-1585060544812-6b45742d762f', details: [{ x: 0.5, y: 0.5, z: 1.4 }, { x: 0.5, y: 0.36, z: 2.6 }], badges: ['new'], warehouses: { bog: 30, mde: 18, cli: 8 }, demand: 1.6 },
  { id: 3,  sku: 'TEC-TAB-11',  nameKey: 'tablet11',       category: 'tech',    price: 2199000, originalPrice: 2499000, rating: 4.7, reviews: 845,  photoId: 'photo-1612367990403-73ef3e67bc4f', details: [{ x: 0.5, y: 0.5, z: 1.3 }, { x: 0.8, y: 0.62, z: 2.4 }], badges: [], warehouses: { bog: 20, mde: 10, cli: 8 }, demand: 1.8 },
  { id: 4,  sku: 'TEC-AUD-DIA', nameKey: 'headphones',     category: 'tech',    price: 599000,  originalPrice: 749000,  rating: 4.8, reviews: 1567, photoId: 'photo-1505740106531-4243f3831c78', badges: [],             warehouses: { bog: 60, mde: 35, cli: 25 }, demand: 6   },
  { id: 5,  sku: 'TEC-REL-INT', nameKey: 'smartwatch',     category: 'tech',    price: 899000,                          rating: 4.6, reviews: 432,  photoId: 'photo-1660844817855-3ecc7ef21f12', badges: ['new'],        warehouses: { bog: 32, mde: 22, cli: 13 }, demand: 3   },
  { id: 6,  sku: 'TEC-CAM-35',  nameKey: 'filmCamera',     category: 'tech',    price: 1290000,                         rating: 4.5, reviews: 187,  photoId: 'photo-1530013163228-592d223300e6', badges: [],             warehouses: { bog: 6,  mde: 5,  cli: 3  }, demand: 1   },
  { id: 7,  sku: 'TEC-AUD-INE', nameKey: 'earbuds',        category: 'tech',    price: 349000,  originalPrice: 439000,  rating: 4.7, reviews: 998,  photoId: 'photo-1655560378428-7605bda51749', badges: [],             warehouses: { bog: 70, mde: 50, cli: 36 }, demand: 8   },
  // Moda
  { id: 8,  sku: 'MOD-TEN-LON', nameKey: 'canvasSneakers', category: 'fashion', price: 189900,  originalPrice: 249900,  rating: 4.7, reviews: 542,  photoId: 'photo-1783139965231-9ecfc25eaf45', badges: [],             warehouses: { bog: 40, mde: 28, cli: 21 }, demand: 9   },
  { id: 9,  sku: 'MOD-BOT-CUE', nameKey: 'leatherBoots',   category: 'fashion', price: 459900,                          rating: 4.6, reviews: 388,  photoId: 'photo-1608256246200-53e635b5b65f', badges: [],             warehouses: { bog: 30, mde: 25, cli: 18 }, demand: 5   },
  { id: 10, sku: 'MOD-CHA-CUE', nameKey: 'leatherJacket',  category: 'fashion', price: 699900,  originalPrice: 859900,  rating: 4.8, reviews: 214,  photoId: 'photo-1727515546577-f7d82a47b51d', badges: [],             warehouses: { bog: 14, mde: 12, cli: 6  }, demand: 2.5 },
  { id: 11, sku: 'MOD-MOR-URB', nameKey: 'urbanBackpack',  category: 'fashion', price: 219900,                          rating: 4.5, reviews: 267,  photoId: 'photo-1680039211156-66c721b87625', badges: ['eco'],        warehouses: { bog: 50, mde: 35, cli: 25 }, demand: 6   },
  { id: 12, sku: 'MOD-GAF-SOL', nameKey: 'sunglasses',     category: 'fashion', price: 249900,                          rating: 4.7, reviews: 345,  photoId: 'photo-1785672021160-29cccd65500d', badges: ['new'],        warehouses: { bog: 25, mde: 18, cli: 13 }, demand: 4   },
  // Hogar
  { id: 13, sku: 'HOG-CAF-ORI', nameKey: 'coffeeBeans',    category: 'home',    price: 38900,                           rating: 4.9, reviews: 1842, photoId: 'photo-1776176623816-c4fd0e55f61c', badges: ['eco'],        warehouses: { bog: 60, mde: 40, cli: 22 }, demand: 26  },
  { id: 14, sku: 'HOG-LMP-ESC', nameKey: 'deskLamp',       category: 'home',    price: 149900,  originalPrice: 189900,  rating: 4.5, reviews: 198,  photoId: 'photo-1570974802254-4b0ad1a755f5', badges: [],             warehouses: { bog: 40, mde: 30, cli: 22 }, demand: 5   },
  { id: 15, sku: 'HOG-PRE-FRA', nameKey: 'frenchPress',    category: 'home',    price: 89900,                           rating: 4.6, reviews: 421,  photoId: 'photo-1708127368781-cd5f069a90a5', badges: [],             warehouses: { bog: 4,  mde: 2,  cli: 2  }, demand: 6   },
  { id: 16, sku: 'HOG-OLL-SET', nameKey: 'cookwareSet',    category: 'home',    price: 449900,  originalPrice: 549900,  rating: 4.4, reviews: 156,  photoId: 'photo-1584990347449-fd98bc063110', badges: [],             warehouses: { bog: 22, mde: 15, cli: 10 }, demand: 2.5 },
  // Deportes
  { id: 17, sku: 'DEP-TEN-RUN', nameKey: 'runningShoes',   category: 'sports',  price: 429900,                          rating: 4.7, reviews: 612,  photoId: 'photo-1726133731483-d4b8bcabeb43', badges: [],             warehouses: { bog: 38, mde: 28, cli: 18 }, demand: 7   },
  { id: 18, sku: 'DEP-MAN-HEX', nameKey: 'dumbbells',      category: 'sports',  price: 159900,  originalPrice: 189900,  rating: 4.5, reviews: 489,  photoId: 'photo-1638536532686-d610adfc8e5c', badges: [],             warehouses: { bog: 45, mde: 35, cli: 22 }, demand: 5   },
  { id: 19, sku: 'DEP-TAP-YOG', nameKey: 'yogaMat',        category: 'sports',  price: 119900,                          rating: 4.6, reviews: 712,  photoId: 'photo-1763004871583-4183d64096b1', badges: ['eco'],        warehouses: { bog: 95, mde: 65, cli: 43 }, demand: 9   },
  { id: 20, sku: 'DEP-MAL-LON', nameKey: 'gymBag',         category: 'sports',  price: 159900,                          rating: 4.4, reviews: 287,  photoId: 'photo-1448582649076-3981753123b5', details: [{ x: 0.3, y: 0.72, z: 1.6 }, { x: 0.38, y: 0.7, z: 2.4 }], badges: [], warehouses: { bog: 30, mde: 26, cli: 20 }, demand: 4 },
  // Belleza
  { id: 21, sku: 'BEL-PER-100', nameKey: 'fragrance',      category: 'beauty',  price: 329900,  originalPrice: 409900,  rating: 4.8, reviews: 524,  photoId: 'photo-1594125311687-3b1b3eafa9f4', badges: [],             warehouses: { bog: 28, mde: 22, cli: 14 }, demand: 5   },
  { id: 22, sku: 'BEL-CRE-HID', nameKey: 'faceCream',      category: 'beauty',  price: 69900,                           rating: 4.7, reviews: 432,  photoId: 'photo-1616750819456-5cdee9b85d22', badges: ['new', 'eco'], warehouses: { bog: 55, mde: 40, cli: 26 }, demand: 9   },
  // Vinos
  { id: 23, sku: 'VIN-MAL-RES', nameKey: 'reserveMalbec',  category: 'wines',   price: 89900,   originalPrice: 109900,  rating: 4.9, reviews: 318,  photoId: 'photo-1554230561-31bdc707b537', details: [{ x: 0.5, y: 0.25, z: 1.6 }, { x: 0.3, y: 0.2, z: 2.6 }], badges: [], warehouses: { bog: 20, mde: 14, cli: 8 }, demand: 7 },
  { id: 24, sku: 'VIN-CHA-750', nameKey: 'chardonnay',     category: 'wines',   price: 69900,                           rating: 4.7, reviews: 198,  photoId: 'photo-1579721333016-b58535cc0dc3', details: [{ x: 0.45, y: 0.6, z: 1.5 }, { x: 0.4, y: 0.68, z: 2.2 }], badges: [], warehouses: { bog: 24, mde: 20, cli: 12 }, demand: 5 },
];

export const PRODUCTS: Product[] = CATALOG.map((p) => ({ ...p, details: p.details ?? DEFAULT_DETAILS }));

export const CATEGORY_IDS: ProductCategory[] = [
  'tech',
  'fashion',
  'home',
  'sports',
  'beauty',
  'wines',
];

/** Café de origen: se usa en la regla 3x2 y en la recomendación de reposición. */
export const COFFEE_ID = 13;
