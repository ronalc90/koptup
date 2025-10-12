import { headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

function getLocaleFromCookie(cookieHeader?: string | null) {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(/(?:^|; )locale=([^;]+)/);
  return match ? match[1] : undefined;
}

export default getRequestConfig(async () => {
  const h = headers();
  const headerLocale = h.get('x-locale') || undefined;
  const cookieLocale = getLocaleFromCookie(h.get('cookie'));
  const locale = headerLocale || cookieLocale || 'es';

  // Cargar mensajes con fallback a 'es' si falla
  let messages: Record<string, any>;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (err) {
    console.error(`[i18n/request] Failed to load messages for "${locale}", falling back to "es".`, err);
    messages = (await import(`../../messages/es.json`)).default;
  }


  return {
    locale,
    messages,
  };
});
