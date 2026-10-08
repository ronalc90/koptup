/**
 * Mensajes reales de la web para las pruebas, combinados igual que en
 * src/app/layout.tsx y src/i18n/request.ts: base del idioma + agregados de
 * demos y de ofertas (los agregados los genera scripts/merge-messages.mjs,
 * que corre en "pretest").
 */
import esBase from '../../messages/es.json';
import esDemos from '../../messages/_demos.es.json';
import esOfferings from '../../messages/_offerings.es.json';
import enBase from '../../messages/en.json';
import enDemos from '../../messages/_demos.en.json';
import enOfferings from '../../messages/_offerings.en.json';

export type TestLocale = 'es' | 'en';

export type Messages = Record<string, unknown>;

const MESSAGES: Record<TestLocale, Messages> = {
  es: { ...esBase, ...esDemos, ...esOfferings },
  en: { ...enBase, ...enDemos, ...enOfferings },
};

export function getTestMessages(locale: TestLocale = 'es'): Messages {
  return MESSAGES[locale];
}
