import { headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

function getLocaleFromCookie(cookieHeader?: string | null) {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(/(?:^|; )locale=([^;]+)/);
  return match ? match[1] : undefined;
}

async function loadAggregate(locale: string, name: 'demos' | 'offerings'): Promise<Record<string, any>> {
  try {
    const mod = await import(`../../messages/_${name}.${locale}.json`);
    return (mod as any).default ?? mod;
  } catch (err) {
    console.warn(`[i18n/request] no aggregate for ${name}.${locale} — corré "npm run merge-messages"`, err);
    return {};
  }
}

export default getRequestConfig(async () => {
  const h = headers();
  const headerLocale = h.get('x-locale') || undefined;
  const cookieLocale = getLocaleFromCookie(h.get('cookie'));
  const locale = headerLocale || cookieLocale || 'es';

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
