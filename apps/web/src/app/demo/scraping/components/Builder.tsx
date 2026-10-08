'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { notify } from '../lib/notify';
import {
  ArrowUturnLeftIcon, BeakerIcon, CursorArrowRaysIcon, PlusIcon, SparklesIcon, TrashIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  DEPARTMENTS, NORMS_TODAY, NORM_ENTITIES, PROCESSES_TODAY, SIMULATED_STORE_CHANGES, STORES, SUPPLIER_DOCS, catalogToday, storeHtml, type Store,
} from '../lib/data';
import { OPTIONAL_DOC_COLUMNS, docStatus, matchProcess } from '../lib/engine';
import { cop, norm, num, pct, type Loc } from '../lib/format';
import { buildSelector, extract, guessField, highlight, isValidSelector, quality, sanitizeHtml, type ExtractResult } from '../lib/selectors';
import { useDemo } from '../lib/store';
import { FIELD_TYPES, type Column, type Field, type FieldType, type SourceId } from '../lib/types';
import PagePreview, { type Device } from './PagePreview';
import { Chip, DataTable, Panel, Section, Toggle, btn, buildCsv, colLabel, downloadText, inputCls, type T } from './ui';

export default function Builder({ sourceId }: { sourceId: SourceId }) {
  if (sourceId === 'precios') return <WebBuilder />;
  if (sourceId === 'contratacion') return <RadarConfigPanel />;
  if (sourceId === 'normativa') return <NormConfigPanel />;
  return <DocsConfigPanel />;
}

/** Nombres sugeridos para las clases de la tienda de ejemplo. */
const NAME_HINTS: Record<string, { es: string; en: string }> = {
  'producto-nombre': { es: 'Producto', en: 'Product' },
  'producto-enlace': { es: 'Enlace', en: 'Link' },
  'precio-actual': { es: 'Precio', en: 'Price' },
  'precio-antes': { es: 'Precio anterior', en: 'Previous price' },
  stock: { es: 'Disponibilidad', en: 'Availability' },
  envio: { es: 'Envío', en: 'Shipping' },
  'producto-imagen': { es: 'Imagen', en: 'Image' },
  'producto-boton': { es: 'Botón', en: 'Button' },
  'tienda-nombre': { es: 'Tienda', en: 'Store' },
  'tienda-titulo': { es: 'Categoría', en: 'Category' },
  precios: { es: 'Precios', en: 'Prices' },
};

function suggestName(el: Element, loc: Loc): { name: string; type: FieldType } {
  const g = guessField(el);
  const hint = Array.from(el.classList).find((c) => NAME_HINTS[c]);
  return { name: hint ? NAME_HINTS[hint][loc] : g.name, type: el.classList.contains('stock') ? 'number' : g.type };
}

function fieldColumns(fields: Field[]): Column[] {
  return fields.map((f) => ({ key: f.id, label: f.name || '—', type: f.type, required: f.required }));
}

function usePreview(html: string, recordSelector: string, fields: Field[]): ExtractResult | null {
  const [res, setRes] = useState<ExtractResult | null>(null);
  useEffect(() => {
    if (!html) {
      setRes(null);
      return;
    }
    const doc = new DOMParser().parseFromString(html, 'text/html');
    setRes(extract(doc.body, recordSelector, fields));
  }, [html, recordSelector, fields]);
  return res;
}

// ---------------------------------------------------------------------------
// Constructor de la fuente de precios (tiendas ficticias)
// ---------------------------------------------------------------------------

