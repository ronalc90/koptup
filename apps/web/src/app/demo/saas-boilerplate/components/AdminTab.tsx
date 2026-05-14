'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { PlayIcon, StopIcon, SignalIcon } from '@heroicons/react/24/outline';
import { Toggle } from './shared';

export default function AdminTab() {
  const t = useTranslations('demoSaas');
  const [tenant, setTenant] = useState('acme-corp');
  const [impersonating, setImpersonating] = useState(false);
  const [tenantFlags, setTenantFlags] = useState<Record<string, boolean>>({
    'priority-support': true,
    'custom-domain': false,
    'sso-required': true,
  });

  const tenants = ['acme-corp', 'globex', 'initech', 'umbrella'];
  const recentEvents = [
    { user: 'maria@acme.com', event: 'subscription.upgraded', time: '2m' },
    { user: 'ops@acme.com', event: 'webhook.retry', time: '5m' },
    { user: 'ronald@acme.com', event: 'auth.mfa_enrolled', time: '12m' },
  ];

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">{t('admin.title')}</h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">{t('admin.subtitle')}</p>
      </div>

      <Card variant="bordered">
        <h3 className="text-base font-semibold text-secondary-900 dark:text-white">{t('admin.impersonation.title')}</h3>
        <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-4">{t('admin.impersonation.subtitle')}</p>
        {!impersonating ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={tenant}
              onChange={(e) => setTenant(e.target.value)}
              className="rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 px-3 py-2 text-sm text-secondary-900 dark:text-white"
            >
              {tenants.map((tn) => <option key={tn} value={tn}>{tn}</option>)}
            </select>
            <Input placeholder={t('admin.impersonation.reason')} />
            <Button onClick={() => setImpersonating(true)}>
              <PlayIcon className="w-4 h-4 mr-1" />
              {t('admin.impersonation.impersonate')}
            </Button>
          </div>
        ) : (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-100">
              <SignalIcon className="w-4 h-4 animate-pulse" />
              <span className="font-semibold">{t('admin.impersonation.active')}</span>
              <Badge variant="warning" size="sm">{tenant}</Badge>
            </div>
            <Button size="sm" variant="outline" onClick={() => setImpersonating(false)}>
              <StopIcon className="w-4 h-4 mr-1" />
              {t('admin.impersonation.stop')}
            </Button>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card variant="bordered">
          <h3 className="text-base font-semibold text-secondary-900 dark:text-white">{t('admin.flags.title')}</h3>
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-4">{t('admin.flags.subtitle')}</p>
          <div className="space-y-2">
            {Object.keys(tenantFlags).map((f) => (
              <div key={f} className="flex items-center justify-between rounded-lg border border-secondary-200 dark:border-secondary-700 px-3 py-2.5">
                <span className="text-sm font-mono text-secondary-700 dark:text-secondary-300">{f}</span>
                <Toggle value={tenantFlags[f]} onChange={() => setTenantFlags((s) => ({ ...s, [f]: !s[f] }))} />
              </div>
            ))}
          </div>
        </Card>

        <Card variant="bordered">
          <h3 className="text-base font-semibold text-secondary-900 dark:text-white">{t('admin.support.title')}</h3>
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-4">{t('admin.support.subtitle')}</p>
          <div className="space-y-1.5">
            {recentEvents.map((e, i) => (
              <div key={i} className="flex items-center justify-between text-sm rounded-md px-2 py-1.5 hover:bg-secondary-50 dark:hover:bg-secondary-800">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-secondary-600 dark:text-secondary-400 truncate">{e.user}</span>
                  <code className="text-secondary-900 dark:text-white font-mono text-xs truncate">{e.event}</code>
                </div>
                <span className="text-xs text-secondary-500 shrink-0 ml-2">{e.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
