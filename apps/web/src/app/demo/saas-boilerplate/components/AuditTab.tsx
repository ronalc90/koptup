'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';

const logs = [
  { actor: 'ronald@acme.com', action: 'invoice.create', resource: 'inv_3782', ip: '190.12.4.7', when: '2m' },
  { actor: 'maria@acme.com', action: 'user.invite', resource: 'sara@acme.com', ip: '190.12.4.7', when: '14m' },
  { actor: 'ops@acme.com', action: 'flag.toggle', resource: 'new-billing-ui', ip: '52.18.4.21', when: '1h' },
  { actor: 'ronald@acme.com', action: 'auth.login', resource: 'session_91a', ip: '190.12.4.7', when: '3h' },
  { actor: 'system', action: 'subscription.renew', resource: 'sub_82a', ip: '-', when: '6h' },
  { actor: 'maria@acme.com', action: 'audit.export', resource: 'siem-q2.csv', ip: '190.12.4.7', when: '1d' },
];

export default function AuditTab() {
  const t = useTranslations('demoSaas');
  const [user, setUser] = useState('all');
  const [action, setAction] = useState('all');

  const users = Array.from(new Set(logs.map((l) => l.actor)));
  const actions = Array.from(new Set(logs.map((l) => l.action)));
  const filtered = logs.filter((l) => (user === 'all' || l.actor === user) && (action === 'all' || l.action === action));

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">{t('audit.title')}</h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">{t('audit.subtitle')}</p>
      </div>

      <Card variant="bordered">
        <div className="flex flex-wrap gap-3 mb-4">
          <div>
            <label className="block text-xs text-secondary-500 mb-1">{t('audit.filtersUser')}</label>
            <select
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 px-3 py-1.5 text-sm text-secondary-900 dark:text-white"
            >
              <option value="all">{t('audit.all')}</option>
              {users.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-secondary-500 mb-1">{t('audit.filtersAction')}</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 px-3 py-1.5 text-sm text-secondary-900 dark:text-white"
            >
              <option value="all">{t('audit.all')}</option>
              {actions.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-secondary-500 border-b border-secondary-200 dark:border-secondary-700">
                <th className="py-3 pr-4 font-semibold">{t('audit.columns.actor')}</th>
                <th className="py-3 pr-4 font-semibold">{t('audit.columns.action')}</th>
                <th className="py-3 pr-4 font-semibold">{t('audit.columns.resource')}</th>
                <th className="py-3 pr-4 font-semibold">{t('audit.columns.ip')}</th>
                <th className="py-3 font-semibold">{t('audit.columns.when')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr key={i} className="border-b border-secondary-100 dark:border-secondary-800 last:border-0">
                  <td className="py-3 pr-4 text-secondary-700 dark:text-secondary-300">{l.actor}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-fuchsia-600 dark:text-fuchsia-400">{l.action}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-secondary-600 dark:text-secondary-400">{l.resource}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-secondary-500">{l.ip}</td>
                  <td className="py-3 text-xs text-secondary-500">{l.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
