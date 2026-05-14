// Shared product catalog for the redesigned ecommerce demo.
// Images use stable Unsplash photo IDs; URLs are generated from PHOTO_IDS.
// Final image URL: https://images.unsplash.com/{photoId}?w=800&h=800&fit=crop&q=80
// 24 SKUs cover Tecnología / Moda / Hogar / Deportes / Belleza / Vinos.

export type ProductCategory =
  | 'tech'
  | 'fashion'
  | 'home'
  | 'sports'
  | 'beauty'
  | 'wines';

export interface Product {
  id: number;
  sku: string;
  nameKey: string; // i18n key under demoEcommerce2.productNames
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviews: number;
  stock: number;
  photoId: string;
  badges: Array<'new' | 'sale' | 'bestseller' | 'eco'>;
  warehouses: { bog: number; mde: number; cli: number };
  sales30d: number; // last 30 days unit sales (for vendor view)
}

// Stable Unsplash photo IDs (verified). All exist as of 2026.
const PHOTO_IDS = [
  'photo-1542291026-7eec264c27ff', // 0  red sneakers
  'photo-1505740420928-5e560c06d30e', // 1  headphones
  'photo-1523275335684-37898b6baf30', // 2  watch
  'photo-1572635196237-14b3f281503f', // 3  sunglasses
  'photo-1546868871-7041f2a55e12', // 4  smartwatch
  'photo-1551488831-00ddcb6c6bd3', // 5  backpack
  'photo-1503602642458-232111445657', // 6  vintage camera
  'photo-1556909114-f6e7ad7d3136', // 7  coffee beans
  'photo-1606107557195-0e29a4b5b4aa', // 8  wine bottle
  'photo-1583394838336-acd977736f90', // 9  wireless earbuds
  'photo-1525966222134-fcfa99b8ae77', // 10 adidas shoes
  'photo-1542219550-37153d387c27', // 11 leather jacket
  'photo-1571945153237-4929e783af4a', // 12 macbook
  'photo-1546435770-a3e426bf472b', // 13 iphone
  'photo-1592078615290-033ee584e267', // 14 ipad
];

export const HERO_PHOTO_ID = PHOTO_IDS[0];

export function imageUrl(photoId: string, w = 800, h = 800): string {
  return `https://images.unsplash.com/${photoId}?w=${w}&h=${h}&fit=crop&q=80&auto=format`;
}

export function heroImageUrl(photoId: string): string {
  return `https://images.unsplash.com/${photoId}?w=1600&h=500&fit=crop&q=80&auto=format`;
}

// Build 24 products (re-using the 15 IDs cyclically — required by spec).
function pid(i: number) {
  return PHOTO_IDS[i % PHOTO_IDS.length];
}

