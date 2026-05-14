'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { CodeBlock } from './shared';

type ApiLang = 'ts' | 'py' | 'go';

const endpoints = [
  { method: 'GET', path: '/v1/invoices' },
  { method: 'POST', path: '/v1/invoices' },
  { method: 'GET', path: '/v1/invoices/{id}' },
  { method: 'POST', path: '/v1/customers' },
  { method: 'GET', path: '/v1/subscriptions' },
  { method: 'POST', path: '/v1/webhooks' },
  { method: 'GET', path: '/v1/audit-logs' },
];

const snippets: Record<ApiLang, string> = {
  ts: `import { Client } from '@saas/sdk';\n\nconst client = new Client({ apiKey: process.env.API_KEY });\n\nconst invoice = await client.invoices.create({\n  customerId: 'cus_8f3a',\n  amount: 4999,\n  currency: 'USD'\n});`,
  py: `from saas_sdk import Client\n\nclient = Client(api_key=os.environ['API_KEY'])\n\ninvoice = client.invoices.create(\n    customer_id='cus_8f3a',\n    amount=4999,\n    currency='USD'\n)`,
  go: `client := saas.NewClient(os.Getenv("API_KEY"))\n\ninvoice, err := client.Invoices.Create(ctx, &saas.InvoiceParams{\n  CustomerID: "cus_8f3a",\n  Amount:     4999,\n  Currency:   "USD",\n})`,
};

export default function ApiTab() {
  const t = useTranslations('demoSaas');
  const [apiLang, setApiLang] = useState<ApiLang>('ts');

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">{t('api.title')}</h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">{t('api.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card variant="bordered" className="lg:col-span-1">
          <h3 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3">{t('api.endpoints')}</h3>
          <ul className="space-y-1">
            {endpoints.map((e) => (
              <li key={e.method + e.path} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary-50 dark:hover:bg-secondary-800">
                <Badge size="sm" variant={e.method === 'GET' ? 'info' : 'success'}>{e.method}</Badge>
                <code className="font-mono text-xs text-secondary-700 dark:text-secondary-300 truncate">{e.path}</code>
              </li>
            ))}
          </ul>
        </Card>

        <Card variant="bordered" padding="sm" className="lg:col-span-2">
          <div className="flex items-center justify-between px-2 pt-1 mb-2">
            <div className="text-sm font-semibold text-secondary-900 dark:text-white">{t('api.exampleTitle')}</div>
            <Button size="sm" variant="outline">{t('api.tryIt')}</Button>
          </div>
          <div className="flex gap-1 px-2 mb-2">
            {(['ts', 'py', 'go'] as ApiLang[]).map((l) => (
              <button
                key={l}
                onClick={() => setApiLang(l)}
                className={`text-xs px-2.5 py-1 rounded-md font-mono ${
                  apiLang === l
                    ? 'bg-secondary-900 text-white dark:bg-white dark:text-secondary-900'
                    : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                }`}
              >
                {t(`api.languages.${l}`)}
              </button>
            ))}
          </div>
          <CodeBlock code={snippets[apiLang]} lang={apiLang} />
        </Card>
      </div>
    </section>
  );
}
