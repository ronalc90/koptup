'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DocumentDuplicateIcon, EyeIcon, PaperAirplaneIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { BUILTIN_TEMPLATE_IDS, isBuiltin } from '../lib/data';
import { detectVars, renderTemplate } from '../lib/logic';
import { templateSample } from '../lib/seed';
import { useFirma } from '../lib/store';
import { Modal, Paper, Panel, inputCls, labelCls } from './ui';
import Bulk from './Bulk';

export default function Templates() {
  const t = useTranslations('demoSign');
  const { s, now, loc, text, templateBody, templateVars, startDraft, go, addTemplate, deleteTemplate, toast } = useFirma();
  const [preview, setPreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const uses = (id: string) => s.envelopes.filter((e) => e.doc.templateId === id).length;
  const items = [
    ...BUILTIN_TEMPLATE_IDS.map((id) => ({ id, name: t(`templates.items.${id}.name`), desc: t(`templates.items.${id}.desc`), custom: false })),
    ...s.templates.map((x) => ({ id: x.id, name: x.name, desc: t('templates.customDesc', { n: x.vars.length }), custom: true })),
  ];

  const use = (id: string) => {
    startDraft(id);
    go('create');
    toast(t('templates.loaded', { name: items.find((x) => x.id === id)?.name ?? '' }), 'info');
  };

  const save = () => {
    if (name.trim().length < 3) return setError(t('templates.errors.name'));
    if (body.trim().length < 20) return setError(t('templates.errors.body'));
    const id = addTemplate(name, body.trim());
    toast(t('templates.created', { name: name.trim() }));
    setCreating(false);
    setName('');
    setBody('');
    setError(null);
    return id;
  };

  const previewText = (id: string) =>
    renderTemplate(templateBody(id), isBuiltin(id) ? templateSample(id, now, loc, text) : Object.fromEntries(templateVars(id).map((v) => [v, ''])));

  return (
    <div className="space-y-5">
      <Panel
        title={t('templates.title')}
        subtitle={t('templates.subtitle')}
        actions={
          <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
            <PlusIcon className="mr-1 h-4 w-4" /> {t('templates.new')}
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((it) => (
            <div key={it.id} className="flex min-w-0 flex-col rounded-lg border border-secondary-200 p-4 dark:border-secondary-700">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-300">
                  <DocumentDuplicateIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="break-words font-semibold">{it.name}</h3>
                  <p className="mt-0.5 text-xs text-secondary-600 dark:text-secondary-400">{it.desc}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-secondary-500">
                {t('templates.varsCount', { n: templateVars(it.id).length })} · {t('templates.usesCount', { n: uses(it.id) })}
                {it.custom ? ` · ${t('templates.customTag')}` : ''}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => use(it.id)}>
                  <PaperAirplaneIcon className="mr-1 h-4 w-4" /> {t('templates.use')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPreview(it.id)}>
                  <EyeIcon className="mr-1 h-4 w-4" /> {t('templates.preview')}
                </Button>
                {it.custom && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-700 dark:text-red-300"
                    disabled={uses(it.id) > 0}
                    title={uses(it.id) > 0 ? t('templates.inUse') : undefined}
                    onClick={() => setConfirmDelete(it.id)}
                  >
                    <TrashIcon className="mr-1 h-4 w-4" /> {t('templates.delete')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Bulk />

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview ? (items.find((x) => x.id === preview)?.name ?? '') : ''} wide>
        {preview && (
          <div className="space-y-3">
            <Paper className="max-h-[60vh] overflow-y-auto p-5">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{previewText(preview)}</p>
            </Paper>
            <p className="text-xs text-secondary-500">{t('templates.previewNote')}</p>
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  const id = preview;
                  setPreview(null);
                  use(id);
                }}
              >
                {t('templates.use')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={creating} onClose={() => setCreating(false)} title={t('templates.newTitle')} wide>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div>
            <label htmlFor="tpl-name" className={labelCls}>
              {t('templates.nameLabel')}
            </label>
            <input id="tpl-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('templates.namePlaceholder')} />
          </div>
          <div>
            <label htmlFor="tpl-body" className={labelCls}>
              {t('templates.bodyLabel')}
            </label>
            <textarea id="tpl-body" rows={8} className={inputCls} value={body} onChange={(e) => setBody(e.target.value)} placeholder={t.raw('templates.bodyPlaceholder') as string} />
            <p className="mt-1 text-xs text-secondary-500">
              {detectVars(body).length ? t('templates.detected', { vars: detectVars(body).join(', ') }) : t('templates.noVars')}
            </p>
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setCreating(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" size="sm">
              {t('templates.save')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title={t('templates.deleteTitle')}>
        <div className="space-y-4 text-sm">
          <p>{t('templates.deleteText')}</p>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (confirmDelete) deleteTemplate(confirmDelete);
                setConfirmDelete(null);
                toast(t('templates.deleted'), 'info');
              }}
            >
              {t('templates.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
