'use client';

import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { CodeBlock } from './shared';

type Status = 'delivered' | 'retrying' | 'failed';

const events: { event: string; endpoint: string; status: Status; attempts: number; lastDelivery: string }[] = [
  { event: 'invoice.created', endpoint: 'https://hooks.acme.com/billing', status: 'delivered', attempts: 1, lastDelivery: '12s' },
  { event: 'user.invited', endpoint: 'https://hooks.acme.com/users', status: 'delivered', attempts: 1, lastDelivery: '1m' },
  { event: 'subscription.renewed', endpoint: 'https://hooks.globex.io/sub', status: 'retrying', attempts: 3, lastDelivery: '2m' },
  { event: 'webhook.failed', endpoint: 'https://hooks.initech.dev/audit', status: 'failed', attempts: 5, lastDelivery: '8m' },
  { event: 'org.created', endpoint: 'https://hooks.acme.com/orgs', status: 'delivered', attempts: 1, lastDelivery: '14m' },
];

export default function WebhooksTab() {
  const t = useTranslations('demoSaas');

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">{t('webhooks.title')}</h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">{t('webhooks.subtitle')}</p>
      </div>

      <Card variant="bordered" padding="none">
        <div className="px-6 pt-6 pb-2">
          <h3 className="text-base font-semibold text-secondary-900 dark:text-white">{t('webhooks.eventsTitle')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-secondary-500 border-b border-secondary-200 dark:border-secondary-700">
                <th className="px-6 py-3 font-semibold">{t('webhooks.columns.event')}</th>
                <th className="px-6 py-3 font-semibold">{t('webhooks.columns.endpoint')}</th>
                <th className="px-6 py-3 font-semibold">{t('webhooks.columns.status')}</th>
                <th className="px-6 py-3 font-semibold">{t('webhooks.columns.attempts')}</th>
                <th className="px-6 py-3 font-semibold">{t('webhooks.columns.lastDelivery')}</th>
              </tr>
            </thead>
            <tbody>
              {events.map((w, i) => (
                <tr key={i} className="border-b border-secondary-100 dark:border-secondary-800 last:border-0">
                  <td className="px-6 py-3 font-mono text-xs text-secondary-900 dark:text-white">{w.event}</td>
                  <td className="px-6 py-3 text-xs text-secondary-600 dark:text-secondary-400 truncate max-w-[200px]">{w.endpoint}</td>
                  <td className="px-6 py-3">
                    <Badge
                      variant={w.status === 'delivered' ? 'success' : w.status === 'retrying' ? 'warning' : 'danger'}
                      size="sm"
                    >
                      {w.status === 'retrying' && <ArrowPathIcon className="w-3 h-3 mr-1 animate-spin" />}
                      {t(`webhooks.status.${w.status}`)}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-secondary-700 dark:text-secondary-300">{w.attempts}</td>
                  <td className="px-6 py-3 text-xs text-secondary-500">{w.lastDelivery}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card variant="bordered" padding="sm">
          <div className="text-sm font-semibold text-secondary-900 dark:text-white mb-2 px-1">{t('webhooks.payloadTitle')}</div>
          <CodeBlock
            lang="json"
            code={`{\n  "id": "evt_3a8f",\n  "type": "invoice.created",\n  "created": 1714508400,\n  "tenant_id": "ten_8f3a",\n  "data": {\n    "invoice_id": "inv_3782",\n    "amount": 4999,\n    "currency": "USD",\n    "customer_id": "cus_8f3a"\n  }\n}`}
          />
        </Card>
        <Card variant="bordered">
          <div className="text-sm font-semibold text-secondary-900 dark:text-white mb-1">{t('webhooks.signatureTitle')}</div>
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-3">{t('webhooks.signatureDesc')}</p>
          <CodeBlock
            lang="ts"
            code={`import crypto from 'node:crypto';\n\nconst signed = crypto\n  .createHmac('sha256', secret)\n  .update(\`\${timestamp}.\${rawBody}\`)\n  .digest('hex');\n\nif (signed !== req.headers['x-signature']) {\n  return new Response('invalid', { status: 401 });\n}`}
          />
        </Card>
      </div>
    </section>
  );
}
