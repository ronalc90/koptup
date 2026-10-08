'use client';

import { useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ChatBubbleLeftRightIcon, ComputerDesktopIcon, DevicePhoneMobileIcon, PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { mediaSrc } from '../lib/art';
import { assistantDocs, searchFaqs, type SearchHit } from '../lib/assistant';
import { pathOf, titleOf, typeOf } from '../lib/models';
import { COMPANY } from '../lib/seed';
import { useCms } from '../lib/store';
import { isL10n, pick, stripHtml } from '../lib/text';
import { formatDate } from '../lib/time';
import type { Block, Entry, EntryContent, FieldValue, L10n, Locale } from '../lib/types';
import { sanitizeHtml } from './RichText';

type Channel = 'web' | 'app';
type Device = 'desktop' | 'mobile';

function useText(locale: Locale) {
  return (v: FieldValue | undefined) => (isL10n(v) ? pick(v as L10n, locale) : typeof v === 'string' || typeof v === 'number' ? String(v) : '');
}

function Img({ id, className, ratio = 'aspect-video' }: { id: FieldValue | undefined; className?: string; ratio?: string }) {
  const { state, contentLocale } = useCms();
  const m = typeof id === 'string' ? state.media.find((x) => x.id === id) : undefined;
  if (!m) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={mediaSrc(m)} alt={pick(m.alt, contentLocale)} className={`w-full ${ratio} object-cover ${className ?? ''}`} style={{ objectPosition: `${m.focal.x}% ${m.focal.y}%` }} />
  );
}

