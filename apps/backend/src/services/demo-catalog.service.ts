/**
 * demo-catalog.service.ts — catálogo de demos (modo de acceso editable).
 *
 * - `seedDemoCatalog` inserta las 28 demos de la semilla que falten, con
 *   `$setOnInsert`: es idempotente y nunca pisa los cambios hechos desde el
 *   panel. Se ejecuta al arrancar (index.ts) y, por si la BD no estaba lista
 *   en ese momento, la primera vez que alguien lee el catálogo.
 * - `getCatalogEntry` devuelve el registro de la BD o, si no existe (BD sin
 *   sembrar), el valor de la semilla. Si la BD no responde lanza el error: el
 *   llamador decide (las demos no públicas fallan cerradas).
 */
import DemoCatalogItem, { type IDemoCatalogItem } from '../models/DemoCatalogItem';
import { DEMO_CATALOG_SEED, DEMO_SEED_BY_SLUG } from '../data/demo-catalog.seed';
import { DEFAULT_DEMO_ACCESS_MODES, type DemoAccessMode, isDbReady } from '../middleware/access';
import { logger } from '../utils/logger';

export interface CatalogEntry {
  slug: string;
  nombre: string;
  nombreEn?: string;
  accessMode: DemoAccessMode;
  activo: boolean;
  duracionDiasPorDefecto: number;
  orden: number;
  updatedAt?: Date;
  /** false si viene de la semilla porque la BD no tiene el registro. */
  persistido: boolean;
}

let seededInThisProcess = false;

/** Inserta las demos que falten. Devuelve cuántas insertó. */
export async function seedDemoCatalog(): Promise<number> {
  const result = await DemoCatalogItem.bulkWrite(
    DEMO_CATALOG_SEED.map((item) => ({
      updateOne: {
        filter: { slug: item.slug },
        update: { $setOnInsert: { ...item } },
        upsert: true,
      },
    })),
    { ordered: false },
  );
  seededInThisProcess = true;
  return result.upsertedCount ?? 0;
}

/** Siembra una sola vez por proceso (la siembra es idempotente). */
export async function ensureCatalogSeeded(): Promise<void> {
  if (seededInThisProcess || !isDbReady()) return;
  try {
    const inserted = await seedDemoCatalog();
    if (inserted > 0) logger.info(`[demo-catalog] Semilla: ${inserted} demos insertadas`);
  } catch (err) {
    logger.warn(`[demo-catalog] No se pudo sembrar el catálogo: ${(err as Error)?.message ?? err}`);
  }
}

/** Solo para pruebas: fuerza a volver a sembrar en la siguiente lectura. */
export function resetCatalogSeedFlagForTests(): void {
  seededInThisProcess = false;
}

function fromDoc(doc: Pick<IDemoCatalogItem, 'slug' | 'nombre' | 'nombreEn' | 'accessMode' | 'activo' | 'duracionDiasPorDefecto' | 'orden'> & { updatedAt?: Date }): CatalogEntry {
  return {
    slug: doc.slug,
    nombre: doc.nombre,
    nombreEn: doc.nombreEn,
    accessMode: doc.accessMode,
    activo: doc.activo !== false,
    duracionDiasPorDefecto: doc.duracionDiasPorDefecto,
    orden: doc.orden,
    updatedAt: doc.updatedAt,
    persistido: true,
  };
}

/** Entrada de la semilla (respaldo). null si el slug no es una demo conocida. */
export function seedEntry(slug: string): CatalogEntry | null {
  const seed = DEMO_SEED_BY_SLUG[slug];
  if (seed) return { ...seed, persistido: false };
  const mode = DEFAULT_DEMO_ACCESS_MODES[slug];
  if (!mode) return null;
  return { slug, nombre: slug, accessMode: mode, activo: true, duracionDiasPorDefecto: 14, orden: 0, persistido: false };
}

/** Registro de una demo (BD o semilla). null si no existe. Lanza si la BD falla. */
export async function getCatalogEntry(slug: string): Promise<CatalogEntry | null> {
  const doc = await DemoCatalogItem.findOne({ slug }).lean();
  if (doc) return fromDoc(doc);
  return seedEntry(slug);
}

/** Catálogo completo (BD + semilla para lo que falte), ordenado. */
export async function listCatalog(): Promise<CatalogEntry[]> {
  await ensureCatalogSeeded();
  const docs = await DemoCatalogItem.find({}).lean();
  const bySlug = new Map<string, CatalogEntry>(docs.map((d) => [d.slug, fromDoc(d)]));
  for (const seed of DEMO_CATALOG_SEED) {
    if (!bySlug.has(seed.slug)) bySlug.set(seed.slug, { ...seed, persistido: false });
  }
  return [...bySlug.values()].sort((a, b) => a.orden - b.orden || a.slug.localeCompare(b.slug));
}

/** Mapa slug → entrada para validar varias demos a la vez. */
export async function getCatalogMap(slugs: string[]): Promise<Map<string, CatalogEntry>> {
  const unique = [...new Set(slugs)];
  const docs = await DemoCatalogItem.find({ slug: { $in: unique } }).lean();
  const map = new Map<string, CatalogEntry>(docs.map((d) => [d.slug, fromDoc(d)]));
  for (const slug of unique) {
    if (!map.has(slug)) {
      const seed = seedEntry(slug);
      if (seed) map.set(slug, seed);
    }
  }
  return map;
}

/** Vista pública de una entrada del catálogo. */
export function publicCatalogView(entry: CatalogEntry) {
  return {
    slug: entry.slug,
    nombre: entry.nombre,
    nombreEn: entry.nombreEn ?? null,
    accessMode: entry.accessMode,
    activo: entry.activo,
  };
}

/** Vista del panel (incluye vigencia por defecto, orden y fecha de cambio). */
export function adminCatalogView(entry: CatalogEntry) {
  return {
    ...publicCatalogView(entry),
    duracionDiasPorDefecto: entry.duracionDiasPorDefecto,
    orden: entry.orden,
    updatedAt: entry.updatedAt ?? null,
  };
}
