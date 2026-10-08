// Catálogo de ejemplo de la demo de tienda (24 referencias, precios en COP con
// IVA incluido). Nombres genéricos, sin marcas registradas.
//
// Fotos: una foto propia por producto, servida desde Unsplash por ID estable
// (https://images.unsplash.com/<photoId>). Cada ID se revisó a mano para que
// muestre exactamente el tipo de producto, sin logos ni texto legible de marcas.
// La galería del detalle usa la misma foto con dos acercamientos (imgix
// `crop=focalpoint`), así nunca muestra un producto distinto.

export type ProductCategory =
  | 'tech'
  | 'fashion'
  | 'home'
  | 'sports'
  | 'beauty'
  | 'wines';

/** Acercamiento sobre la foto: centro (0–1) y zoom (≥ 1). */
export interface PhotoDetail {
  x: number;
  y: number;
  z: number;
}

export interface Product {
  id: number;
  sku: string;
  nameKey: string; // clave i18n en demoEcommerce2.productNames
  category: ProductCategory;
  price: number; // COP, IVA incluido
  originalPrice?: number; // COP, IVA incluido
  discount?: number; // % calculado a partir de price y originalPrice
  rating: number;
  reviews: number;
  stock: number;
  photoId: string;
  details: [PhotoDetail, PhotoDetail];
  badges: Array<'new' | 'sale' | 'bestseller' | 'eco'>;
  warehouses: { bog: number; mde: number; cli: number };
  sales30d: number; // unidades vendidas en 30 días (vista Vendedor)
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

// Acercamientos por defecto: centro de la foto a 1,6× y a 2,4×.
const D1: PhotoDetail = { x: 0.5, y: 0.5, z: 1.6 };
const D2: PhotoDetail = { x: 0.5, y: 0.5, z: 2.4 };

type ProductInput = Omit<Product, 'discount' | 'details'> & { details?: [PhotoDetail, PhotoDetail] };

function withDiscount(p: ProductInput): Product {
  const discount = p.originalPrice
    ? Math.round((1 - p.price / p.originalPrice) * 100)
    : undefined;
  return { ...p, details: p.details ?? [D1, D2], discount };
}

const CATALOG: ProductInput[] = [
  // Tecnología
  { id: 1,  sku: 'TEC-POR-15',  nameKey: 'laptop15',        category: 'tech',    price: 6499000, originalPrice: 7299000, rating: 4.9, reviews: 1240, stock: 23,  photoId: 'photo-1759661142441-d77ffb3ca943', badges: ['bestseller'],         warehouses: { bog: 12,  mde: 7,   cli: 4  }, sales30d: 87  },
  { id: 2,  sku: 'TEC-SMP-61',  nameKey: 'smartphone61',    category: 'tech',    price: 4299000,                         rating: 4.8, reviews: 2103, stock: 56,  photoId: 'photo-1585060544812-6b45742d762f', details: [{ x: 0.5, y: 0.5, z: 1.4 }, { x: 0.5, y: 0.36, z: 2.6 }], badges: ['bestseller', 'new'],  warehouses: { bog: 30,  mde: 18,  cli: 8  }, sales30d: 142 },
  { id: 3,  sku: 'TEC-TAB-11',  nameKey: 'tablet11',        category: 'tech',    price: 2199000, originalPrice: 2499000, rating: 4.7, reviews: 845,  stock: 38,  photoId: 'photo-1612367990403-73ef3e67bc4f', details: [{ x: 0.5, y: 0.5, z: 1.3 }, { x: 0.8, y: 0.62, z: 2.4 }], badges: ['sale'],               warehouses: { bog: 20,  mde: 10,  cli: 8  }, sales30d: 64  },
  { id: 4,  sku: 'TEC-AUD-DIA', nameKey: 'headphones',      category: 'tech',    price: 599000,  originalPrice: 749000,  rating: 4.8, reviews: 1567, stock: 120, photoId: 'photo-1505740106531-4243f3831c78', badges: ['bestseller', 'sale'], warehouses: { bog: 60,  mde: 35,  cli: 25 }, sales30d: 210 },
  { id: 5,  sku: 'TEC-REL-INT', nameKey: 'smartwatch',      category: 'tech',    price: 899000,                          rating: 4.6, reviews: 432,  stock: 67,  photoId: 'photo-1660844817855-3ecc7ef21f12', badges: ['new'],                warehouses: { bog: 32,  mde: 22,  cli: 13 }, sales30d: 51  },
  { id: 6,  sku: 'TEC-CAM-35',  nameKey: 'filmCamera',      category: 'tech',    price: 1290000,                         rating: 4.5, reviews: 187,  stock: 14,  photoId: 'photo-1530013163228-592d223300e6', badges: [],                     warehouses: { bog: 6,   mde: 5,   cli: 3  }, sales30d: 18  },
  { id: 7,  sku: 'TEC-AUD-INE', nameKey: 'earbuds',         category: 'tech',    price: 349000,  originalPrice: 439000,  rating: 4.7, reviews: 998,  stock: 156, photoId: 'photo-1655560378428-7605bda51749', badges: ['sale'],               warehouses: { bog: 70,  mde: 50,  cli: 36 }, sales30d: 188 },
  // Moda
  { id: 8,  sku: 'MOD-TEN-LON', nameKey: 'canvasSneakers',  category: 'fashion', price: 189900,  originalPrice: 249900,  rating: 4.7, reviews: 542,  stock: 89,  photoId: 'photo-1783139965231-9ecfc25eaf45', badges: ['sale', 'bestseller'], warehouses: { bog: 40,  mde: 28,  cli: 21 }, sales30d: 134 },
  { id: 9,  sku: 'MOD-BOT-CUE', nameKey: 'leatherBoots',    category: 'fashion', price: 459900,                          rating: 4.6, reviews: 388,  stock: 73,  photoId: 'photo-1608256246200-53e635b5b65f', badges: [],                     warehouses: { bog: 30,  mde: 25,  cli: 18 }, sales30d: 92  },
  { id: 10, sku: 'MOD-CHA-CUE', nameKey: 'leatherJacket',   category: 'fashion', price: 699900,  originalPrice: 859900,  rating: 4.8, reviews: 214,  stock: 32,  photoId: 'photo-1727515546577-f7d82a47b51d', badges: ['sale'],               warehouses: { bog: 14,  mde: 12,  cli: 6  }, sales30d: 41  },
  { id: 11, sku: 'MOD-MOR-URB', nameKey: 'urbanBackpack',   category: 'fashion', price: 219900,                          rating: 4.5, reviews: 267,  stock: 110, photoId: 'photo-1680039211156-66c721b87625', badges: ['eco'],                warehouses: { bog: 50,  mde: 35,  cli: 25 }, sales30d: 78  },
  { id: 12, sku: 'MOD-GAF-SOL', nameKey: 'sunglasses',      category: 'fashion', price: 249900,                          rating: 4.7, reviews: 345,  stock: 56,  photoId: 'photo-1785672021160-29cccd65500d', badges: ['new'],                warehouses: { bog: 25,  mde: 18,  cli: 13 }, sales30d: 47  },
  // Hogar
  { id: 13, sku: 'HOG-CAF-ORI', nameKey: 'coffeeBeans',     category: 'home',    price: 38900,                           rating: 4.9, reviews: 1842, stock: 320, photoId: 'photo-1776176623816-c4fd0e55f61c', badges: ['bestseller', 'eco'],  warehouses: { bog: 150, mde: 100, cli: 70 }, sales30d: 412 },
  { id: 14, sku: 'HOG-LMP-ESC', nameKey: 'deskLamp',        category: 'home',    price: 149900,  originalPrice: 189900,  rating: 4.5, reviews: 198,  stock: 92,  photoId: 'photo-1570974802254-4b0ad1a755f5', badges: ['sale'],               warehouses: { bog: 40,  mde: 30,  cli: 22 }, sales30d: 64  },
  { id: 15, sku: 'HOG-PRE-FRA', nameKey: 'frenchPress',     category: 'home',    price: 89900,                           rating: 4.6, reviews: 421,  stock: 8,   photoId: 'photo-1708127368781-cd5f069a90a5', badges: [],                     warehouses: { bog: 4,   mde: 2,   cli: 2  }, sales30d: 36  },
  { id: 16, sku: 'HOG-OLL-SET', nameKey: 'cookwareSet',     category: 'home',    price: 449900,  originalPrice: 549900,  rating: 4.4, reviews: 156,  stock: 47,  photoId: 'photo-1584990347449-fd98bc063110', badges: ['sale'],               warehouses: { bog: 22,  mde: 15,  cli: 10 }, sales30d: 28  },
  // Deportes
  { id: 17, sku: 'DEP-TEN-RUN', nameKey: 'runningShoes',    category: 'sports',  price: 429900,                          rating: 4.7, reviews: 612,  stock: 84,  photoId: 'photo-1726133731483-d4b8bcabeb43', badges: ['bestseller'],         warehouses: { bog: 38,  mde: 28,  cli: 18 }, sales30d: 121 },
  { id: 18, sku: 'DEP-MAN-HEX', nameKey: 'dumbbells',       category: 'sports',  price: 159900,  originalPrice: 189900,  rating: 4.5, reviews: 489,  stock: 102, photoId: 'photo-1638536532686-d610adfc8e5c', badges: ['sale'],               warehouses: { bog: 45,  mde: 35,  cli: 22 }, sales30d: 87  },
  { id: 19, sku: 'DEP-TAP-YOG', nameKey: 'yogaMat',         category: 'sports',  price: 119900,                          rating: 4.6, reviews: 712,  stock: 203, photoId: 'photo-1763004871583-4183d64096b1', badges: ['eco'],                warehouses: { bog: 95,  mde: 65,  cli: 43 }, sales30d: 158 },
  { id: 20, sku: 'DEP-MAL-LON', nameKey: 'gymBag',          category: 'sports',  price: 159900,                          rating: 4.4, reviews: 287,  stock: 76,  photoId: 'photo-1448582649076-3981753123b5', details: [{ x: 0.3, y: 0.72, z: 1.6 }, { x: 0.38, y: 0.7, z: 2.4 }], badges: [],                     warehouses: { bog: 30,  mde: 26,  cli: 20 }, sales30d: 54  },
  // Belleza
  { id: 21, sku: 'BEL-PER-100', nameKey: 'fragrance',       category: 'beauty',  price: 329900,  originalPrice: 409900,  rating: 4.8, reviews: 524,  stock: 64,  photoId: 'photo-1594125311687-3b1b3eafa9f4', badges: ['sale'],               warehouses: { bog: 28,  mde: 22,  cli: 14 }, sales30d: 69  },
  { id: 22, sku: 'BEL-CRE-HID', nameKey: 'faceCream',       category: 'beauty',  price: 69900,                           rating: 4.7, reviews: 432,  stock: 121, photoId: 'photo-1616750819456-5cdee9b85d22', badges: ['new', 'eco'],         warehouses: { bog: 55,  mde: 40,  cli: 26 }, sales30d: 95  },
  // Vinos
  { id: 23, sku: 'VIN-MAL-RES', nameKey: 'reserveMalbec',   category: 'wines',   price: 89900,   originalPrice: 109900,  rating: 4.9, reviews: 318,  stock: 42,  photoId: 'photo-1554230561-31bdc707b537', details: [{ x: 0.5, y: 0.25, z: 1.6 }, { x: 0.3, y: 0.2, z: 2.6 }], badges: ['sale', 'bestseller'], warehouses: { bog: 20,  mde: 14,  cli: 8  }, sales30d: 73  },
  { id: 24, sku: 'VIN-CHA-750', nameKey: 'chardonnay',      category: 'wines',   price: 69900,                           rating: 4.7, reviews: 198,  stock: 56,  photoId: 'photo-1579721333016-b58535cc0dc3', details: [{ x: 0.45, y: 0.6, z: 1.5 }, { x: 0.4, y: 0.68, z: 2.2 }], badges: [],                     warehouses: { bog: 24,  mde: 20,  cli: 12 }, sales30d: 48  },
];

export const PRODUCTS: Product[] = CATALOG.map(withDiscount);

export const CATEGORY_IDS: ProductCategory[] = [
  'tech',
  'fashion',
  'home',
  'sports',
  'beauty',
  'wines',
];
