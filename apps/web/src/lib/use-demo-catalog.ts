'use client';

import { useEffect, useState } from 'react';
import { type CatalogItem, catalogMap, fetchPublicCatalog } from './demo-system';
import type { DemoAccessMode } from './demo-access-defaults';

/**
 * Catálogo público de demos (GET /api/demo-catalog) para las páginas que
 * enlazan demos fuera del hub /demo (home, landings, servicios). Primero
 * devuelve la semilla (igual en el servidor y en el navegador, sin errores de
 * hidratación) y luego el modo real que fijó el administrador. Una sola
 * petición por página: la respuesta se comparte durante 60 s.
 */
const TTL_MS = 60_000;
let shared: { at: number; promise: Promise<CatalogItem[]> } | null = null;

function loadShared(): Promise<CatalogItem[]> {
  if (!shared || Date.now() - shared.at > TTL_MS) {
    const promise = fetchPublicCatalog().catch(() => {
      shared = null;
      return [] as CatalogItem[];
    });
    shared = { at: Date.now(), promise };
  }
  return shared.promise;
}

export function useDemoCatalog(): Map<string, CatalogItem> {
  const [map, setMap] = useState<Map<string, CatalogItem>>(() => catalogMap(null));
  useEffect(() => {
    let alive = true;
    loadShared().then((items) => {
      if (alive && items.length) setMap(catalogMap(items));
    });
    return () => {
      alive = false;
    };
  }, []);
  return map;
}

/** Modo y estado de una demo para pintar su etiqueta, o null si es abierta y activa. */
export function gatedInfo(map: Map<string, CatalogItem>, slug: string | null | undefined): { mode: DemoAccessMode; activo: boolean } | null {
  if (!slug) return null;
  const entry = map.get(slug);
  if (!entry) return null;
  return entry.accessMode === 'publico' && entry.activo ? null : { mode: entry.accessMode, activo: entry.activo };
}

/** Slug de una ruta /demo/<slug> (o null). */
export function demoSlugFromPath(path: string): string | null {
  const m = /^\/demo\/([a-z0-9-]+)/.exec(path);
  return m ? m[1] : null;
}
