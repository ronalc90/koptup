'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDownIcon, CodeBracketIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { useDemo } from '../lib/store';
import { BASE_DOMAIN, DEMO_TODAY, DEMO_WEBHOOK_SECRET, IVA_RATE, apiKeyFor } from '../lib/data';
import { ENDPOINTS, handleApi, type ApiResult } from '../lib/api';
import { hmacSha256Hex } from '../lib/crypto';
import { formatNit, unixSecondsBogota } from '../lib/format';
import { ISOLATION_IDS, isolationSnippet, webhookVerifySnippet, type IsolationId } from '../lib/tech';
import { useFmt } from '../lib/useFmt';
import type { WebhookEvent, WebhookType } from '../lib/types';
import { CodeBlock, Panel, SimNote, inputCls, selectCls } from './ui';
import { useNoticeText } from './Portal';

const API_BASE = `https://api.${BASE_DOMAIN}`;
const WEBHOOK_TYPES: WebhookType[] = ['tenant.created', 'tenant.updated', 'invoice.paid', 'payment.failed', 'member.invited', 'notice.published'];

function webhookBody(e: WebhookEvent, slug: string): string {
  return JSON.stringify({ id: e.id, type: e.type, created: unixSecondsBogota(e.at), tenant: slug, data: e.data }, null, 2);
}

