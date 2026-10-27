'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChatBubbleLeftRightIcon, DevicePhoneMobileIcon, EnvelopeIcon, IdentificationIcon } from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { addDays, fmtDate } from '../../lib/dates';
import { acts } from '../../lib/logic';
import { useFirma } from '../../lib/store';
import { AUTH_METHODS, SIG_TYPES, YOU, type AuthMethod, type Comment } from '../../lib/types';
import { actorLabel } from '../text';
import { SimNote, focusRing, inputCls, labelCls } from '../ui';

const AUTH_ICON: Record<AuthMethod, typeof EnvelopeIcon> = {
  emailOtp: EnvelopeIcon,
  smsOtp: DevicePhoneMobileIcon,
  whatsappOtp: ChatBubbleLeftRightIcon,
  idCheck: IdentificationIcon,
};

export default function StepSecurity() {
  const t = useTranslations('demoSign');
  const { s, now, loc, patchDraft, envTitle } = useFirma();
  const d = s.draft;
  const [newComment, setNewComment] = useState('');

  const setComments = (comments: Comment[]) => patchDraft({ comments });
  const toggleRedlines = (on: boolean) => {
    if (on && d.comments.length === 0) {
      patchDraft({
        redlines: true,
        comments: [
          { id: 'c1', author: '', text: '', status: 'open', sample: 'c1' },
          { id: 'c2', author: '', text: '', status: 'open', sample: 'c2' },
        ],
      });
      return;
    }
    patchDraft({ redlines: on });
  };
  const setStatus = (id: string, status: Comment['status']) => setComments(d.comments.map((c) => (c.id === id ? { ...c, status } : c)));
  const addComment = () => {
    if (!newComment.trim()) return;
    setComments([...d.comments, { id: `c${d.comments.length + 1}-${newComment.length}`, author: YOU, text: newComment.trim(), status: 'open' }]);
    setNewComment('');
  };

  const acting = d.signers.filter(acts);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold">{t('wizard.security.title')}</h3>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('wizard.security.subtitle')}</p>
      </div>

      <div>
        <p className={labelCls}>{t('wizard.security.authLabel')}</p>
        <div role="radiogroup" aria-label={t('wizard.security.authLabel')} className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {AUTH_METHODS.map((id) => {
            const Icon = AUTH_ICON[id];
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={d.auth === id}
                onClick={() => patchDraft({ auth: id })}
                className={`rounded-lg border p-3 text-left ${focusRing} ${
                  d.auth === id ? 'border-lime-600 bg-lime-50 dark:bg-lime-950/40' : 'border-secondary-200 hover:border-lime-400 dark:border-secondary-700'
                }`}
              >
                <Icon className="h-5 w-5 text-lime-700 dark:text-lime-400" />
                <span className="mt-1 block text-sm font-medium">{t(`auth.${id}.name`)}</span>
                <span className="block text-xs text-secondary-600 dark:text-secondary-400">{t(`auth.${id}.help`)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className={labelCls}>{t('wizard.security.sigTypeLabel')}</p>
        <div role="radiogroup" aria-label={t('wizard.security.sigTypeLabel')} className="grid gap-2 sm:grid-cols-2">
          {SIG_TYPES.map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={d.sigType === id}
              onClick={() => patchDraft({ sigType: id })}
              className={`rounded-lg border p-3 text-left ${focusRing} ${
                d.sigType === id ? 'border-lime-600 bg-lime-50 dark:bg-lime-950/40' : 'border-secondary-200 hover:border-lime-400 dark:border-secondary-700'
              }`}
            >
              <span className="block text-sm font-medium">{t(`sigTypes.${id}.name`)}</span>
              <span className="block text-xs text-secondary-600 dark:text-secondary-400">{t(`sigTypes.${id}.help`)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="expiry" className={labelCls}>
            {t('wizard.security.expiry')}
          </label>
          <input id="expiry" type="number" min={1} max={90} className={inputCls} value={Number.isFinite(d.expiryDays) ? d.expiryDays : ''} onChange={(e) => patchDraft({ expiryDays: Number(e.target.value) })} />
          <p className="mt-1 text-xs text-secondary-500">
            {d.expiryDays >= 1 && d.expiryDays <= 90 ? t('wizard.security.expiryHint', { date: fmtDate(addDays(now, d.expiryDays), loc) }) : t('wizard.security.expiryRange')}
          </p>
        </div>
        <div>
          <label htmlFor="reminder" className={labelCls}>
            {t('wizard.security.reminder')}
          </label>
          <input id="reminder" type="number" min={1} max={30} className={inputCls} value={Number.isFinite(d.reminderDays) ? d.reminderDays : ''} onChange={(e) => patchDraft({ reminderDays: Number(e.target.value) })} />
          <p className="mt-1 text-xs text-secondary-500">{t('wizard.security.reminderHint')}</p>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-secondary-200 p-3 dark:border-secondary-700">
        <input type="checkbox" checked={d.timestamp} onChange={(e) => patchDraft({ timestamp: e.target.checked })} className="mt-0.5 h-4 w-4 accent-lime-700" />
        <span>
          <span className="block text-sm font-medium">{t('wizard.security.timestamp')}</span>
          <span className="block text-xs text-secondary-600 dark:text-secondary-400">{t('wizard.security.timestampHelp')}</span>
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-secondary-200 p-3 dark:border-secondary-700">
        <input type="checkbox" checked={d.redlines} onChange={(e) => toggleRedlines(e.target.checked)} className="mt-0.5 h-4 w-4 accent-lime-700" />
        <span>
          <span className="block text-sm font-medium">{t('wizard.security.redlines')}</span>
          <span className="block text-xs text-secondary-600 dark:text-secondary-400">{t('wizard.security.redlinesHelp')}</span>
        </span>
      </label>

      {d.redlines && (
        <div className="rounded-lg border border-secondary-200 p-3 dark:border-secondary-700">
          <p className="text-sm font-semibold">{t('redlines.title')}</p>
          <p className="mb-3 text-xs text-secondary-600 dark:text-secondary-400">{t('redlines.subtitle')}</p>
          <ul className="space-y-2">
            {d.comments.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 rounded-lg bg-secondary-50 p-2.5 dark:bg-secondary-800/60 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{c.sample ? t(`redlines.samples.${c.sample}.author`) : actorLabel(t, c.author)}</p>
                  <p className="break-words text-sm text-secondary-700 dark:text-secondary-300">{c.sample ? t(`redlines.samples.${c.sample}.text`) : c.text}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1">
                  {c.status === 'open' ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setStatus(c.id, 'accepted')}>
                        {t('redlines.accept')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setStatus(c.id, 'rejected')}>
                        {t('redlines.reject')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Badge size="sm" variant={c.status === 'accepted' ? 'success' : 'danger'}>
                        {t(`redlines.status.${c.status}`)}
                      </Badge>
                      <Button size="sm" variant="ghost" onClick={() => setStatus(c.id, 'open')}>
                        {t('redlines.undo')}
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <label htmlFor="new-comment" className="sr-only">
              {t('redlines.add')}
            </label>
            <textarea id="new-comment" rows={2} className={inputCls} placeholder={t('redlines.placeholder')} value={newComment} onChange={(e) => setNewComment(e.target.value)} />
            <Button size="sm" onClick={addComment} disabled={!newComment.trim()} className="sm:self-start">
              {t('redlines.add')}
            </Button>
          </div>
          <p className="mt-2 text-xs text-secondary-500">{t('redlines.note')}</p>
        </div>
      )}

      <div className="rounded-lg border border-lime-200 bg-lime-50/60 p-3 text-sm dark:border-lime-900 dark:bg-lime-950/30">
        <p className="font-semibold">{t('wizard.security.summary')}</p>
        <ul className="mt-1 space-y-0.5 text-secondary-700 dark:text-secondary-300">
          <li>{d.doc ? envTitle({ title: d.title, subject: d.subject, doc: d.doc }) : '—'}</li>
          <li>
            {t('wizard.security.summarySigners', { n: acting.length, mode: t(`wizard.signers.modes.${d.mode}.name`) })}: {acting.map((x) => x.name).join(d.mode === 'sequential' ? ' → ' : ', ')}
          </li>
          <li>{t('wizard.security.summaryFields', { n: d.fields.length })}</li>
          <li>
            {t(`auth.${d.auth}.name`)} · {t(`sigTypes.${d.sigType}.name`)}
          </li>
        </ul>
      </div>
      <SimNote>{t('wizard.security.simNote')}</SimNote>
    </div>
  );
}
