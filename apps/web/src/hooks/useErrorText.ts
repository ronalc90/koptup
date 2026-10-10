'use client';

import { useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { describeError } from '@/lib/portal';

/**
 * Texto de error para mostrar en el portal o el panel: sin conexión,
 * demasiados intentos, falla del servidor o el mensaje del backend.
 * `generic` reemplaza el texto genérico cuando la sección tiene uno propio.
 */
export function useErrorText() {
  const tc = useTranslations('portalCommon');
  const locale = useLocale();
  return useCallback(
    (err: unknown, generic?: string) =>
      describeError(err, locale, {
        network: tc('errors.network'),
        rateLimited: tc('errors.rateLimited'),
        server: tc('errors.server'),
        generic: generic ?? tc('errors.generic'),
      }),
    [tc, locale],
  );
}
