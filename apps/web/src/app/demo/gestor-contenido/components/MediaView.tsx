'use client';

import { useRef, useState, type MouseEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { mediaSrc } from '../lib/art';
import { titleOf } from '../lib/models';
import { can } from '../lib/permissions';
import { mediaUsage } from '../lib/reducer';
import { useCms } from '../lib/store';
import { normalize } from '../lib/text';
import { iso } from '../lib/time';
import { imageFileToMedia, MAX_UPLOAD_MB } from '../lib/upload';
import type { Media } from '../lib/types';
import { btn, card, Empty, inputCls, labelCls, Modal, Note } from './ui';

const CROPS = [
  { id: 'web', ratio: 'aspect-video' },
  { id: 'app', ratio: 'aspect-[4/5]' },
  { id: 'social', ratio: 'aspect-square' },
] as const;

function MediaDetail({ media, onClose }: { media: Media; onClose: () => void }) {
  const t = useTranslations('demoCms.media');
  const { state, me, act, toast, openEntry, contentLocale } = useCms();
  const usage = mediaUsage(state, media.id);
  const canDel = can(me.role, 'media.delete');
  const canEditMeta = can(me.role, 'media.upload');
  const setFocal = (e: MouseEvent<HTMLDivElement>) => {
    if (!canEditMeta) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 100);
    const y = Math.round(((e.clientY - r.top) / r.height) * 100);
    act({ type: 'media.update', id: media.id, patch: { focal: { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) } } });
  };
  const src = mediaSrc(media);
  return (
    <Modal
      title={media.name}
      subtitle={t('meta', { w: media.width, h: media.height, kb: media.sizeKb })}
      onClose={onClose}
      size="lg"
      labelId="cms-media-detail"
      footer={
        <>
          <button
            type="button"
            className={btn.danger}
            disabled={!canDel || usage.length > 0}
            title={usage.length > 0 ? t('inUse') : !canDel ? t('noDeletePerm') : undefined}
            onClick={() => {
              act({ type: 'media.remove', id: media.id });
              toast(t('removed'));
              onClose();
            }}
          >
            {t('delete')}
          </button>
          <button type="button" className={btn.outline} onClick={onClose}>
            {t('close')}
          </button>
        </>
      }
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-crosshair" onClick={setFocal} role="presentation">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={media.alt[contentLocale]} className="w-full aspect-video object-cover" />
            <span className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full border-2 border-white bg-pink-600/80 shadow" style={{ left: `${media.focal.x}%`, top: `${media.focal.y}%` }} aria-hidden="true" />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('focalHint', { x: media.focal.x, y: media.focal.y })}</p>
          <div className="grid grid-cols-3 gap-2">
            {CROPS.map((c) => (
              <figure key={c.id} className="space-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className={`w-full ${c.ratio} object-cover rounded-md border border-slate-200 dark:border-slate-700`} style={{ objectPosition: `${media.focal.x}% ${media.focal.y}%` }} />
                <figcaption className="text-[11px] text-center text-slate-500 dark:text-slate-400">{t(`crops.${c.id}`)}</figcaption>
              </figure>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {(['es', 'en'] as const).map((l) => (
            <div key={l}>
              <label htmlFor={`cms-alt-${l}`} className={labelCls}>
                {t('alt')} ({l.toUpperCase()})
              </label>
              <textarea
                id={`cms-alt-${l}`}
                rows={2}
                value={media.alt[l]}
                readOnly={!canEditMeta}
                onChange={(e) => act({ type: 'media.update', id: media.id, patch: { alt: { ...media.alt, [l]: e.target.value } } })}
                className={inputCls}
                placeholder={t('altPlaceholder')}
              />
            </div>
          ))}
          <Note>{t('altNote')}</Note>
          <div>
            <p className={labelCls}>{t('usedIn')}</p>
            {usage.length === 0 ? (
              <p className="text-sm text-slate-500">{t('unused')}</p>
            ) : (
              <ul className="space-y-1">
                {usage.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      className="text-sm text-pink-700 dark:text-pink-300 hover:underline text-left"
                      onClick={() => {
                        onClose();
                        openEntry(e.id);
                      }}
                    >
                      {titleOf(e, e.content, contentLocale)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function MediaView() {
  const t = useTranslations('demoCms.media');
  const { state, me, act, toast, newId, contentLocale } = useCms();
  const [q, setQ] = useState('');
  const [onlyNoAlt, setOnlyNoAlt] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const list = state.media.filter((m) => (!q || normalize(m.name).includes(normalize(q))) && (!onlyNoAlt || !m.alt[contentLocale].trim()));
  const detail = open ? state.media.find((m) => m.id === open) : undefined;
  const noAlt = state.media.filter((m) => !m.alt[contentLocale].trim()).length;

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    const r = await imageFileToMedia(file, newId('m'), iso(Date.now()));
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
    if (typeof r === 'string') {
      toast(t(`errors.${r}`, { mb: MAX_UPLOAD_MB }), 'warn');
      return;
    }
    act({ type: 'media.add', media: r });
    toast(t('uploaded'));
    setOpen(r.id);
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('title')}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">{t('subtitle', { n: state.media.length, missing: noAlt })}</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} aria-label={t('upload')} />
        <button type="button" className={btn.primary} onClick={() => fileRef.current?.click()} disabled={busy || !can(me.role, 'media.upload')}>
          <ArrowUpTrayIcon className="w-4 h-4" />
          {busy ? t('uploading') : t('upload')}
        </button>
      </div>
      <div className={`${card} p-3 flex flex-wrap items-center gap-3`}>
        <div className="relative flex-1 min-w-[12rem]">
          <label htmlFor="cms-media-q" className="sr-only">
            {t('search')}
          </label>
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input id="cms-media-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')} className={`${inputCls} pl-9`} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input type="checkbox" className="rounded text-pink-600" checked={onlyNoAlt} onChange={(e) => setOnlyNoAlt(e.target.checked)} />
          {t('onlyNoAlt')}
        </label>
      </div>
      {list.length === 0 ? (
        <div className={card}>
          <Empty>{t('empty')}</Empty>
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {list.map((m) => {
            const used = mediaUsage(state, m.id).length;
            return (
              <li key={m.id}>
                <button type="button" onClick={() => setOpen(m.id)} className={`${card} w-full text-left overflow-hidden hover:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-500`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaSrc(m)} alt={m.alt[contentLocale]} className="w-full aspect-video object-cover" style={{ objectPosition: `${m.focal.x}% ${m.focal.y}%` }} />
                  <span className="block px-3 pt-2 text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{m.name}</span>
                  <span className="block px-3 pb-2 text-[11px] text-slate-500 dark:text-slate-400">
                    {t('usedCount', { n: used })} · {m.source === 'upload' ? t('uploadedTag') : t('sampleTag')}
                  </span>
                  {!m.alt[contentLocale].trim() && <span className="block px-3 pb-2 -mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">{t('noAlt')}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <Note>{t('note')}</Note>
      {detail && <MediaDetail media={detail} onClose={() => setOpen(null)} />}
    </div>
  );
}
