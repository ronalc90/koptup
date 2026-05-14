'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { SignalIcon } from '@heroicons/react/24/outline';

type Role = 'owner' | 'admin' | 'member' | 'billing' | 'viewer';

const members: { user: string; email: string; role: Role }[] = [
  { user: 'Ronald Cárdenas', email: 'ronald@acme.com', role: 'owner' },
  { user: 'María Pérez', email: 'maria@acme.com', role: 'admin' },
  { user: 'Ops Team', email: 'ops@acme.com', role: 'member' },
  { user: 'Finanzas', email: 'cfo@acme.com', role: 'billing' },
];

export default function TeamsTab() {
  const t = useTranslations('demoSaas');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invites, setInvites] = useState([
    { email: 'maria@acme.com', role: 'admin', sentAt: '2h' },
    { email: 'ops@acme.com', role: 'member', sentAt: '1d' },
  ]);

  const sendInvite = () => {
    if (!inviteEmail.trim()) return;
    setInvites((prev) => [{ email: inviteEmail.trim(), role: 'member', sentAt: 'now' }, ...prev]);
    setInviteEmail('');
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">{t('teams.title')}</h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">{t('teams.subtitle')}</p>
      </div>

      <Card variant="bordered">
        <label className="block text-xs text-secondary-500 mb-2">{t('teams.inviteLabel')}</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            placeholder="new.member@acme.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1"
          />
          <Button onClick={sendInvite}>{t('teams.invite')}</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card variant="bordered" padding="none">
          <div className="px-6 pt-6 pb-2">
            <h3 className="text-base font-semibold text-secondary-900 dark:text-white">{t('teams.membersTitle')}</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-secondary-500 border-b border-secondary-200 dark:border-secondary-700">
                <th className="px-6 py-3 font-semibold">{t('teams.columns.user')}</th>
                <th className="px-6 py-3 font-semibold">{t('teams.columns.role')}</th>
                <th className="px-6 py-3 font-semibold">{t('teams.columns.status')}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.email} className="border-b border-secondary-100 dark:border-secondary-800 last:border-0">
                  <td className="px-6 py-3">
                    <div className="text-secondary-900 dark:text-white">{m.user}</div>
                    <div className="text-xs text-secondary-500">{m.email}</div>
                  </td>
                  <td className="px-6 py-3">
                    <select
                      defaultValue={m.role}
                      className="rounded-md border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 px-2 py-1 text-xs text-secondary-900 dark:text-white"
                    >
                      {(['owner', 'admin', 'member', 'billing', 'viewer'] as Role[]).map((r) => (
                        <option key={r} value={r}>{t(`teams.roles.${r}`)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-3">
                    <Badge variant="success" size="sm">{t('teams.active')}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="space-y-4">
          <Card variant="bordered" padding="none">
            <div className="px-6 pt-6 pb-2">
              <h3 className="text-base font-semibold text-secondary-900 dark:text-white">{t('teams.invitesTitle')}</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-secondary-500 border-b border-secondary-200 dark:border-secondary-700">
                  <th className="px-6 py-3 font-semibold">{t('teams.columns.email')}</th>
                  <th className="px-6 py-3 font-semibold">{t('teams.columns.sentAt')}</th>
                  <th className="px-6 py-3 font-semibold text-right">{t('teams.columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((inv, i) => (
                  <tr key={i} className="border-b border-secondary-100 dark:border-secondary-800 last:border-0">
                    <td className="px-6 py-3 text-secondary-700 dark:text-secondary-300">{inv.email}</td>
                    <td className="px-6 py-3 text-xs text-secondary-500">{inv.sentAt}</td>
                    <td className="px-6 py-3 text-right space-x-1">
                      <button className="text-xs text-primary-600 hover:underline">{t('teams.resend')}</button>
                      <button className="text-xs text-red-600 hover:underline">{t('teams.revoke')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card variant="bordered">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-secondary-900 dark:text-white">{t('teams.scimTitle')}</h3>
              <Badge variant="success" size="sm">
                <SignalIcon className="w-3 h-3 mr-1" />
                {t('teams.scimStatus')}
              </Badge>
            </div>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              {t('teams.scimDesc')} <span className="font-medium text-secondary-900 dark:text-white">{t('teams.scimSyncedAgo')}</span>
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
