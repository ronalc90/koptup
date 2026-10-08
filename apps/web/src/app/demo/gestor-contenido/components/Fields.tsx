'use client';

import { useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpTrayIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { mediaSrc } from '../lib/art';
import { titleOf } from '../lib/models';
import { can } from '../lib/permissions';
import { useCms } from '../lib/store';
import { isL10n } from '../lib/text';
import { iso } from '../lib/time';
import { imageFileToMedia, MAX_UPLOAD_MB } from '../lib/upload';
import type { FieldDef, FieldValue, L10n, Locale, TypeId } from '../lib/types';
import { btn, inputCls, labelCls, Modal, selectCls, Switch } from './ui';

/** Etiqueta visible de un campo (base o agregado en "Modelos de contenido"). */
export function useFieldLabel() {
  const t = useTranslations('demoCms.fields');
  const { contentLocale } = useCms();
  return (type: TypeId, def: FieldDef) => (def.custom ? def.custom.label[contentLocale] || def.custom.label.es : t(`${type}.${def.id}`));
}

export function MediaPicker({ onPick, onClose }: { onPick: (id: string) => void; onClose: () => void }) {
  const t = useTranslations('demoCms.media');
  const { state, me, act, newId, toast, contentLocale } = useCms();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    const r = await imageFileToMedia(file, newId('m'), iso(Date.now()));
    setBusy(false);
    if (typeof r === 'string') {
      toast(t(`errors.${r}`, { mb: MAX_UPLOAD_MB }), 'warn');
      return;
    }
    act({ type: 'media.add', media: r });
    toast(t('uploaded'));
    onPick(r.id);
  };
  return (
    <Modal
      title={t('pickTitle')}
      onClose={onClose}
      labelId="cms-media-picker"
      size="lg"
      footer={
        <>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} aria-label={t('upload')} />
          <button type="button" className={btn.outline} onClick={() => fileRef.current?.click()} disabled={busy || !can(me.role, 'media.upload')}>
            <ArrowUpTrayIcon className="w-4 h-4" />
            {busy ? t('uploading') : t('upload')}
          </button>
          <button type="button" className={btn.outline} onClick={onClose}>
            {t('close')}
          </button>
        </>
      }
    >
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {state.media.map((m) => (
          <li key={m.id}>
            <button type="button" onClick={() => onPick(m.id)} className="w-full text-left rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaSrc(m)} alt={m.alt[contentLocale]} className="w-full aspect-video object-cover" style={{ objectPosition: `${m.focal.x}% ${m.focal.y}%` }} />
              <span className="block px-2 py-1 text-xs text-slate-700 dark:text-slate-200 truncate">{m.name}</span>
              {!m.alt[contentLocale].trim() && <span className="block px-2 pb-1 text-[11px] text-amber-700 dark:text-amber-300">{t('noAlt')}</span>}
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

function ImageField({ value, onChange, readOnly, label }: { value: string | null; onChange: (v: string | null) => void; readOnly: boolean; label: string }) {
  const t = useTranslations('demoCms.media');
  const { state, contentLocale } = useCms();
  const [open, setOpen] = useState(false);
  const m = value ? state.media.find((x) => x.id === value) : undefined;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="w-28 aspect-video rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
        {m ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaSrc(m)} alt={m.alt[contentLocale]} className="w-full h-full object-cover" style={{ objectPosition: `${m.focal.x}% ${m.focal.y}%` }} />
        ) : (
          <PhotoIcon className="w-6 h-6 text-slate-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-700 dark:text-slate-200 truncate">{m ? m.name : t('none')}</p>
        {m && !m.alt[contentLocale].trim() && <p className="text-[11px] text-amber-700 dark:text-amber-300">{t('noAlt')}</p>}
        {!readOnly && (
          <div className="flex gap-2 mt-1">
            <button type="button" className={btn.small} onClick={() => setOpen(true)} aria-label={`${t('choose')}: ${label}`}>
              {m ? t('change') : t('choose')}
            </button>
            {m && (
              <button type="button" className={btn.small} onClick={() => onChange(null)}>
                {t('remove')}
              </button>
            )}
          </div>
        )}
      </div>
      {open && (
        <MediaPicker
          onClose={() => setOpen(false)}
          onPick={(id) => {
            onChange(id);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

/** Un campo del formulario según su tipo. */
export function FieldInput({
  type,
  def,
  value,
  locale,
  readOnly,
  onChange,
}: {
  type: TypeId;
  def: FieldDef;
  value: FieldValue | undefined;
  locale: Locale;
  readOnly: boolean;
  onChange: (v: FieldValue) => void;
}) {
  const t = useTranslations('demoCms.editor');
  const label = useFieldLabel()(type, def);
  const { state } = useCms();
  const id = useId();
  const reqMark = def.required ? <span className="text-pink-600"> *</span> : null;
  const sharedNote = !def.localized && def.kind !== 'boolean' ? <span className="font-normal text-slate-400"> · {t('sharedAllLangs')}</span> : null;

  if ((def.kind === 'text' || def.kind === 'longText') && def.localized) {
    const v: L10n = isL10n(value) ? value : { es: '', en: '' };
    const current = v[locale];
    const set = (s: string) => onChange({ ...v, [locale]: s });
    const tooLong = !!def.max && current.length > def.max;
    return (
      <div>
        <label htmlFor={id} className={labelCls}>
          {label}
          {reqMark} <span className="font-normal text-slate-400">({locale.toUpperCase()})</span>
        </label>
        {def.kind === 'text' ? (
          <input id={id} value={current} onChange={(e) => set(e.target.value)} readOnly={readOnly} className={inputCls} placeholder={locale === 'en' ? v.es : ''} />
        ) : (
          <textarea id={id} value={current} onChange={(e) => set(e.target.value)} readOnly={readOnly} rows={3} className={inputCls} placeholder={locale === 'en' ? v.es : ''} />
        )}
        <div className="flex flex-wrap justify-between gap-2 mt-0.5">
          {locale === 'en' && !current.trim() && v.es.trim() ? (
            <span className="text-[11px] text-amber-700 dark:text-amber-300">
              {t('fallbackNote')}{' '}
              {!readOnly && (
                <button type="button" className="underline font-semibold" onClick={() => set(v.es)}>
                  {t('copyFromEs')}
                </button>
              )}
            </span>
          ) : (
            <span />
          )}
          {def.max && <span className={`text-[11px] ${tooLong ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>{t('chars', { n: current.length, max: def.max })}</span>}
        </div>
      </div>
    );
  }

  if (def.kind === 'boolean') {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
        <span className="text-sm text-slate-700 dark:text-slate-200">
          {label}
          {def.id === 'assistant' && <span className="block text-[11px] text-slate-500 dark:text-slate-400">{t('assistantHint')}</span>}
        </span>
        <Switch checked={value === true} onChange={(b) => onChange(b)} label={label} disabled={readOnly} />
      </div>
    );
  }

  if (def.kind === 'image') {
    return (
      <div>
        <span className={labelCls}>
          {label}
          {reqMark}
          {sharedNote}
        </span>
        <ImageField value={typeof value === 'string' ? value : null} onChange={onChange} readOnly={readOnly} label={label} />
      </div>
    );
  }

  if (def.kind === 'reference' || def.kind === 'references') {
    const options = state.entries.filter((e) => e.type === def.refType);
    if (def.kind === 'reference') {
      return (
        <div>
          <label htmlFor={id} className={labelCls}>
            {label}
            {reqMark}
          </label>
          <select id={id} value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value || null)} disabled={readOnly} className={selectCls}>
            <option value="">{t('noReference')}</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {titleOf(o, o.content, locale)}
              </option>
            ))}
          </select>
        </div>
      );
    }
    const selected = Array.isArray(value) ? value : [];
    return (
      <fieldset>
        <legend className={labelCls}>
          {label}
          {reqMark}
          {sharedNote}
        </legend>
        <div className="grid sm:grid-cols-2 gap-1">
          {options.map((o) => (
            <label key={o.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                className="rounded text-pink-600"
                checked={selected.includes(o.id)}
                disabled={readOnly}
                onChange={(e) => onChange(e.target.checked ? [...selected, o.id] : selected.filter((x) => x !== o.id))}
              />
              <span className="truncate">{titleOf(o, o.content, locale)}</span>
              {!o.live && <span className="text-[10px] text-slate-400">{t('notPublished')}</span>}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  const inputType = def.kind === 'number' ? 'number' : def.kind === 'date' ? 'date' : def.kind === 'phone' ? 'tel' : 'text';
  const raw = value === null || value === undefined ? '' : String(value);
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
        {reqMark}
        {sharedNote}
      </label>
      {def.kind === 'longText' ? (
        <textarea id={id} value={raw} onChange={(e) => onChange(e.target.value)} readOnly={readOnly} rows={3} className={inputCls} />
      ) : (
        <input
          id={id}
          type={inputType}
          inputMode={def.kind === 'number' ? 'numeric' : undefined}
          min={def.kind === 'number' ? 0 : undefined}
          value={raw}
          onChange={(e) => onChange(def.kind === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}
          readOnly={readOnly}
          className={inputCls}
        />
      )}
      {def.id === 'priceFrom' && typeof value === 'number' && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)}</p>
      )}
    </div>
  );
}
