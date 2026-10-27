'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownIcon, ArrowUpIcon, TrashIcon } from '@heroicons/react/24/outline';
import { mediaSrc } from '../lib/art';
import { useCms } from '../lib/store';
import { isSafeHref } from '../lib/text';
import { BLOCK_KINDS, type Block, type BlockKind, type HeadingLevel, type L10n, type Locale } from '../lib/types';
import { MediaPicker } from './Fields';
import RichText from './RichText';
import { btn, inputCls, labelCls, selectCls } from './ui';

function emptyBlock(kind: BlockKind, id: string): Block {
  const e = (): L10n => ({ es: '', en: '' });
  switch (kind) {
    case 'heading':
      return { id, kind, level: 2, text: e() };
    case 'paragraph':
      return { id, kind, html: e() };
    case 'image':
      return { id, kind, mediaId: null, caption: e() };
    case 'button':
      return { id, kind, label: e(), href: '/' };
    case 'faq':
      return { id, kind, question: e(), answer: e() };
  }
}

export default function BlocksEditor({ blocks, locale, readOnly, onChange }: { blocks: Block[]; locale: Locale; readOnly: boolean; onChange: (b: Block[]) => void }) {
  const t = useTranslations('demoCms.blocks');
  const { newId, state, contentLocale } = useCms();
  const [picking, setPicking] = useState<string | null>(null);

  const update = (id: string, fn: (b: Block) => Block) => onChange(blocks.map((b) => (b.id === id ? fn(b) : b)));
  const setL = (v: L10n, s: string): L10n => ({ ...v, [locale]: s });
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {blocks.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">{t('empty')}</p>}
      {blocks.map((b, i) => (
        <div key={b.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex-1">
              {i + 1}. {t(`kinds.${b.kind}`)}
            </span>
            {!readOnly && (
              <>
                <button type="button" className={btn.ghost} onClick={() => move(i, -1)} disabled={i === 0} aria-label={t('moveUp')} title={t('moveUp')}>
                  <ArrowUpIcon className="w-4 h-4" />
                </button>
                <button type="button" className={btn.ghost} onClick={() => move(i, 1)} disabled={i === blocks.length - 1} aria-label={t('moveDown')} title={t('moveDown')}>
                  <ArrowDownIcon className="w-4 h-4" />
                </button>
                <button type="button" className={btn.ghost} onClick={() => onChange(blocks.filter((x) => x.id !== b.id))} aria-label={t('remove')} title={t('remove')}>
                  <TrashIcon className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          <div className="p-3 space-y-2">
            {b.kind === 'heading' && (
              <div className="flex flex-wrap gap-2">
                <select
                  aria-label={t('level')}
                  value={b.level}
                  disabled={readOnly}
                  onChange={(e) => update(b.id, (x) => (x.kind === 'heading' ? { ...x, level: Number(e.target.value) as HeadingLevel } : x))}
                  className={`${selectCls} w-auto`}
                >
                  <option value={1}>H1</option>
                  <option value={2}>H2</option>
                  <option value={3}>H3</option>
                </select>
                <input
                  aria-label={t('kinds.heading')}
                  value={b.text[locale]}
                  placeholder={locale === 'en' ? b.text.es : ''}
                  readOnly={readOnly}
                  onChange={(e) => update(b.id, (x) => (x.kind === 'heading' ? { ...x, text: setL(x.text, e.target.value) } : x))}
                  className={`${inputCls} flex-1 min-w-[12rem] font-bold ${b.level === 1 ? 'text-xl' : b.level === 2 ? 'text-lg' : 'text-base'}`}
                />
              </div>
            )}
            {b.kind === 'paragraph' && (
              <RichText
                key={`${b.id}-${locale}`}
                html={b.html[locale]}
                readOnly={readOnly}
                label={`${t('kinds.paragraph')} ${i + 1}`}
                placeholder={locale === 'en' && b.html.es ? t('translatePlaceholder') : t('paragraphPlaceholder')}
                onChange={(html) => update(b.id, (x) => (x.kind === 'paragraph' ? { ...x, html: setL(x.html, html) } : x))}
              />
            )}
            {b.kind === 'image' && (
              <div className="flex flex-wrap gap-3 items-start">
                <div className="w-40 aspect-video rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {(() => {
                    const m = b.mediaId ? state.media.find((x) => x.id === b.mediaId) : undefined;
                    return m ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaSrc(m)} alt={m.alt[contentLocale]} className="w-full h-full object-cover" style={{ objectPosition: `${m.focal.x}% ${m.focal.y}%` }} />
                    ) : null;
                  })()}
                </div>
                <div className="flex-1 min-w-[12rem] space-y-2">
                  {!readOnly && (
                    <button type="button" className={btn.small} onClick={() => setPicking(b.id)}>
                      {b.mediaId ? t('changeImage') : t('chooseImage')}
                    </button>
                  )}
                  <input
                    aria-label={t('caption')}
                    placeholder={t('caption')}
                    value={b.caption[locale]}
                    readOnly={readOnly}
                    onChange={(e) => update(b.id, (x) => (x.kind === 'image' ? { ...x, caption: setL(x.caption, e.target.value) } : x))}
                    className={inputCls}
                  />
                </div>
              </div>
            )}
            {b.kind === 'button' && (
              <div className="grid sm:grid-cols-2 gap-2">
                <div>
                  <span className={labelCls}>{t('buttonLabel')}</span>
                  <input
                    aria-label={t('buttonLabel')}
                    value={b.label[locale]}
                    placeholder={locale === 'en' ? b.label.es : ''}
                    readOnly={readOnly}
                    onChange={(e) => update(b.id, (x) => (x.kind === 'button' ? { ...x, label: setL(x.label, e.target.value) } : x))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <span className={labelCls}>{t('buttonHref')}</span>
                  <input
                    aria-label={t('buttonHref')}
                    value={b.href}
                    readOnly={readOnly}
                    onChange={(e) => update(b.id, (x) => (x.kind === 'button' ? { ...x, href: e.target.value } : x))}
                    className={`${inputCls} ${b.href && !isSafeHref(b.href) ? 'border-red-400' : ''}`}
                  />
                  {b.href && !isSafeHref(b.href) && <p className="text-[11px] text-red-600 mt-0.5">{t('badHref')}</p>}
                </div>
              </div>
            )}
            {b.kind === 'faq' && (
              <div className="space-y-2">
                <input
                  aria-label={t('question')}
                  placeholder={t('question')}
                  value={b.question[locale]}
                  readOnly={readOnly}
                  onChange={(e) => update(b.id, (x) => (x.kind === 'faq' ? { ...x, question: setL(x.question, e.target.value) } : x))}
                  className={`${inputCls} font-semibold`}
                />
                <textarea
                  aria-label={t('answer')}
                  placeholder={t('answer')}
                  value={b.answer[locale]}
                  readOnly={readOnly}
                  rows={3}
                  onChange={(e) => update(b.id, (x) => (x.kind === 'faq' ? { ...x, answer: setL(x.answer, e.target.value) } : x))}
                  className={inputCls}
                />
              </div>
            )}
          </div>
        </div>
      ))}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('add')}</span>
          {BLOCK_KINDS.map((k) => (
            <button key={k} type="button" className={btn.small} onClick={() => onChange([...blocks, emptyBlock(k, newId('b'))])}>
              + {t(`kinds.${k}`)}
            </button>
          ))}
        </div>
      )}
      {picking && (
        <MediaPicker
          onClose={() => setPicking(null)}
          onPick={(id) => {
            update(picking, (x) => (x.kind === 'image' ? { ...x, mediaId: id } : x));
            setPicking(null);
          }}
        />
      )}
    </div>
  );
}
