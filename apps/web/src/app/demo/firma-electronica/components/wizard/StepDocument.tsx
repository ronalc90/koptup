'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CloudArrowUpIcon, DocumentDuplicateIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { BUILTIN_TEMPLATE_IDS, MAX_PDF_BYTES, genericSigners, isBuiltin } from '../../lib/data';
import { fmtBytes } from '../../lib/dates';
import { countPdfPages, isPdf, renderTemplate } from '../../lib/logic';
import { fileSha256, shortHash } from '../../lib/sha256';
import { useFirma } from '../../lib/store';
import { Paper, SimNote, focusRing, inputCls, labelCls, selectCls } from '../ui';

export default function StepDocument() {
  const t = useTranslations('demoSign');
  const { s, loc, patchDraft, pickTemplate, setDraftVars, templateVars, templateBody, envTitle, go } = useFirma();
  const d = s.draft;
  const [source, setSource] = useState<'template' | 'upload'>(d.doc?.kind ?? 'template');
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const tplId = d.doc?.kind === 'template' ? d.doc.templateId : '';
  const vars = d.doc?.kind === 'template' ? templateVars(tplId) : [];
  const values = d.doc?.vars ?? {};

  const onFile = async (file: File | undefined) => {
    setUploadError(null);
    if (!file) return;
    if (file.size > MAX_PDF_BYTES) {
      setUploadError(t('wizard.document.tooBig', { size: fmtBytes(file.size, loc) }));
      return;
    }
    setBusy(true);
    try {
      const { hash, bytes } = await fileSha256(file);
      if (!isPdf(bytes)) {
        setUploadError(t('wizard.document.notPdf', { name: file.name }));
        return;
      }
      const pages = countPdfPages(bytes);
      patchDraft({
        doc: { kind: 'upload', fileName: file.name, size: file.size, pages: pages || undefined, hash },
        title: d.title.trim() || file.name.replace(/\.pdf$/i, ''),
        subject: '',
        signers: d.doc?.kind === 'upload' && d.signers.length ? d.signers : genericSigners(),
        fields: [],
      });
    } catch {
      setUploadError(t('wizard.document.unreadable'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">{t('wizard.document.title')}</h3>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('wizard.document.subtitle')}</p>
      </div>

      <div role="radiogroup" aria-label={t('wizard.document.sourceLabel')} className="grid gap-2 sm:grid-cols-2">
        {(['template', 'upload'] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={source === k}
            onClick={() => setSource(k)}
            className={`flex items-start gap-3 rounded-lg border p-3 text-left ${focusRing} ${
              source === k ? 'border-lime-600 bg-lime-50 dark:bg-lime-950/40' : 'border-secondary-200 hover:border-lime-400 dark:border-secondary-700'
            }`}
          >
            {k === 'template' ? <DocumentDuplicateIcon className="mt-0.5 h-5 w-5 shrink-0 text-lime-700" /> : <CloudArrowUpIcon className="mt-0.5 h-5 w-5 shrink-0 text-lime-700" />}
            <span>
              <span className="block text-sm font-medium">{t(`wizard.document.${k}`)}</span>
              <span className="block text-xs text-secondary-600 dark:text-secondary-400">{t(`wizard.document.${k}Help`)}</span>
            </span>
          </button>
        ))}
      </div>

      {source === 'template' ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="space-y-3">
            <div>
              <label htmlFor="tpl" className={labelCls}>
                {t('wizard.document.pickTemplate')}
              </label>
              <select id="tpl" className={selectCls} value={tplId ?? ''} onChange={(e) => e.target.value && pickTemplate(e.target.value)}>
                <option value="">{t('wizard.document.pickPlaceholder')}</option>
                <optgroup label={t('templates.builtinGroup')}>
                  {BUILTIN_TEMPLATE_IDS.map((id) => (
                    <option key={id} value={id}>
                      {t(`templates.items.${id}.name`)}
                    </option>
                  ))}
                </optgroup>
                {s.templates.length > 0 && (
                  <optgroup label={t('templates.customGroup')}>
                    {s.templates.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <p className="mt-1 text-xs text-secondary-500">
                {t('wizard.document.pickHelp')}{' '}
                <button type="button" className="font-medium text-lime-700 underline dark:text-lime-400" onClick={() => go('templates')}>
                  {t('wizard.document.seeTemplates')}
                </button>
              </p>
            </div>
            {d.doc?.kind === 'template' && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {vars.map((v) => (
                    <div key={v} className={v === 'items' || v === 'address' || v === 'description' || v === 'purpose' ? 'sm:col-span-2' : ''}>
                      <label htmlFor={`var-${v}`} className={labelCls}>
                        {isBuiltin(tplId) ? t(`templates.vars.${v}`) : v}
                      </label>
                      <input id={`var-${v}`} className={inputCls} value={values[v] ?? ''} onChange={(e) => setDraftVars({ ...values, [v]: e.target.value })} />
                    </div>
                  ))}
                </div>
                <div>
                  <label htmlFor="env-title" className={labelCls}>
                    {t('wizard.document.titleLabel')}
                  </label>
                  <input
                    id="env-title"
                    className={inputCls}
                    value={d.title}
                    placeholder={envTitle({ title: '', subject: d.subject, doc: d.doc })}
                    onChange={(e) => patchDraft({ title: e.target.value })}
                  />
                </div>
                <p className="text-xs text-secondary-500">{t('wizard.document.signersNote')}</p>
              </>
            )}
          </div>
          <div className="min-w-0">
            {d.doc?.kind === 'template' ? (
              <>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-secondary-500">{t('wizard.document.preview')}</p>
                <Paper className="max-h-[28rem] overflow-y-auto p-5">
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{renderTemplate(templateBody(tplId), values)}</p>
                </Paper>
                <p className="mt-2 break-all font-mono text-[11px] text-secondary-500" title={d.doc.hash}>
                  {t('wizard.document.hash', { hash: shortHash(d.doc.hash, 12) })}
                </p>
              </>
            ) : (
              <div className="flex h-full min-h-40 items-center justify-center rounded-lg border border-dashed border-secondary-300 p-6 text-center text-sm text-secondary-500 dark:border-secondary-700">
                <DocumentTextIcon className="mr-2 h-5 w-5" /> {t('wizard.document.noTemplate')}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void onFile(e.dataTransfer.files?.[0]);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
              dragging ? 'border-lime-600 bg-lime-50 dark:bg-lime-950/40' : 'border-secondary-300 hover:border-lime-500 dark:border-secondary-700'
            }`}
          >
            <CloudArrowUpIcon className="h-8 w-8 text-lime-700" />
            <span className="mt-2 text-sm font-medium">{busy ? t('wizard.document.hashing') : t('wizard.document.drop')}</span>
            <span className="mt-1 text-xs text-secondary-500">{t('wizard.document.dropHint')}</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => {
                void onFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
          {uploadError && (
            <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200">
              {uploadError}
            </p>
          )}
          {d.doc?.kind === 'upload' && (
            <div className="space-y-3 rounded-lg border border-secondary-200 p-3 dark:border-secondary-700">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="break-all font-medium">{d.doc.fileName}</p>
                  <p className="text-xs text-secondary-500">
                    {fmtBytes(d.doc.size ?? 0, loc)}
                    {d.doc.pages ? ` · ${t('wizard.document.pages', { n: d.doc.pages })}` : ''}
                  </p>
                </div>
              </div>
              <p className="break-all font-mono text-[11px] text-secondary-500">{t('wizard.document.hashFull', { hash: d.doc.hash })}</p>
              <div>
                <label htmlFor="env-title-up" className={labelCls}>
                  {t('wizard.document.titleLabel')}
                </label>
                <input id="env-title-up" className={inputCls} value={d.title} onChange={(e) => patchDraft({ title: e.target.value })} />
              </div>
              <p className="text-xs text-secondary-500">{t('wizard.document.notStored')}</p>
            </div>
          )}
          <SimNote>{t('wizard.document.uploadNote')}</SimNote>
        </div>
      )}
    </div>
  );
}
