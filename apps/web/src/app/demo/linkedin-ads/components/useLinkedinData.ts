'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { DEMOS_META, type KoptupDemo } from './data';
import type { Plantillas } from './generador';

/**
 * Catálogo localizado (`demoLinkedinAds.catalog`): título, descripción,
 * funciones, sector, público y problema de cada demo, escritos para que lo que
 * se publique diga solo lo que la demo hace.
 */
export function useCatalogo(): KoptupDemo[] {
  const tCat = useTranslations('demoLinkedinAds.catalog');

  return useMemo(
    () =>
      DEMOS_META.map((m) => ({
        id: m.id,
        slug: m.id,
        path: m.path,
        emoji: m.emoji,
        titulo: tCat(`${m.id}.titulo`),
        tagline: tCat(`${m.id}.descripcion`),
        funciones: tCat.raw(`${m.id}.funciones`) as string[],
        industria: tCat(`${m.id}.industria`),
        publicoObjetivo: tCat.raw(`${m.id}.publico`) as string[],
        problemaResuelve: tCat(`${m.id}.problema`),
        hashtagsEspecificos: m.hashtags,
      })),
    [tCat],
  );
}

export function usePlantillas(): Plantillas {
  const t = useTranslations('demoLinkedinAds');
  return useMemo(() => t.raw('templates') as Plantillas, [t]);
}
