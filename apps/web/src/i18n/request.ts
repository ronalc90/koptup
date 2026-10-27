import { getRequestConfig } from 'next-intl/server';
import { isLocale, routing } from './routing';

async function loadAggregate(locale: string, name: 'demos' | 'offerings'): Promise<Record<string, any>> {
  try {
    const mod = await import(`../../messages/_${name}.${locale}.json`);
    return (mod as any).default ?? mod;
  } catch (err) {
    console.warn(`[i18n/request] no aggregate for ${name}.${locale} — corre "npm run merge-messages"`, err);
    return {};
  }
}

/**
 * Idioma de la petición: el segmento `[locale]` de la URL (lo fija el
 * middleware y `setRequestLocale` en el layout). Sin cookies ni cabeceras, así
 * las páginas públicas se generan una vez y quedan en caché.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isLocale(requested) ? requested : routing.defaultLocale;

  let messages: Record<string, any>;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (err) {
    console.error(`[i18n/request] Failed to load messages for "${locale}", falling back to "es".`, err);
    messages = (await import(`../../messages/es.json`)).default;
  }

  const [demoMessages, offeringMessages] = await Promise.all([
    loadAggregate(locale, 'demos'),
    loadAggregate(locale, 'offerings'),
  ]);
  messages = { ...messages, ...demoMessages, ...offeringMessages };

  return {
    locale,
    messages,
  };
});