export function Webhooks() {
  const t = useTranslations('demoSaas');
  const f = useFmt();
  const { s } = useDemo();
  const [type, setType] = useState<'all' | WebhookType>('all');
  const [open, setOpen] = useState<string | null>(null);
  const list = s.webhooks.slice().reverse().filter((w) => type === 'all' || w.type === type);
  const tenantOf = (id: string) => s.tenants.find((x) => x.id === id);

  return (
    <Panel title={t('operations.webhooks.title')} subtitle={t('operations.webhooks.subtitle')}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label htmlFor="wh-type" className="text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('operations.webhooks.filter')}</label>
        <select id="wh-type" value={type} onChange={(e) => setType(e.target.value as 'all' | WebhookType)} className={selectCls}>
          <option value="all">{t('common.all')}</option>
          {WEBHOOK_TYPES.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
        <span className="text-xs text-secondary-500">{t('operations.webhooks.count', { n: list.length })}</span>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-secondary-500">{t('operations.webhooks.empty')}</p>
      ) : (
        <ul className="max-h-[28rem] divide-y divide-secondary-100 overflow-y-auto rounded-lg border border-secondary-200 dark:divide-secondary-800 dark:border-secondary-700">
          {list.slice(0, 40).map((w) => {
            const tn = tenantOf(w.tenantId);
            const expanded = open === w.id;
            return (
              <li key={w.id}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : w.id)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary-50 dark:hover:bg-secondary-800/50 sm:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)_auto]"
                >
                  <span className="font-mono text-xs text-secondary-900 dark:text-white">{w.type}</span>
                  <span className="hidden truncate text-xs text-secondary-600 dark:text-secondary-300 sm:block">{tn?.name ?? w.tenantId}</span>
                  <span className="hidden text-[11px] text-secondary-500 sm:block">{f.dateTime(w.at)}</span>
                  <ChevronDownIcon className={`h-4 w-4 text-secondary-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
                {expanded && <WebhookDetail event={w} slug={tn?.slug ?? w.tenantId} />}
              </li>
            );
          })}
        </ul>
      )}
      <details className="mt-3 rounded-lg border border-secondary-200 dark:border-secondary-700">
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-secondary-800 dark:text-secondary-100">{t('operations.webhooks.verifyTitle')}</summary>
        <div className="p-3">
          <CodeBlock code={webhookVerifySnippet(f.loc)} lang="ts" />
        </div>
      </details>
      <SimNote>{t('operations.webhooks.note', { secret: DEMO_WEBHOOK_SECRET })}</SimNote>
    </Panel>
  );
}

function WebhookDetail({ event, slug }: { event: WebhookEvent; slug: string }) {
  const t = useTranslations('demoSaas');
  const body = webhookBody(event, slug);
  const ts = unixSecondsBogota(event.at);
  const [sig, setSig] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    hmacSha256Hex(DEMO_WEBHOOK_SECRET, `${ts}.${body}`).then((h) => {
      if (alive) setSig(h);
    });
    return () => {
      alive = false;
    };
  }, [body, ts]);

  const headers = [
    'POST /webhooks/conjuntodemo HTTP/1.1',
    'Content-Type: application/json',
    `X-ConjuntoDemo-Event: ${event.type}`,
    `X-ConjuntoDemo-Signature: t=${ts},v1=${sig ?? '…'}`,
  ].join('\n');

  return (
    <div className="space-y-2 bg-secondary-50 px-3 py-3 dark:bg-secondary-800/40">
      <div className="text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('operations.webhooks.headers')}</div>
      <CodeBlock code={headers} lang="http" />
      <div className="text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('operations.webhooks.payload')}</div>
      <CodeBlock code={body} lang="json" />
      <p className="text-[11px] text-secondary-500">{t('operations.webhooks.signatureNote')}</p>
    </div>
  );
}

export function ApiConsole() {
  const t = useTranslations('demoSaas');
  const { s, logApi, publishNotice } = useDemo();
  const noticeText = useNoticeText();
  const active = s.tenants.filter((x) => x.status !== 'cancelado');
  const start = s.tenants.find((x) => x.id === s.selected.operations && x.status !== 'cancelado') ?? active[0];
  const [key, setKey] = useState(start ? apiKeyFor(start.slug) : '');
  const [endpointId, setEndpointId] = useState(ENDPOINTS[0].id);
  const keyTenant = s.tenants.find((x) => apiKeyFor(x.slug) === key.trim());
  const ownUnit = keyTenant ? s.units.find((u) => u.tenantId === keyTenant.id) : undefined;
  const foreignUnit = keyTenant ? s.units.find((u) => u.tenantId !== keyTenant.id) : undefined;
  const [param, setParam] = useState(ownUnit?.id ?? '');
  const [body, setBody] = useState(() => JSON.stringify({ title: t('operations.api.sampleTitle'), body: t('operations.api.sampleBody') }, null, 2));
  const [result, setResult] = useState<(ApiResult & { request: string }) | null>(null);
  const endpoint = ENDPOINTS.find((e) => e.id === endpointId) ?? ENDPOINTS[0];
  const path = endpoint.param ? endpoint.path.replace('{id}', encodeURIComponent(param.trim() || '{id}')) : endpoint.path;

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const res = handleApi(s, key, endpoint, param, body, noticeText);
    logApi(res.tenantId, endpoint.method, path, res.status);
    if (res.created && res.tenantId) publishNotice(res.tenantId, res.created.title, res.created.body, 'api');
    setResult({ ...res, request: `${endpoint.method} ${API_BASE}${path}` });
  };

  return (
    <Panel title={t('operations.api.title')} subtitle={t('operations.api.subtitle')}>
      <form onSubmit={send} className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label htmlFor="api-key" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('operations.api.key')}</label>
            <input id="api-key" value={key} onChange={(e) => setKey(e.target.value.trim())} className={`${inputCls} font-mono text-xs`} spellCheck={false} />
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-secondary-500">
              <span>{t('operations.api.useKey')}</span>
              {active.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  aria-pressed={keyTenant?.id === x.id}
                  onClick={() => {
                    setKey(apiKeyFor(x.slug));
                    setParam(s.units.find((u) => u.tenantId === x.id)?.id ?? '');
                  }}
                  className={`rounded-full px-2 py-0.5 ${keyTenant?.id === x.id ? 'bg-slate-700 text-white' : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-200'}`}
                >
                  {x.slug}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="api-endpoint" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('operations.api.endpoint')}</label>
            <select id="api-endpoint" value={endpointId} onChange={(e) => setEndpointId(e.target.value)} className={`${selectCls} w-full font-mono`}>
              {ENDPOINTS.map((ep) => (
                <option key={ep.id} value={ep.id}>{ep.method} {ep.path}</option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-secondary-500">{t(`operations.api.endpoints.${endpoint.id}`)}</p>
          </div>
          {endpoint.param && (
            <div>
              <label htmlFor="api-param" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('operations.api.param')}</label>
              <input id="api-param" value={param} onChange={(e) => setParam(e.target.value.slice(0, 60))} className={`${inputCls} font-mono text-xs`} spellCheck={false} />
              <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                {ownUnit && (
                  <button type="button" onClick={() => setParam(ownUnit.id)} className="rounded-full bg-secondary-100 px-2 py-0.5 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-200">
                    {t('operations.api.ownUnit')}
                  </button>
                )}
                {foreignUnit && (
                  <button type="button" onClick={() => setParam(foreignUnit.id)} className="rounded-full bg-secondary-100 px-2 py-0.5 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-200">
                    {t('operations.api.foreignUnit')}
                  </button>
                )}
              </div>
            </div>
          )}
          {endpoint.body && (
            <div>
              <label htmlFor="api-body" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('operations.api.body')}</label>
              <textarea id="api-body" rows={5} value={body} onChange={(e) => setBody(e.target.value.slice(0, 1000))} className={`${inputCls} font-mono text-xs`} spellCheck={false} />
            </div>
          )}
          <Button type="submit" size="sm">
            <PaperAirplaneIcon className="mr-1 h-4 w-4" />
            {t('operations.api.send')}
          </Button>
        </div>
        <div className="min-w-0">
          <div className="mb-1 text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('operations.api.response')}</div>
          {result ? (
            <div className="space-y-2" data-testid="api-response">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`rounded-md px-2 py-0.5 font-mono font-semibold ${
                    result.status < 300
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                  }`}
                >
                  {result.status}
                </span>
                <span className="min-w-0 break-all font-mono text-secondary-600 dark:text-secondary-300">{result.request}</span>
              </div>
              <p className="text-[11px] text-secondary-600 dark:text-secondary-300">{t(`operations.api.statusText.s${result.status}`)}</p>
              <CodeBlock code={JSON.stringify(result.body, null, 2)} lang="json" />
            </div>
          ) : (
            <p className="rounded-lg bg-secondary-50 p-4 text-sm text-secondary-500 dark:bg-secondary-800/50">{t('operations.api.noResponse')}</p>
          )}
        </div>
      </form>
      <SimNote>{t('operations.api.note')}</SimNote>
    </Panel>
  );
}

export function TechSection() {
  const t = useTranslations('demoSaas');
  const f = useFmt();
  const [pattern, setPattern] = useState<IsolationId>('shared');
  const snippet = isolationSnippet(pattern, f.loc);
  const sample = { subtotal: 1299500, nit: '900731245' };

  return (
    <details className="group rounded-xl border border-secondary-200 bg-white dark:border-secondary-700 dark:bg-secondary-900">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-start gap-2">
          <CodeBracketIcon className="mt-0.5 h-5 w-5 shrink-0 text-secondary-500" />
          <span className="min-w-0">
            <span className="block text-base font-semibold text-secondary-900 dark:text-white">{t('operations.tech.title')}</span>
            <span className="block text-xs text-secondary-500 dark:text-secondary-400">{t('operations.tech.subtitle')}</span>
          </span>
        </span>
        <ChevronDownIcon className="h-5 w-5 shrink-0 text-secondary-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-6 border-t border-secondary-200 px-4 py-4 dark:border-secondary-700 sm:px-5">
        <section>
          <h4 className="text-sm font-semibold text-secondary-900 dark:text-white">{t('operations.tech.realTitle')}</h4>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead>
                <tr className="border-b border-secondary-200 text-secondary-500 dark:border-secondary-700">
                  <th className="py-2 pr-3 font-semibold">{t('operations.tech.realCols.part')}</th>
                  <th className="py-2 pr-3 font-semibold">{t('operations.tech.realCols.demo')}</th>
                  <th className="py-2 font-semibold">{t('operations.tech.realCols.project')}</th>
                </tr>
              </thead>
              <tbody>
                {(t.raw('operations.tech.real') as { part: string; demo: string; project: string }[]).map((r) => (
                  <tr key={r.part} className="border-b border-secondary-100 align-top last:border-0 dark:border-secondary-800">
                    <td className="py-2 pr-3 font-medium text-secondary-900 dark:text-white">{r.part}</td>
                    <td className="py-2 pr-3 text-secondary-700 dark:text-secondary-300">{r.demo}</td>
                    <td className="py-2 text-secondary-700 dark:text-secondary-300">{r.project}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h4 className="text-sm font-semibold text-secondary-900 dark:text-white">{t('operations.tech.archTitle')}</h4>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {(t.raw('operations.tech.arch') as { name: string; desc: string }[]).map((a) => (
              <li key={a.name} className="rounded-lg border border-secondary-200 p-3 dark:border-secondary-700">
                <div className="text-sm font-medium text-secondary-900 dark:text-white">{a.name}</div>
                <div className="mt-0.5 text-xs text-secondary-600 dark:text-secondary-400">{a.desc}</div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h4 className="text-sm font-semibold text-secondary-900 dark:text-white">{t('operations.tech.isolationTitle')}</h4>
          <p className="mt-1 text-xs text-secondary-600 dark:text-secondary-400">{t('operations.tech.isolationSubtitle')}</p>
          <div className="mt-3 grid gap-2 md:grid-cols-3" role="group" aria-label={t('operations.tech.isolationTitle')}>
            {ISOLATION_IDS.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={pattern === id}
                onClick={() => setPattern(id)}
                className={`rounded-lg border-2 p-3 text-left ${pattern === id ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'border-secondary-200 hover:border-primary-300 dark:border-secondary-700'}`}
              >
                <div className="text-sm font-semibold text-secondary-900 dark:text-white">{t(`operations.tech.patterns.${id}.name`)}</div>
                <div className="text-xs text-secondary-600 dark:text-secondary-400">{t(`operations.tech.patterns.${id}.tagline`)}</div>
              </button>
            ))}
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{t('operations.tech.pros')}</div>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-secondary-700 dark:text-secondary-300">
                  {(t.raw(`operations.tech.patterns.${pattern}.pros`) as string[]).map((x) => <li key={x}>{x}</li>)}
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">{t('operations.tech.cons')}</div>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-secondary-700 dark:text-secondary-300">
                  {(t.raw(`operations.tech.patterns.${pattern}.cons`) as string[]).map((x) => <li key={x}>{x}</li>)}
                </ul>
              </div>
            </div>
            <CodeBlock code={snippet.code} lang={snippet.lang} />
          </div>
        </section>

        <section>
          <h4 className="text-sm font-semibold text-secondary-900 dark:text-white">{t('operations.tech.localTitle')}</h4>
          <dl className="mt-2 grid gap-2 text-xs sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg bg-secondary-50 p-3 dark:bg-secondary-800/60">
              <dt className="text-secondary-500">{t('operations.tech.local.money')}</dt>
              <dd className="mt-0.5 font-medium text-secondary-900 dark:text-white">{f.money(sample.subtotal)} + {t('invoice.iva')} = {f.money(Math.round(sample.subtotal * (1 + IVA_RATE)))}</dd>
            </div>
            <div className="rounded-lg bg-secondary-50 p-3 dark:bg-secondary-800/60">
              <dt className="text-secondary-500">{t('operations.tech.local.date')}</dt>
              <dd className="mt-0.5 font-medium text-secondary-900 dark:text-white">{f.date(DEMO_TODAY)} · America/Bogota (UTC−5)</dd>
            </div>
            <div className="rounded-lg bg-secondary-50 p-3 dark:bg-secondary-800/60">
              <dt className="text-secondary-500">{t('operations.tech.local.nit')}</dt>
              <dd className="mt-0.5 font-medium text-secondary-900 dark:text-white">NIT {formatNit(sample.nit)}</dd>
            </div>
            <div className="rounded-lg bg-secondary-50 p-3 dark:bg-secondary-800/60">
              <dt className="text-secondary-500">{t('operations.tech.local.payments')}</dt>
              <dd className="mt-0.5 font-medium text-secondary-900 dark:text-white">{t('operations.tech.local.paymentsValue')}</dd>
            </div>
          </dl>
        </section>
      </div>
    </details>
  );
}