function WebBuilder() {
  const t = useTranslations('demoScraping');
  const { s, loc, update, markTour } = useDemo();
  const [storeId, setStoreId] = useState<Store['id']>('b');
  const [device, setDevice] = useState<Device>('desktop');
  const [selecting, setSelecting] = useState(true);
  const [test, setTest] = useState<{ id: string; count: number } | null>(null);
  const [json, setJson] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const store = STORES.find((x) => x.id === storeId)!;
  const html = useMemo(() => storeHtml(store, catalogToday(s.simulated)[store.id]), [store, s.simulated]);
  const fields = s.fieldsDraft;
  const recordSelector = s.recordSelectorDraft;
  const preview = usePreview(html, recordSelector, fields);
  const dirty = JSON.stringify(fields) !== JSON.stringify(s.fieldsSaved) || recordSelector !== s.recordSelector;
  const recordValid = !recordSelector.trim() || isValidSelector(recordSelector);

  useEffect(() => setTest(null), [html, fields, recordSelector]);

  const setFields = (fn: (f: Field[]) => Field[]) => update((p) => ({ ...p, fieldsDraft: fn(p.fieldsDraft) }));

  const onPick = (el: Element) => {
    const root = rootRef.current;
    if (!root) return;
    const { selector, scope } = buildSelector(el, root, recordSelector);
    if (!selector) return;
    const existing = fields.find((f) => f.selector === selector && f.scope === scope);
    if (existing) {
      setTest({ id: existing.id, count: highlight(root, recordSelector, existing) });
      notify.info(t('builder.exists', { name: existing.name }));
      return;
    }
    const g = suggestName(el, loc);
    const field: Field = { id: `f${s.nextFieldId}`, name: g.name, selector, type: g.type, required: false, scope };
    update((p) => ({ ...p, fieldsDraft: [...p.fieldsDraft, field], nextFieldId: p.nextFieldId + 1 }));
    markTour('field');
    notify.success(t('builder.created', { name: field.name, selector }));
  };

  const runTest = (f: Field) => {
    const root = rootRef.current;
    if (!root) return;
    setTest({ id: f.id, count: highlight(root, recordSelector, f) });
  };

  const save = () => {
    update((p) => ({ ...p, fieldsSaved: p.fieldsDraft, recordSelector: p.recordSelectorDraft }));
    notify.success(t('builder.saved'));
  };

  const columns = fieldColumns(fields);
  const q = preview ? quality(preview.rows, fields.filter((f) => f.required).map((f) => f.id)) : 0;

  return (
    <Section
      title={t('builder.title')}
      subtitle={t('builder.subtitle')}
      right={
        <div className="flex flex-wrap items-center gap-2">
          {dirty && <span className="text-xs text-amber-300">{t('builder.unsaved')}</span>}
          <button type="button" className={btn.secondary} disabled={!dirty} onClick={() => update((p) => ({ ...p, fieldsDraft: p.fieldsSaved, recordSelectorDraft: p.recordSelector }))}>
            <ArrowUturnLeftIcon className="h-4 w-4" />
            {t('actions.discard')}
          </button>
          <button type="button" className={btn.primary} disabled={!dirty || !recordValid} onClick={save}>
            {t('builder.save')}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Panel className="xl:col-span-3" id="scraping-builder-preview">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1" role="group" aria-label={t('builder.storesLabel')}>
              {STORES.map((st) => (
                <Chip key={st.id} active={storeId === st.id} onClick={() => setStoreId(st.id)}>{st.name}</Chip>
              ))}
            </div>
            <div className="flex gap-1 rounded-md border border-secondary-800 bg-secondary-950 p-0.5" role="group" aria-label={t('builder.deviceLabel')}>
              {(['desktop', 'tablet', 'mobile'] as Device[]).map((d) => (
                <button key={d} type="button" aria-pressed={device === d} onClick={() => setDevice(d)} className={`rounded px-2 py-1 text-[11px] ${device === d ? 'bg-secondary-800 text-white' : 'text-secondary-400 hover:text-white'}`}>
                  {t(`builder.devices.${d}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary-950/60 px-3 py-2">
            <label className="flex items-center gap-2 text-xs text-secondary-200">
              <Toggle value={selecting} onChange={setSelecting} label={t('builder.selectMode')} />
              <CursorArrowRaysIcon className="h-4 w-4 text-amber-300" />
              {selecting ? t('builder.selectOn') : t('builder.selectOff')}
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={btn.secondary}
                disabled={s.simulated >= SIMULATED_STORE_CHANGES.length}
                onClick={() => {
                  const n = s.simulated + 1;
                  update((p) => ({ ...p, simulated: n }));
                  notify.success(t(`builder.simulate.done.${n}`));
                }}
              >
                <SparklesIcon className="h-4 w-4" />
                {s.simulated >= SIMULATED_STORE_CHANGES.length ? t('builder.simulate.none') : t('builder.simulate.button', { n: s.simulated + 1, total: SIMULATED_STORE_CHANGES.length })}
              </button>
              {s.simulated > 0 && (
                <button type="button" className={btn.ghost} onClick={() => update((p) => ({ ...p, simulated: 0 }))}>
                  {t('builder.simulate.reset')}
                </button>
              )}
            </div>
          </div>
          <PagePreview
            html={html}
            address={`https://${store.domain}/herramientas`}
            device={device}
            selecting={selecting}
            rootRef={rootRef}
            onPick={onPick}
            label={t('builder.previewLabel', { store: store.name })}
          />
          <p className="mt-2 text-[11px] text-secondary-500">{t('builder.previewNote')}</p>
        </Panel>

        <Panel className="xl:col-span-2">
          <label className="block text-xs font-semibold text-secondary-300">
            {t('builder.recordSelector')}
            <input
              value={recordSelector}
              onChange={(e) => update((p) => ({ ...p, recordSelectorDraft: e.target.value }))}
              className={`${inputCls} mt-1 font-mono text-xs ${recordValid ? '' : '!border-rose-500'}`}
              spellCheck={false}
            />
          </label>
          <p className="mt-1 text-[11px] text-secondary-500">
            {!recordValid ? t('builder.invalidSelector') : t('builder.recordHint', { count: preview?.recordCount ?? 0 })}
          </p>
          <div className="mb-2 mt-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">{t('builder.fieldsTitle', { count: fields.length })}</h3>
            <button
              type="button"
              className={btn.ghost}
              onClick={() => update((p) => ({ ...p, fieldsDraft: [...p.fieldsDraft, { id: `f${p.nextFieldId}`, name: t('builder.newFieldName'), selector: '', type: 'text', required: false, scope: 'record' }], nextFieldId: p.nextFieldId + 1 }))}
            >
              <PlusIcon className="h-3.5 w-3.5" />
              {t('builder.addField')}
            </button>
          </div>
          <FieldList
            fields={fields}
            setFields={setFields}
            preview={preview}
            test={test}
            onTest={runTest}
            t={t}
            loc={loc}
          />
          <p className="mt-3 text-[11px] text-secondary-500">{t('builder.fieldsHint')}</p>
        </Panel>
      </div>

      <Panel>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white">{t('builder.previewTitle', { store: store.name })}</h3>
            <p className="text-xs text-secondary-400">
              {t('builder.previewSummary', { rows: preview?.rows.length ?? 0, quality: pct(q, loc, Number.isInteger(q) ? 0 : 1) })}
            </p>
          </div>
          <div className="flex gap-1" role="group" aria-label={t('builder.viewLabel')}>
            <Chip active={!json} onClick={() => setJson(false)}>{t('builder.viewTable')}</Chip>
            <Chip active={json} onClick={() => setJson(true)}>JSON</Chip>
          </div>
        </div>
        {json ? (
          <pre className="max-h-80 overflow-auto rounded-lg border border-secondary-800 bg-secondary-950 p-3 font-mono text-[11px] text-cyan-200">
            {JSON.stringify((preview?.rows ?? []).map((r) => Object.fromEntries(fields.map((f) => [f.name, r[f.id]]))), null, 2)}
          </pre>
        ) : (
          <DataTable columns={columns} rows={preview?.rows ?? []} t={t} loc={loc} rowKey={(_, i) => String(i)} emptyText={t('builder.previewEmpty')} />
        )}
        <p className="mt-3 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-[11px] text-violet-100">{t('builder.aiNote')}</p>
      </Panel>

      <HtmlSandbox />
    </Section>
  );
}

function FieldList({ fields, setFields, preview, test, onTest, t, loc }: {
  fields: Field[];
  setFields: (fn: (f: Field[]) => Field[]) => void;
  preview: ExtractResult | null;
  test: { id: string; count: number } | null;
  onTest: (f: Field) => void;
  t: T;
  loc: Loc;
}) {
  const upd = (id: string, patch: Partial<Field>) => setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  if (fields.length === 0) return <p className="text-xs italic text-secondary-500">{t('builder.fieldsEmpty')}</p>;
  return (
    <ul className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
      {fields.map((f) => {
        const invalid = !!f.selector.trim() && !isValidSelector(f.selector);
        const err = preview?.errors.find((e) => e.fieldId === f.id);
        const first = preview?.rows.find((r) => r[f.id] !== null)?.[f.id];
        const matches = preview?.matches[f.id] ?? 0;
        return (
          <li key={f.id} className="space-y-1.5 rounded-md border border-secondary-800 bg-secondary-950 p-2.5">
            <div className="flex items-center gap-2">
              <input aria-label={t('builder.fieldName')} value={f.name} onChange={(e) => upd(f.id, { name: e.target.value })} className="min-w-0 flex-1 bg-transparent text-sm font-medium text-white outline-none focus:underline" />
              <select aria-label={t('builder.fieldType')} value={f.type} onChange={(e) => upd(f.id, { type: e.target.value as FieldType })} className="rounded border border-secondary-700 bg-secondary-900 px-1.5 py-0.5 text-[11px] text-secondary-200">
                {FIELD_TYPES.map((tp) => <option key={tp} value={tp}>{t(`builder.types.${tp}`)}</option>)}
              </select>
              <button type="button" onClick={() => setFields((p) => p.filter((x) => x.id !== f.id))} className="text-secondary-500 hover:text-rose-400" aria-label={t('builder.deleteField', { name: f.name })}>
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
            <input
              aria-label={t('builder.selector')}
              value={f.selector}
              placeholder={t('builder.selectorPlaceholder')}
              onChange={(e) => upd(f.id, { selector: e.target.value })}
              spellCheck={false}
              className={`block w-full rounded border bg-secondary-900 px-2 py-1 font-mono text-[11px] text-cyan-300 outline-none focus:border-emerald-500 ${invalid ? 'border-rose-500' : 'border-secondary-800'}`}
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-secondary-400">
              <select aria-label={t('builder.scope')} value={f.scope} onChange={(e) => upd(f.id, { scope: e.target.value as Field['scope'] })} className="rounded border border-secondary-700 bg-secondary-900 px-1 py-0.5 text-[11px] text-secondary-300">
                <option value="record">{t('builder.scopes.record')}</option>
                <option value="page">{t('builder.scopes.page')}</option>
              </select>
              <label className="flex cursor-pointer items-center gap-1">
                <input type="checkbox" checked={f.required} onChange={(e) => upd(f.id, { required: e.target.checked })} className="h-3 w-3 accent-emerald-500" />
                {t('builder.required')}
              </label>
              <button type="button" className={btn.ghost} onClick={() => onTest(f)} disabled={!f.selector.trim() || invalid}>
                <BeakerIcon className="h-3.5 w-3.5" />
                {t('builder.test')}
              </button>
            </div>
            <div className="truncate text-[11px]">
              {invalid || err?.kind === 'invalid' ? (
                <span className="text-rose-300">{t('builder.invalidSelector')}</span>
              ) : err?.kind === 'empty' ? (
                <span className="text-amber-300">{t('builder.emptySelector')}</span>
              ) : matches === 0 ? (
                <span className="text-amber-300">{t('builder.noMatches')}</span>
              ) : (
                <span className="text-secondary-400">
                  {t('builder.matchInfo', { count: matches })} · <span className="text-emerald-300">{formatSample(first, f.type, loc)}</span>
                </span>
              )}
              {test?.id === f.id && <span className="ml-2 text-emerald-300">{test.count < 0 ? t('builder.invalidSelector') : t('builder.testResult', { count: test.count })}</span>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function formatSample(v: unknown, type: FieldType, loc: Loc): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'number') return type === 'price' ? cop(v, loc) : num(v, loc, Number.isInteger(v) ? 0 : 2);
  return String(v);
}

// ---------------------------------------------------------------------------
// "Prueba con tu HTML": el mismo motor sobre el HTML que pegues (no se envía a ningún lado)
// ---------------------------------------------------------------------------

const SANDBOX_SAMPLE = `<h1>Directorio de proveedores (ejemplo)</h1>
<table class="tabla">
  <tr class="fila"><td class="nombre">Ferreléctricos Andinos Demo S.A.S.</td><td class="ciudad">Pereira</td><td class="telefono">Línea comercial</td><td class="precio">$ 1.250.000</td></tr>
  <tr class="fila"><td class="nombre">Pinturas y Recubrimientos Ejemplo Ltda.</td><td class="ciudad">Manizales</td><td class="telefono">Línea comercial</td><td class="precio">$ 980.500</td></tr>
  <tr class="fila"><td class="nombre">Tornillería Express Demo S.A.S.</td><td class="ciudad">Armenia</td><td class="telefono">Línea comercial</td><td class="precio">$ 312.900</td></tr>
</table>`;

function HtmlSandbox() {
  const t = useTranslations('demoScraping');
  const { loc } = useDemo();
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState('');
  const [html, setHtml] = useState('');
  const [info, setInfo] = useState<{ elements: number; removed: number; truncated: boolean } | null>(null);
  const [recordSelector, setRecordSelector] = useState('');
  const [fields, setFieldsState] = useState<Field[]>([]);
  const [nextId, setNextId] = useState(1);
  const [test, setTest] = useState<{ id: string; count: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const preview = usePreview(html, recordSelector, fields);

  const load = (text: string) => {
    const res = sanitizeHtml(text);
    setHtml(res.html);
    setInfo({ elements: res.elements, removed: res.removed, truncated: res.truncated });
    setFieldsState([]);
    setTest(null);
  };

  const onPick = (el: Element) => {
    const root = rootRef.current;
    if (!root) return;
    const { selector, scope } = buildSelector(el, root, recordSelector);
    if (!selector) return;
    if (fields.some((f) => f.selector === selector && f.scope === scope)) {
      notify.info(t('builder.exists', { name: selector }));
      return;
    }
    const g = guessField(el);
    setFieldsState((p) => [...p, { id: `u${nextId}`, name: g.name, selector, type: g.type, required: false, scope }]);
    setNextId((n) => n + 1);
    notify.success(t('builder.created', { name: g.name, selector }));
  };

  const columns = fieldColumns(fields);

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white">{t('sandbox.title')}</h3>
          <p className="text-xs text-secondary-400">{t('sandbox.subtitle')}</p>
        </div>
        <button type="button" className={btn.secondary} aria-expanded={open} onClick={() => setOpen((x) => !x)}>
          {open ? t('sandbox.close') : t('sandbox.open')}
        </button>
      </div>
      {open && (
        <div className="mt-4 space-y-4">
          <label className="block text-xs text-secondary-300">
            {t('sandbox.label')}
            <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={6} spellCheck={false} placeholder={t('sandbox.placeholder')} className={`${inputCls} mt-1 font-mono text-[11px]`} />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={btn.primary} disabled={!raw.trim()} onClick={() => load(raw)}>{t('sandbox.load')}</button>
            <button type="button" className={btn.secondary} onClick={() => { setRaw(SANDBOX_SAMPLE); load(SANDBOX_SAMPLE); setRecordSelector('tr.fila'); }}>{t('sandbox.useSample')}</button>
            {html && (
              <button type="button" className={btn.ghost} onClick={() => { setRaw(''); setHtml(''); setInfo(null); setFieldsState([]); setRecordSelector(''); }}>
                <XMarkIcon className="h-3.5 w-3.5" />
                {t('sandbox.clear')}
              </button>
            )}
          </div>
          <p className="text-[11px] text-secondary-500">{t('sandbox.privacy')}</p>
          {info && (
            <p className="text-xs text-secondary-300">
              {t('sandbox.info', { elements: info.elements, removed: info.removed })}
              {info.truncated && <span className="ml-1 text-amber-300">{t('sandbox.truncated')}</span>}
            </p>
          )}
          {html && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
              <div className="xl:col-span-3">
                <PagePreview html={html} address={t('sandbox.address')} device="desktop" selecting user rootRef={rootRef} onPick={onPick} label={t('sandbox.previewLabel')} />
              </div>
              <div className="space-y-3 xl:col-span-2">
                <label className="block text-xs font-semibold text-secondary-300">
                  {t('sandbox.recordSelector')}
                  <input value={recordSelector} onChange={(e) => setRecordSelector(e.target.value)} placeholder="tr.fila" spellCheck={false} className={`${inputCls} mt-1 font-mono text-xs`} />
                </label>
                <p className="text-[11px] text-secondary-500">{t('sandbox.recordHint')}</p>
                <FieldList
                  fields={fields}
                  setFields={(fn) => setFieldsState(fn)}
                  preview={preview}
                  test={test}
                  onTest={(f) => rootRef.current && setTest({ id: f.id, count: highlight(rootRef.current, recordSelector, f) })}
                  t={t}
                  loc={loc}
                />
              </div>
            </div>
          )}
          {html && fields.length > 0 && (
            <DataTable
              columns={columns}
              rows={preview?.rows ?? []}
              t={t}
              loc={loc}
              rowKey={(_, i) => String(i)}
              onDownload={() => downloadText('koptup-demo-tu-html.csv', buildCsv(columns, preview?.rows ?? [], t, loc), 'text/csv;charset=utf-8')}
            />
          )}
        </div>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Fuentes por API y documentos: se configuran criterios y columnas (sin selectores)
// ---------------------------------------------------------------------------

function RadarConfigPanel() {
  const t = useTranslations('demoScraping');
  const { s, loc, update } = useDemo();
  const [kw, setKw] = useState('');
  const radar = s.radar;
  const results = PROCESSES_TODAY.map((p) => ({ p, m: matchProcess(p, radar) }));
  const matched = results.filter((x) => x.m.ok).length;
  const setRadar = (patch: Partial<typeof radar>) => update((p) => ({ ...p, radar: { ...p.radar, ...patch } }));
  const addKw = () => {
    const v = kw.trim();
    if (!v || radar.keywords.some((k) => norm(k) === norm(v))) return;
    setRadar({ keywords: [...radar.keywords, v].slice(0, 15) });
    setKw('');
  };
  return (
    <Section title={t('radar.title')} subtitle={t('radar.subtitle')}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="space-y-4">
          <div>
            <h3 className="mb-2 text-xs font-semibold text-secondary-300">{t('radar.keywords')}</h3>
            <div className="flex flex-wrap gap-1.5">
              {radar.keywords.map((k) => (
                <span key={k} className="inline-flex items-center gap-1 rounded-full border border-secondary-700 bg-secondary-950 px-2 py-0.5 text-xs text-secondary-200">
                  {k}
                  <button type="button" aria-label={t('radar.removeKeyword', { keyword: k })} onClick={() => setRadar({ keywords: radar.keywords.filter((x) => x !== k) })} className="text-secondary-500 hover:text-rose-300">
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {radar.keywords.length === 0 && <span className="text-xs text-amber-300">{t('radar.noKeywords')}</span>}
            </div>
            <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); addKw(); }}>
              <input value={kw} onChange={(e) => setKw(e.target.value)} placeholder={t('radar.keywordPlaceholder')} className={inputCls} aria-label={t('radar.keywordPlaceholder')} />
              <button type="submit" className={btn.secondary} disabled={!kw.trim()}>{t('radar.add')}</button>
            </form>
          </div>
          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-secondary-300">{t('radar.departments')}</legend>
            <div className="grid grid-cols-2 gap-1.5">
              {DEPARTMENTS.map((d) => (
                <label key={d} className="flex items-center gap-2 text-xs text-secondary-200">
                  <input
                    type="checkbox"
                    checked={radar.departments.includes(d)}
                    onChange={(e) => setRadar({ departments: e.target.checked ? [...radar.departments, d] : radar.departments.filter((x) => x !== d) })}
                    className="h-3.5 w-3.5 accent-emerald-500"
                  />
                  {d}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-xs font-semibold text-secondary-300">
            {t('radar.minAmount')}
            <input
              type="number"
              min={0}
              step={1_000_000}
              value={radar.minAmount}
              onChange={(e) => setRadar({ minAmount: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
              className={`${inputCls} mt-1`}
            />
            <span className="mt-1 block font-normal text-secondary-500">{cop(radar.minAmount, loc)}</span>
          </label>
          <p className="text-[11px] text-secondary-500">{t('radar.simulatedNote')}</p>
        </Panel>
        <Panel className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-white">{t('radar.previewTitle', { matched, total: results.length })}</h3>
          <p className="mb-3 text-xs text-secondary-400">{t('radar.previewHint')}</p>
          <ul className="space-y-2">
            {results.map(({ p, m }) => (
              <li key={p.ref} className={`rounded-lg border p-2.5 text-xs ${m.ok ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-secondary-800 bg-secondary-950/60 opacity-80'}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="min-w-0 flex-1 text-secondary-100">{p.object}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${m.ok ? 'bg-emerald-500/20 text-emerald-200' : 'bg-secondary-800 text-secondary-300'}`}>{m.ok ? t('radar.fits') : t('radar.noFit')}</span>
                </div>
                <div className="mt-1 text-[11px] text-secondary-400">{p.ref} · {p.entity} · {p.city}, {p.department} · {cop(p.amount, loc)}</div>
                {!m.ok && (
                  <div className="mt-1 text-[11px] text-amber-300">
                    {[!m.keyword && t('radar.why.keyword'), !m.departmentOk && t('radar.why.department'), !m.amountOk && t('radar.why.amount')].filter(Boolean).join(' · ')}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </Section>
  );
}

function NormConfigPanel() {
  const t = useTranslations('demoScraping');
  const { s, update } = useDemo();
  const cfg = s.normativa;
  const kw = norm(cfg.keyword.trim());
  const docs = NORMS_TODAY.map((d) => ({ d, ok: cfg.entities.includes(d.entity) && (!kw || norm(`${d.title} ${d.number}`).includes(kw)) }));
  const setCfg = (patch: Partial<typeof cfg>) => update((p) => ({ ...p, normativa: { ...p.normativa, ...patch } }));
  return (
    <Section title={t('norm.title')} subtitle={t('norm.subtitle')}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="space-y-4">
          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-secondary-300">{t('norm.entities')}</legend>
            <div className="space-y-1.5">
              {NORM_ENTITIES.map((e) => (
                <label key={e} className="flex items-center gap-2 text-xs text-secondary-200">
                  <input type="checkbox" checked={cfg.entities.includes(e)} onChange={(ev) => setCfg({ entities: ev.target.checked ? [...cfg.entities, e] : cfg.entities.filter((x) => x !== e) })} className="h-3.5 w-3.5 accent-emerald-500" />
                  {e}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-xs font-semibold text-secondary-300">
            {t('norm.keyword')}
            <input value={cfg.keyword} onChange={(e) => setCfg({ keyword: e.target.value.slice(0, 60) })} placeholder={t('norm.keywordPlaceholder')} className={`${inputCls} mt-1`} />
          </label>
          <p className="text-[11px] text-secondary-500">{t('norm.simulatedNote')}</p>
        </Panel>
        <Panel className="lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-white">{t('norm.previewTitle', { followed: docs.filter((x) => x.ok).length, total: docs.length })}</h3>
          <ul className="space-y-2">
            {docs.map(({ d, ok }) => (
              <li key={d.id} className={`rounded-lg border p-2.5 text-xs ${ok ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-secondary-800 bg-secondary-950/60 opacity-80'}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="min-w-0 flex-1 text-secondary-100">{d.number} — {d.title}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${ok ? 'bg-emerald-500/20 text-emerald-200' : 'bg-secondary-800 text-secondary-300'}`}>{ok ? t('norm.followed') : t('norm.notFollowed')}</span>
                </div>
                <div className="mt-1 text-[11px] text-secondary-400">{d.entity}</div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </Section>
  );
}

function DocsConfigPanel() {
  const t = useTranslations('demoScraping');
  const { s, loc, update } = useDemo();
  const cfg = s.docs;
  const setCfg = (patch: Partial<typeof cfg>) => update((p) => ({ ...p, docs: { ...p.docs, ...patch } }));
  const sample = SUPPLIER_DOCS[0];
  return (
    <Section title={t('docsCfg.title')} subtitle={t('docsCfg.subtitle')}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="space-y-4">
          <label className="block text-xs font-semibold text-secondary-300">
            {t('docsCfg.threshold', { value: pct(cfg.threshold, loc) })}
            <input type="range" min={50} max={99} value={cfg.threshold} onChange={(e) => setCfg({ threshold: Number(e.target.value) })} className="mt-2 w-full accent-emerald-500" />
          </label>
          <p className="text-[11px] text-secondary-500">{t('docsCfg.thresholdHint')}</p>
          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-secondary-300">{t('docsCfg.columns')}</legend>
            <div className="space-y-1.5">
              {OPTIONAL_DOC_COLUMNS.map((c) => (
                <label key={c.key} className="flex items-center gap-2 text-xs text-secondary-200">
                  <input type="checkbox" checked={cfg.columns.includes(c.key)} onChange={(e) => setCfg({ columns: e.target.checked ? [...cfg.columns, c.key] : cfg.columns.filter((x) => x !== c.key) })} className="h-3.5 w-3.5 accent-emerald-500" />
                  {colLabel(c, t)}
                  {c.key === 'legalRep' && <span className="text-[10px] text-amber-300">{t('docsCfg.personalData')}</span>}
                </label>
              ))}
            </div>
          </fieldset>
          <p className="text-[11px] text-secondary-500">{t('docsCfg.simulatedNote')}</p>
        </Panel>
        <Panel className="lg:col-span-2 space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-white">{t('docsCfg.previewTitle')}</h3>
            <ul className="space-y-1.5">
              {SUPPLIER_DOCS.map((d) => {
                const st = docStatus(d, cfg.threshold);
                const review = st.status !== 'validated';
                return (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-secondary-800 bg-secondary-950/60 px-2.5 py-1.5 text-xs">
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-secondary-200">{d.file}</span>
                    <span className="text-secondary-400">{t('docsCfg.confidence', { value: pct(d.confidence, loc) })}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${review ? 'bg-amber-500/15 text-amber-200' : 'bg-emerald-500/15 text-emerald-200'}`}>{t(`values.docStatus.${st.status}`)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-white">{t('docsCfg.sampleTitle')}</h3>
            <div className="rounded-lg border border-secondary-800 bg-white p-3 font-mono text-[11px] leading-relaxed text-secondary-800">
              <div className="mb-1 font-sans text-xs font-bold">{t('docsCfg.sampleHeader')}</div>
              <div>{t('docsCfg.sampleNit')}: <mark className="bg-emerald-100">{sample.nit.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</mark> DV <mark className="bg-emerald-100">{sample.dvRead}</mark></div>
              <div>{t('docsCfg.sampleName')}: <mark className="bg-emerald-100">{sample.name}</mark></div>
              <div>{t('docsCfg.sampleCiiu')}: <mark className="bg-emerald-100">{sample.ciiu}</mark></div>
              <div>{t('docsCfg.sampleRep')}: <mark className="bg-amber-100">{sample.legalRep}</mark></div>
            </div>
            <p className="mt-1 text-[11px] text-secondary-500">{t('docsCfg.sampleNote')}</p>
          </div>
        </Panel>
      </div>
    </Section>
  );
}
