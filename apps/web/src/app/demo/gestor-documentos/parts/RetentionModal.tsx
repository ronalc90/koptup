'use client';

import { useTranslations } from 'next-intl';
import { ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { useDocs } from '../lib/store';
import type { PolicyKey } from '../lib/types';
import { POLICY_KEYS, ruleFor } from '../lib/util';
import { Modal, Note, Switch, btnPrimary, btnSecondary } from './ui';

export default function RetentionModal({ open, onClose, focus }: { open: boolean; onClose: () => void; focus?: string }) {
  const t = useTranslations('demoDocs');
  const { folders, folderLabel, folderCounts, retention, setRule, resetRetention, docs } = useDocs();
  const trashCount = (f: string) => docs.filter((d) => d.deleted && d.folder === f).length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={t('retention.title')}
      icon={<ArchiveBoxIcon className="h-6 w-6" />}
      footer={
        <>
          <button type="button" onClick={resetRetention} className={btnSecondary}>
            {t('retention.reset')}
          </button>
          <button type="button" onClick={onClose} className={btnPrimary}>
            {t('retention.done')}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Note>{t('retention.note')}</Note>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('retention.holdHelp')}</p>
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">{t('retention.headers.folder')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('retention.headers.policy')}</th>
                <th className="px-3 py-2 text-right font-semibold">{t('retention.headers.docs')}</th>
                <th className="px-3 py-2 text-center font-semibold">{t('retention.headers.hold')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {folders.map((f) => {
                const rule = ruleFor(retention, f);
                const id = `ret-${f.replace(/[^a-z0-9]/gi, '-')}`;
                return (
                  <tr key={f} className={focus === f ? 'bg-indigo-50 dark:bg-indigo-950/40' : 'bg-white dark:bg-slate-900'}>
                    <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">{folderLabel(f)}</td>
                    <td className="px-3 py-2">
                      <label htmlFor={id} className="sr-only">
                        {t('retention.policyFor', { folder: folderLabel(f) })}
                      </label>
                      <select
                        id={id}
                        value={rule.policy}
                        onChange={(e) => setRule(f, { ...rule, policy: e.target.value as PolicyKey })}
                        className="min-w-[9.5rem] rounded-lg border border-slate-200 bg-white py-1.5 pl-2 pr-8 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        {POLICY_KEYS.map((k) => (
                          <option key={k} value={k}>{t(`retention.policies.${k}`)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700 dark:text-slate-300">
                      {folderCounts[f] || 0}
                      {trashCount(f) > 0 && <span className="text-xs text-slate-500"> {t('retention.inTrash', { count: trashCount(f) })}</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Switch checked={rule.hold} onChange={(v) => setRule(f, { ...rule, hold: v })} label={t('retention.holdLabel', { folder: folderLabel(f) })} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