function SafeHtml({ html, className }: { html: string; className?: string }) {
  const clean = useMemo(() => sanitizeHtml(html), [html]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}

function Blocks({ blocks, locale }: { blocks: Block[]; locale: Locale }) {
  return (
    <div className="space-y-3">
      {blocks.map((b) => {
        switch (b.kind) {
          case 'heading': {
            const cls = b.level === 1 ? 'text-2xl font-bold' : b.level === 2 ? 'text-xl font-bold' : 'text-lg font-semibold';
            const Tag = (['h1', 'h2', 'h3'] as const)[b.level - 1];
            return (
              <Tag key={b.id} className={`${cls} text-slate-900`}>
                {pick(b.text, locale)}
              </Tag>
            );
          }
          case 'paragraph':
            return <SafeHtml key={b.id} html={pick(b.html, locale)} className="text-slate-700 leading-relaxed [&_a]:text-sky-700 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2" />;
          case 'image':
            return (
              <figure key={b.id}>
                <Img id={b.mediaId} className="rounded-lg" />
                {pick(b.caption, locale) && <figcaption className="text-xs text-slate-500 mt-1">{pick(b.caption, locale)}</figcaption>}
              </figure>
            );
          case 'button':
            return (
              <a key={b.id} href={b.href} className="inline-block px-4 py-2 rounded-lg bg-sky-700 text-white text-sm font-semibold">
                {pick(b.label, locale)}
              </a>
            );
          case 'faq':
            return (
              <details key={b.id} className="rounded-lg border border-slate-200 p-3" open>
                <summary className="font-semibold text-slate-900 cursor-pointer">{pick(b.question, locale)}</summary>
                <p className="text-sm text-slate-700 mt-1">{pick(b.answer, locale)}</p>
              </details>
            );
        }
      })}
    </div>
  );
}

function SiteAssistant({ locale, onClose }: { locale: Locale; onClose: () => void }) {
  const t = useTranslations('demoCms.assistant');
  const { state, act } = useCms();
  const [q, setQ] = useState('');
  const [log, setLog] = useState<{ q: string; hit: SearchHit | null }[]>([]);
  const docs = assistantDocs(state, locale);
  const ask = (question: string) => {
    if (!question.trim()) return;
    const hit = searchFaqs(question, docs);
    setLog((l) => [...l, { q: question.trim(), hit }]);
    setQ('');
    if (hit) act({ type: 'tour.mark', step: 'rag' });
  };
  return (
    <div className="absolute bottom-3 right-3 left-3 sm:left-auto sm:w-80 rounded-xl border border-slate-200 bg-white shadow-2xl text-slate-800 flex flex-col max-h-[80%]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 bg-sky-700 text-white rounded-t-xl">
        <ChatBubbleLeftRightIcon className="w-4 h-4" />
        <span className="text-sm font-semibold flex-1">{t('title')}</span>
        <button type="button" onClick={onClose} aria-label={t('close')} className="p-1 rounded hover:bg-white/20">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="p-3 space-y-2 overflow-y-auto text-sm">
        <p className="text-[11px] text-slate-500">{t('disclaimer', { n: docs.length })}</p>
        {log.length === 0 && (
          <div className="flex flex-wrap gap-1">
            {[t('suggest1'), t('suggest2')].map((s) => (
              <button key={s} type="button" onClick={() => ask(s)} className="px-2 py-1 rounded-full border border-sky-200 text-sky-800 text-xs hover:bg-sky-50 text-left">
                {s}
              </button>
            ))}
          </div>
        )}
        {log.map((m, i) => (
          <div key={i} className="space-y-1">
            <p className="ml-6 rounded-lg bg-sky-50 px-2 py-1 text-slate-800">{m.q}</p>
            {m.hit ? (
              <div className="mr-6 rounded-lg bg-slate-100 px-2 py-1">
                <p>{m.hit.doc.answer}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {t('source', { title: m.hit.doc.question })}
                  {m.hit.doc.publishedAt && ` · ${t('publishedOn', { date: formatDate(m.hit.doc.publishedAt, locale) })}`}
                </p>
              </div>
            ) : (
              <p className="mr-6 rounded-lg bg-slate-100 px-2 py-1">{t('noAnswer')}</p>
            )}
          </div>
        ))}
      </div>
      <form
        className="flex gap-1 p-2 border-t border-slate-200"
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
      >
        <label className="sr-only" htmlFor="cms-site-assistant">
          {t('placeholder')}
        </label>
        <input id="cms-site-assistant" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('placeholder')} className="flex-1 min-w-0 px-2 py-1.5 rounded-md border border-slate-300 text-sm text-slate-900 bg-white" />
        <button type="submit" className="px-2 rounded-md bg-sky-700 text-white" aria-label={t('send')}>
          <PaperAirplaneIcon className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

/** Vista previa del sitio y de la app de ejemplo con el contenido de la entrada. */
export default function SitePreview({ entry, content, mode }: { entry: Entry; content: EntryContent; mode: 'draft' | 'live' }) {
  const t = useTranslations('demoCms.preview');
  const tNav = useTranslations('demoCms.preview.nav');
  const { state, contentLocale: locale, toast } = useCms();
  const [channel, setChannel] = useState<Channel>('web');
  const [device, setDevice] = useState<Device>('desktop');
  const [chat, setChat] = useState(false);
  const text = useText(locale);
  const f = content.fields;
  const type = typeOf(state.types, entry.type);
  const money = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  const refContent = (id: string) => {
    const e = state.entries.find((x) => x.id === id);
    const c = e ? (mode === 'live' ? e.live : e.content) : null;
    return e && c ? { e, c } : null;
  };
  const customs = type.fields.filter((d) => d.custom && f[d.id] !== '' && f[d.id] !== null && f[d.id] !== undefined && !(isL10n(f[d.id]) && !pick(f[d.id] as L10n, locale)));

  // Los enlaces del sitio de ejemplo no navegan: se explica a dónde irían.
  const intercept = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest('a');
    const button = (e.target as HTMLElement).closest('[data-wa]');
    if (button) {
      e.preventDefault();
      toast(t('whatsappSimulated', { phone: button.getAttribute('data-wa') ?? '' }), 'info');
      return;
    }
    if (a) {
      e.preventDefault();
      toast(t('linkSimulated', { href: a.getAttribute('href') ?? '' }), 'info');
    }
  };

  let body: ReactNode = null;
  switch (entry.type) {
    case 'page':
      body = (
        <>
          <Img id={f.heroImage} className="rounded-xl" ratio="aspect-[21/9]" />
          <h1 className="text-3xl font-bold text-slate-900">{text(f.title)}</h1>
          {text(f.summary) && <p className="text-lg text-slate-600">{text(f.summary)}</p>}
          <Blocks blocks={content.blocks} locale={locale} />
        </>
      );
      break;
    case 'article':
      body = (
        <>
          {text(f.category) && <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">{text(f.category)}</p>}
          <h1 className="text-3xl font-bold text-slate-900">{text(f.title)}</h1>
          <p className="text-xs text-slate-500">{entry.publishedAt && mode === 'live' ? formatDate(entry.publishedAt, locale) : t('notYetPublished')}</p>
          <Img id={f.cover} className="rounded-xl" />
          {text(f.excerpt) && <p className="text-lg text-slate-600">{text(f.excerpt)}</p>}
          <Blocks blocks={content.blocks} locale={locale} />
        </>
      );
      break;
    case 'location': {
      const services = (Array.isArray(f.services) ? f.services : []).map(refContent).filter((x): x is NonNullable<ReturnType<typeof refContent>> => !!x);
      body = (
        <>
          <Img id={f.photo} className="rounded-xl" />
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">{text(f.city)}</p>
          <h1 className="text-3xl font-bold text-slate-900">{text(f.name)}</h1>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-500">{t('address')}</p>
              <p className="text-sm text-slate-800">{text(f.address)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-500">{t('hours')}</p>
              <p className="text-sm text-slate-800">{text(f.hours)}</p>
            </div>
          </div>
          {text(f.whatsapp) && (
            <button type="button" data-wa={text(f.whatsapp)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold">
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              {t('whatsapp', { phone: text(f.whatsapp) })}
            </button>
          )}
          {text(f.description) && <p className="text-slate-700">{text(f.description)}</p>}
          {services.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">{t('servicesHere')}</h2>
              <ul className="grid sm:grid-cols-2 gap-2">
                {services.map(({ e, c }) => (
                  <li key={e.id} className="rounded-lg border border-slate-200 p-3">
                    <a href={pathOf('service', c.slug)} className="font-semibold text-sky-700">
                      {titleOf(e, c, locale)}
                    </a>
                    {typeof c.fields.priceFrom === 'number' && <p className="text-xs text-slate-500">{t('from', { price: money.format(c.fields.priceFrom) })}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      );
      break;
    }
    case 'service': {
      const where = state.entries.filter((x) => x.type === 'location' && (mode === 'live' ? x.live : x.content)).filter((x) => {
        const c = mode === 'live' ? x.live : x.content;
        return Array.isArray(c?.fields.services) && (c?.fields.services as string[]).includes(entry.id);
      });
      body = (
        <>
          <Img id={f.image} className="rounded-xl" />
          <h1 className="text-3xl font-bold text-slate-900">{text(f.name)}</h1>
          <p className="text-lg text-slate-600">{text(f.summary)}</p>
          {typeof f.priceFrom === 'number' && <p className="text-sm font-semibold text-slate-800">{t('from', { price: money.format(f.priceFrom) })}</p>}
          {text(f.preparation) && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs font-semibold text-amber-800">{t('preparation')}</p>
              <p className="text-sm text-amber-900">{text(f.preparation)}</p>
            </div>
          )}
          {where.length > 0 && (
            <p className="text-sm text-slate-700">
              {t('availableAt')}{' '}
              {where.map((x, i) => {
                const c = (mode === 'live' ? x.live : x.content) as EntryContent;
                return (
                  <span key={x.id}>
                    {i > 0 && ', '}
                    <a href={pathOf('location', c.slug)} className="text-sky-700 underline">
                      {titleOf(x, c, locale)}
                    </a>
                  </span>
                );
              })}
            </p>
          )}
        </>
      );
      break;
    }
    case 'faq': {
      const svc = typeof f.service === 'string' ? refContent(f.service) : null;
      body = (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">{t('faqSection')}</p>
          <details open className="rounded-xl border border-slate-200 p-4">
            <summary className="text-lg font-bold text-slate-900 cursor-pointer">{text(f.question)}</summary>
            <p className="text-slate-700 mt-2">{text(f.answer)}</p>
            {svc && (
              <a href={pathOf('service', svc.c.slug)} className="inline-block mt-2 text-sm text-sky-700 underline">
                {t('relatedService', { name: titleOf(svc.e, svc.c, locale) })}
              </a>
            )}
          </details>
          <p className="text-xs text-slate-500">{f.assistant === true ? t('assistantOn') : t('assistantOff')}</p>
        </>
      );
      break;
    }
  }

  const appSummary = text(f.summary) || text(f.excerpt) || text(f.hours) || text(f.answer) || stripHtml(content.blocks.map((b) => (b.kind === 'paragraph' ? pick(b.html, locale) : '')).join(' ')).slice(0, 140);
  const appImage = f.heroImage ?? f.cover ?? f.photo ?? f.image ?? null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden" role="group" aria-label={t('channel')}>
          {(['web', 'app'] as const).map((c) => (
            <button key={c} type="button" onClick={() => setChannel(c)} aria-pressed={channel === c} className={`px-3 py-1.5 text-xs font-semibold ${channel === c ? 'bg-pink-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'}`}>
              {t(`channels.${c}`)}
            </button>
          ))}
        </div>
        {channel === 'web' && (
          <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden" role="group" aria-label={t('device')}>
            {(['desktop', 'mobile'] as const).map((d) => {
              const Icon = d === 'desktop' ? ComputerDesktopIcon : DevicePhoneMobileIcon;
              return (
                <button key={d} type="button" onClick={() => setDevice(d)} aria-pressed={device === d} aria-label={t(`devices.${d}`)} title={t(`devices.${d}`)} className={`px-2.5 py-1.5 ${device === d ? 'bg-pink-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'}`}>
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        )}
        <span className="text-[11px] text-slate-500 dark:text-slate-400">{mode === 'draft' ? t('draftMode') : t('liveMode')}</span>
      </div>

      {channel === 'web' ? (
        <div className={`mx-auto transition-all ${device === 'mobile' ? 'max-w-[380px]' : 'w-full'}`}>
          <div className="rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden shadow-sm bg-white relative" onClick={intercept}>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border-b border-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="ml-2 text-[11px] text-slate-500 truncate">
                {COMPANY.domain}
                {locale === 'en' ? '/en' : ''}
                {pathOf(entry.type, content.slug)}
              </span>
            </div>
            {mode === 'draft' && <div className="bg-amber-100 text-amber-900 text-[11px] font-semibold text-center py-1">{t('draftRibbon')}</div>}
            <header className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 border-b border-slate-200">
              <span className="font-bold text-sky-800">Montaña Azul</span>
              {device === 'desktop' && (
                <nav className="flex flex-wrap gap-3 text-xs text-slate-600">
                  {(['home', 'locations', 'services', 'blog', 'faq'] as const).map((k) => (
                    <a key={k} href={k === 'home' ? '/' : `/${tNav(`${k}Path`)}`} className="hover:text-sky-700">
                      {tNav(k)}
                    </a>
                  ))}
                </nav>
              )}
            </header>
            <div className={`p-4 sm:p-6 space-y-4 ${device === 'mobile' ? 'text-[15px]' : ''}`}>
              {body}
              {customs.length > 0 && (
                <dl className="rounded-lg border border-slate-200 p-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  {customs.map((d) => (
                    <div key={d.id} className="contents">
                      <dt className="font-semibold text-slate-600">{d.custom ? d.custom.label[locale] || d.custom.label.es : d.id}</dt>
                      <dd className="text-slate-800">{typeof f[d.id] === 'boolean' ? (f[d.id] ? t('yes') : t('no')) : text(f[d.id])}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
            <footer className="px-4 py-3 border-t border-slate-200 text-[11px] text-slate-500">{t('footer')}</footer>
            <div className="min-h-[3rem]">
              {chat ? (
                <SiteAssistant locale={locale} onClose={() => setChat(false)} />
              ) : (
                <button type="button" onClick={() => setChat(true)} className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-sky-700 text-white text-xs font-semibold shadow-lg">
                  <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  {t('askAssistant')}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto w-[300px] max-w-full rounded-[2rem] border-8 border-slate-800 bg-slate-50 overflow-hidden shadow-lg" onClick={intercept}>
          <div className="bg-sky-800 text-white px-4 py-3 text-sm font-semibold">Montaña Azul</div>
          <div className="p-3 space-y-3">
            <div className="rounded-xl bg-white shadow-sm overflow-hidden">
              <Img id={appImage} />
              <div className="p-3">
                <p className="font-bold text-slate-900">{titleOf(entry, content, locale)}</p>
                <p className="text-sm text-slate-600 mt-1">{appSummary}</p>
                {entry.type === 'location' && text(f.whatsapp) && (
                  <button type="button" data-wa={text(f.whatsapp)} className="mt-2 w-full px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold">
                    {t('whatsappShort')}
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 text-center">{t('appNote')}</p>
          </div>
        </div>
      )}
      <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('simulatedNote')}</p>
    </div>
  );
}