export const PRODUCTS: Product[] = [
  { id: 1,  sku: 'TEC-MBP-15',  nameKey: 'macbookPro15',       category: 'tech',    price: 2299, originalPrice: 2599, discount: 12, rating: 4.9, reviews: 1240, stock: 23,  photoId: pid(12), badges: ['bestseller'],         warehouses: { bog: 12,  mde: 7,  cli: 4  }, sales30d: 87  },
  { id: 2,  sku: 'TEC-IPH-15P', nameKey: 'iphone15Pro',        category: 'tech',    price: 1199, rating: 4.8, reviews: 2103, stock: 56,  photoId: pid(13), badges: ['bestseller', 'new'],  warehouses: { bog: 30,  mde: 18, cli: 8  }, sales30d: 142 },
  { id: 3,  sku: 'TEC-IPD-AIR', nameKey: 'ipadAir',            category: 'tech',    price: 649,  originalPrice: 749,  discount: 13, rating: 4.7, reviews: 845,  stock: 38,  photoId: pid(14), badges: ['sale'],               warehouses: { bog: 20,  mde: 10, cli: 8  }, sales30d: 64  },
  { id: 4,  sku: 'TEC-HDP-WL',  nameKey: 'wirelessHeadphones', category: 'tech',    price: 199,  originalPrice: 249,  discount: 20, rating: 4.8, reviews: 1567, stock: 120, photoId: pid(1),  badges: ['bestseller', 'sale'], warehouses: { bog: 60,  mde: 35, cli: 25 }, sales30d: 210 },
  { id: 5,  sku: 'TEC-WCH-PRO', nameKey: 'smartwatchPro',      category: 'tech',    price: 399,  rating: 4.6, reviews: 432,  stock: 67,  photoId: pid(4),  badges: ['new'],                warehouses: { bog: 32,  mde: 22, cli: 13 }, sales30d: 51  },
  { id: 6,  sku: 'TEC-CAM-VIN', nameKey: 'vintageCamera',      category: 'tech',    price: 549,  rating: 4.5, reviews: 187,  stock: 14,  photoId: pid(6),  badges: [],                     warehouses: { bog: 6,   mde: 5,  cli: 3  }, sales30d: 18  },
  { id: 7,  sku: 'TEC-EAR-INE', nameKey: 'earbuds',            category: 'tech',    price: 149,  originalPrice: 189,  discount: 21, rating: 4.7, reviews: 998,  stock: 156, photoId: pid(9),  badges: ['sale'],               warehouses: { bog: 70,  mde: 50, cli: 36 }, sales30d: 188 },
  { id: 8,  sku: 'MOD-SNK-RED', nameKey: 'redSneakers',        category: 'fashion', price: 129,  originalPrice: 169,  discount: 24, rating: 4.7, reviews: 542,  stock: 89,  photoId: pid(0),  badges: ['sale', 'bestseller'], warehouses: { bog: 40,  mde: 28, cli: 21 }, sales30d: 134 },
  { id: 9,  sku: 'MOD-SNK-ADI', nameKey: 'adidasRunner',       category: 'fashion', price: 119,  rating: 4.6, reviews: 388,  stock: 73,  photoId: pid(10), badges: [],                     warehouses: { bog: 30,  mde: 25, cli: 18 }, sales30d: 92  },
  { id: 10, sku: 'MOD-JCK-CUE', nameKey: 'leatherJacket',      category: 'fashion', price: 289,  originalPrice: 359,  discount: 19, rating: 4.8, reviews: 214,  stock: 32,  photoId: pid(11), badges: ['sale'],               warehouses: { bog: 14,  mde: 12, cli: 6  }, sales30d: 41  },
  { id: 11, sku: 'MOD-BCK-URB', nameKey: 'urbanBackpack',      category: 'fashion', price: 89,   rating: 4.5, reviews: 267,  stock: 110, photoId: pid(5),  badges: ['eco'],                warehouses: { bog: 50,  mde: 35, cli: 25 }, sales30d: 78  },
  { id: 12, sku: 'MOD-LEN-SOL', nameKey: 'sunglasses',         category: 'fashion', price: 159,  rating: 4.7, reviews: 345,  stock: 56,  photoId: pid(3),  badges: ['new'],                warehouses: { bog: 25,  mde: 18, cli: 13 }, sales30d: 47  },
  { id: 13, sku: 'HOG-CAF-PRE', nameKey: 'premiumCoffee',      category: 'home',    price: 24,   rating: 4.9, reviews: 1842, stock: 320, photoId: pid(7),  badges: ['bestseller', 'eco'],  warehouses: { bog: 150, mde: 100,cli: 70 }, sales30d: 412 },
  { id: 14, sku: 'HOG-LMP-LED', nameKey: 'deskLamp',           category: 'home',    price: 79,   originalPrice: 99,   discount: 20, rating: 4.5, reviews: 198,  stock: 92,  photoId: pid(2),  badges: ['sale'],               warehouses: { bog: 40,  mde: 30, cli: 22 }, sales30d: 64  },
  { id: 15, sku: 'HOG-CMP-PRO', nameKey: 'coffeeMaker',        category: 'home',    price: 249,  rating: 4.6, reviews: 421,  stock: 8,   photoId: pid(7),  badges: [],                     warehouses: { bog: 4,   mde: 2,  cli: 2  }, sales30d: 36  },
  { id: 16, sku: 'HOG-AUR-MAC', nameKey: 'kitchenSet',         category: 'home',    price: 189,  originalPrice: 229,  discount: 17, rating: 4.4, reviews: 156,  stock: 47,  photoId: pid(8),  badges: ['sale'],               warehouses: { bog: 22,  mde: 15, cli: 10 }, sales30d: 28  },
  { id: 17, sku: 'DEP-ZAP-RUN', nameKey: 'runningShoes',       category: 'sports',  price: 139,  rating: 4.7, reviews: 612,  stock: 84,  photoId: pid(10), badges: ['bestseller'],         warehouses: { bog: 38,  mde: 28, cli: 18 }, sales30d: 121 },
  { id: 18, sku: 'DEP-WCH-FIT', nameKey: 'fitnessTracker',     category: 'sports',  price: 149,  originalPrice: 179,  discount: 17, rating: 4.5, reviews: 489,  stock: 102, photoId: pid(4),  badges: ['sale'],               warehouses: { bog: 45,  mde: 35, cli: 22 }, sales30d: 87  },
  { id: 19, sku: 'DEP-YGA-MAT', nameKey: 'yogaMat',            category: 'sports',  price: 49,   rating: 4.6, reviews: 712,  stock: 203, photoId: pid(0),  badges: ['eco'],                warehouses: { bog: 95,  mde: 65, cli: 43 }, sales30d: 158 },
  { id: 20, sku: 'DEP-BAG-GYM', nameKey: 'gymBag',             category: 'sports',  price: 69,   rating: 4.4, reviews: 287,  stock: 76,  photoId: pid(5),  badges: [],                     warehouses: { bog: 30,  mde: 26, cli: 20 }, sales30d: 54  },
  { id: 21, sku: 'BEL-FRA-EDP', nameKey: 'fragrance',          category: 'beauty',  price: 129,  originalPrice: 159,  discount: 19, rating: 4.8, reviews: 524,  stock: 64,  photoId: pid(3),  badges: ['sale'],               warehouses: { bog: 28,  mde: 22, cli: 14 }, sales30d: 69  },
  { id: 22, sku: 'BEL-SKN-SET', nameKey: 'skincareSet',        category: 'beauty',  price: 89,   rating: 4.7, reviews: 432,  stock: 121, photoId: pid(2),  badges: ['new', 'eco'],         warehouses: { bog: 55,  mde: 40, cli: 26 }, sales30d: 95  },
  { id: 23, sku: 'VIN-MLB-RES', nameKey: 'reserveMalbec',      category: 'wines',   price: 79,   originalPrice: 99,   discount: 20, rating: 4.9, reviews: 318,  stock: 42,  photoId: pid(8),  badges: ['sale', 'bestseller'], warehouses: { bog: 20,  mde: 14, cli: 8  }, sales30d: 73  },
  { id: 24, sku: 'VIN-CHR-PRM', nameKey: 'chardonnay',         category: 'wines',   price: 59,   rating: 4.7, reviews: 198,  stock: 56,  photoId: pid(8),  badges: [],                     warehouses: { bog: 24,  mde: 20, cli: 12 }, sales30d: 48  },
];

export const CATEGORY_IDS: ProductCategory[] = [
  'tech',
  'fashion',
  'home',
  'sports',
  'beauty',
  'wines',
];
