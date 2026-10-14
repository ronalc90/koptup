'use client';

import { useTranslations } from 'next-intl';
import { CheckIcon, MinusIcon } from '@heroicons/react/24/outline';
import { can, PERMS } from '../lib/permissions';
import { useCms } from '../lib/store';
import { ROLES } from '../lib/types';
import { btn, card, Note } from './ui';

export default function RolesView() {
  const t = useTranslations('demoCms.rolesView');
  const tRole = useTranslations('demoCms.roles');
  const tPerm = useTranslations('demoCms.perms');
  const { state, me, act, toast } = useCms();
  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('title')}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('subtitle')}</p>
      </div>
      <ul className="grid sm:grid-cols-3 gap-3">
        {state.people.map((p) => (
          <li key={p.id} className={`${card} p-4 ${p.id === me.id ? 'ring-2 ring-pink-500' : ''}`}>
            <p className="font-semibold text-slate-900 dark:text-white">{p.name}</p>
            <p className="text-sm text-pink-700 dark:text-pink-300">{tRole(`${p.role}.name`)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tRole(`${p.role}.desc`)}</p>
            <button
              type="button"
              className={`${btn.small} mt-3`}
              disabled={p.id === me.id}
              onClick={() => {
                act({ type: 'user.switch', userId: p.id });
                toast(t('switched', { name: p.name }), 'info');
              }}
            >
              {p.id === me.id ? t('current') : t('viewAs')}
            </button>
          </li>
        ))}
      </ul>
      <div className={`relative ${card} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
            <tr>
              <th className="text-left px-4 py-2 font-semibold">{t('permission')}</th>
              {ROLES.map((r) => (
                <th key={r} className="px-3 py-2 font-semibold text-center">
                  {tRole(`${r}.name`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {PERMS.map((perm) => (
              <tr key={perm}>
                <td className="px-4 py-2 text-slate-700 dark:text-slate-200">{tPerm(perm.replace('.', '_'))}</td>
                {ROLES.map((r) => (
                  <td key={r} className="px-3 py-2 text-center">
                    {can(r, perm) ? <CheckIcon className="w-5 h-5 text-emerald-600 inline" aria-label={t('yes')} /> : <MinusIcon className="w-5 h-5 text-slate-300 inline" aria-label={t('no')} />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Note>{t('note')}</Note>
    </div>
  );
}
