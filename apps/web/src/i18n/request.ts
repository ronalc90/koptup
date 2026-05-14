import fs from 'fs';
import path from 'path';
import { headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

function getLocaleFromCookie(cookieHeader?: string | null) {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(/(?:^|; )locale=([^;]+)/);
  return match ? match[1] : undefined;
}

function loadDirMessages(subdir: string, locale: string): Record<string, any> {
  const dir = path.join(process.cwd(), 'messages', subdir);
  const out: Record<string, any> = {};
  try {
    if (!fs.existsSync(dir)) return out;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(`.${locale}.json`));
    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(dir, file), 'utf8');
        const json = JSON.parse(raw);
        Object.assign(out, json);
      } catch (e) {
        console.error(`[i18n] failed to load ${subdir} messages: ${file}`, e);
      }
    }
  } catch (e) {
    console.error(`[i18n] failed to read ${subdir} dir`, e);
  }
  return out;
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

  const demoMessages = loadDirMessages('demos', locale);
  const offeringMessages = loadDirMessages('offerings', locale);
  messages = { ...messages, ...demoMessages, ...offeringMessages };

  return {
    locale,
    messages,
  };
});
