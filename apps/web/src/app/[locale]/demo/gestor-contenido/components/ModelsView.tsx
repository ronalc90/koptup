'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { typeOf } from '../lib/models';
import { can } from '../lib/permissions';
import { useCms } from '../lib/store';
import { slugify } from '../lib/text';
import { CUSTOM_FIELD_KINDS, TYPE_IDS, type CustomFieldKind, type TypeId } from '../lib/types';
import { useFieldLabel } from './Fields';
import { btn, card, inputCls, labelCls, Modal, Note, selectCls } from './ui';

function toApiId(label: string): string {
  const parts = slugify(label).split('-').filter(Boolean);
  return parts.map((p, i) => (i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1))).join('').slice(0, 32);
}

export default function ModelsView() {
  const t = useTranslations('demoCms.models');
  const tTypes = useTranslations('demoCms.types');
  const tKinds = useTranslations('demoCms.kinds');
  const { state, me, act, toast } = useCms();
  const fieldLabel = useFieldLabel();
  const [sel, setSel] = useState<TypeId>('location');
  const [adding, setAdding] = useState(false);
  const [labelEs, setLabelEs] = useState('');
  const [labelEn, setLabelEn] = useState('');
  const [kind, setKind] = useState<CustomFieldKind>('text');
  const [required, setRequired] = useState(false);
  const [localized, setLocalized] = useState(true);
  const admin = can(me.role, 'models.manage');

  useEffect(() => {
    act({ type: 'tour.mark', step: 'model' });
  }, [act]);

  const type = typeOf(state.types, sel);
  const apiId = toApiId(labelEs);
  const taken = type.fields.some((f) => f.id === apiId);
  const canSave = !!labelEs.trim() && !!apiId && !taken;
  const localizable = kind === 'text' || kind === 'longText';

  const save = () => {
    if (!canSave) return;
    act({
      type: 'model.addField',
      typeId: sel,
      field: { id: apiId, kind, required, localized: localizable && localized, custom: { label: { es: labelEs.trim(), en: labelEn.trim() } } },
    });
    toast(t('fieldAdded', { name: labelEs.trim() }));
    setAdding(false);
    setLabelEs('');
    setLabelEn('');
    setKind('text');
    setRequired(false);
    setLocalized(true);
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('title')}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('subtitle')}</p>
      </div>
      <div className="grid lg:grid-cols-[16rem_minmax(0,1fr)] gap-4 items-start">
        <ul className={`${card} p-2 space-y-1`} aria-label={t('typesLabel')}>
          {TYPE_IDS.map((id) => {
            const n = state.entries.filter((e) => e.type === id).length;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setSel(id)}
                  aria-pressed={sel === id}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${sel === id ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  {tTypes(`${id}.name`)}
                  <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400">{t('entriesCount', { n })}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <section className={`${card} p-4 space-y-4 min-w-0`}>
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{tTypes(`${sel}.name`)}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">{tTypes(`${sel}.desc`)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono break-all">
                {t('apiId')}: {sel} · {t('route')}: {type.route}
                {'{slug}'}
              </p>
            </div>
            <button type="button" className={btn.primary} onClick={() => setAdding(true)} disabled={!admin}>
              <PlusIcon className="w-4 h-4" />
              {t('addField')}
            </button>
          </div>
          {!admin && <Note>{t('adminOnly')}</Note>}

          <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 dark:text-slate-400">
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 pr-3 font-semibold">{t('col.field')}</th>
                  <th className="text-left py-2 pr-3 font-semibold">{t('col.apiId')}</th>
                  <th className="text-left py-2 pr-3 font-semibold">{t('col.kind')}</th>
                  <th className="text-left py-2 pr-3 font-semibold">{t('col.required')}</th>
                  <th className="text-left py-2 pr-3 font-semibold">{t('col.localized')}</th>
                  <th className="py-2">
                    <span className="sr-only">{t('col.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {type.fields.map((f) => (
                  <tr key={f.id}>
                    <td className="py-2 pr-3 text-slate-900 dark:text-white">
                      {fieldLabel(sel, f)}
                      {f.custom && <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">{t('custom')}</span>}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-slate-600 dark:text-slate-300">{f.id}</td>
                    <td className="py-2 pr-3 text-slate-700 dark:text-slate-300">
                      {tKinds(f.kind)}
                      {f.refType && ` → ${tTypes(`${f.refType}.name`)}`}
                    </td>
                    <td className="py-2 pr-3">{f.required ? t('yes') : t('no')}</td>
                    <td className="py-2 pr-3">{f.localized ? 'ES · EN' : t('no')}</td>
                    <td className="py-2 text-right">
                      {f.custom && (
                        <button
                          type="button"
                          className={btn.ghost}
                          disabled={!admin}
                          onClick={() => {
                            act({ type: 'model.removeField', typeId: sel, fieldId: f.id });
                            toast(t('fieldRemoved'));
                          }}
                          aria-label={t('removeField')}
                          title={t('removeField')}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Note>{t('headlessNote')}</Note>
        </section>
      </div>

      {adding && (
        <Modal
          title={t('addTitle', { type: tTypes(`${sel}.name`) })}
          onClose={() => setAdding(false)}
          size="sm"
          labelId="cms-add-field"
          footer={
            <>
              <button type="button" className={btn.outline} onClick={() => setAdding(false)}>
                {t('cancel')}
              </button>
              <button type="button" className={btn.primary} onClick={save} disabled={!canSave}>
                {t('save')}
              </button>
            </>
          }
        >
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <div>
              <label htmlFor="cms-field-es" className={labelCls}>
                {t('labelEs')}
              </label>
              <input id="cms-field-es" value={labelEs} onChange={(e) => setLabelEs(e.target.value)} className={inputCls} placeholder={t('labelPlaceholder')} autoFocus />
              {labelEs.trim() && <p className={`text-[11px] mt-0.5 ${taken ? 'text-red-600' : 'text-slate-500'}`}>{taken ? t('idTaken', { id: apiId }) : t('idPreview', { id: apiId })}</p>}
            </div>
            <div>
              <label htmlFor="cms-field-en" className={labelCls}>
                {t('labelEn')}
              </label>
              <input id="cms-field-en" value={labelEn} onChange={(e) => setLabelEn(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="cms-field-kind" className={labelCls}>
                {t('kind')}
              </label>
              <select id="cms-field-kind" value={kind} onChange={(e) => setKind(e.target.value as CustomFieldKind)} className={selectCls}>
                {CUSTOM_FIELD_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {tKinds(k)}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input type="checkbox" className="rounded text-pink-600" checked={required} onChange={(e) => setRequired(e.target.checked)} />
              {t('required')}
            </label>
            <label className={`flex items-center gap-2 text-sm ${localizable ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>
              <input type="checkbox" className="rounded text-pink-600" checked={localizable && localized} disabled={!localizable} onChange={(e) => setLocalized(e.target.checked)} />
              {t('localized')}
            </label>
            {required && <Note tone="warn">{t('requiredWarn')}</Note>}
          </form>
        </Modal>
      )}
    </div>
  );
}
