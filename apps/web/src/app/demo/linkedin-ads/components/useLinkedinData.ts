'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { DEMOS_META, type KoptupDemo } from './data';
import type { Plantillas } from './generador';

/**
 * Catálogo localizado: título, descripción y funciones salen de la tarjeta de
 * cada demo en /demo (misma fuente que el catálogo); sector, público y
 * problema salen de `demoLinkedinAds.catalog`.
 */
export function useCatalogo(): KoptupDemo[] {
  const tDemos = useTranslations('demos');
  const tExtra = useTranslations('demosExtra');
  const tCat = useTranslations('demoLinkedinAds.catalog');

  return useMemo(
    () =>
      DEMOS_META.map((m) => {
        const tHub = m.hubNs === 'demos' ? tDemos : tExtra;
        return {
          id: m.id,
          slug: m.id,
          path: m.path,
          emoji: m.emoji,
          titulo: tHub(`${m.hubKey}.title`),
          tagline: tHub(`${m.hubKey}.description`),
          funciones: [0, 1, 2, 3].map((i) => tHub(`${m.hubKey}.features.${i}`)),
          industria: tCat(`${m.id}.industria`),
          publicoObjetivo: tCat.raw(`${m.id}.publico`) as string[],
          problemaResuelve: tCat(`${m.id}.problema`),
          hashtagsEspecificos: m.hashtags,
        };
      }),
    [tDemos, tExtra, tCat],
  );
}

export function usePlantillas(): Plantillas {
  const t = useTranslations('demoLinkedinAds');
  return useMemo(() => t.raw('templates') as Plantillas, [t]);
}
