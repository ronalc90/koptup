'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { ClipboardDocumentIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { DEMO_TODAY, PREFIXES } from './data';
import { nextNumber } from './docs';
import { draftLines, draftParty } from './draft';
import { computeTotals } from './fiscal';
import { SectionTitle } from './ui';
import type { BillingStore } from './useBillingStore';

type ApiTab = 'request' | 'response' | 'webhook';

const ENDPOINTS: [string, string, string][] = [
  ['POST', '/v1/invoices', 'invoices'],
  ['POST', '/v1/credit-notes', 'creditNotes'],
  ['POST', '/v1/debit-notes', 'debitNotes'],
  ['POST', '/v1/pos-documents', 'pos'],
  ['GET', '/v1/documents/{id}', 'status'],
  ['GET', '/v1/documents/{id}/pdf', 'pdf'],
  ['GET', '/v1/documents/{id}/xml', 'xml'],
  ['GET', '/v1/reception', 'reception'],
  ['POST', '/v1/reception/{id}/events', 'events'],
  ['GET', '/v1/reports/sales?period=2026-10', 'reports'],
];

const WEBHOOKS = [
  'invoice.accepted',
  'invoice.rejected',
  'credit_note.issued',
  'debit_note.issued',
  'reception.received',
  'reception.event_registered',
] as const;

export function ApiPanel({ store }: { store: BillingStore }) {
  const t = useTranslations('demoBilling');
  const { state, draft, tab: emissionTab } = store;
  const [tab, setTab] = useState<ApiTab>('request');

  const code = useMemo(() => {
    const type = emissionTab === 'contingencia' ? draft.type : emissionTab;
    const ref = draft.refId ? state.docs.find((d) => d.id === draft.refId) : undefined;
    const conceptLabel = draft.concept
      ? t(`${type === 'notaCredito' ? 'creditConcepts' : 'debitConcepts'}.${draft.concept}`).replace(/^\d+ · /, '')
      : '';
    const lines = draftLines(draft, ref, t('note.adjustLine', { concept: conceptLabel, ref: ref?.id || '' }));
    const party = draftParty({ ...draft, type }, ref);
    const totals = computeTotals(lines, party);
    const prefix = type === 'factura' ? state.issuer.prefix : PREFIXES[type];
    const number = `${prefix}${nextNumber(state.docs, type, prefix)}`;
    const path = { factura: 'invoices', notaCredito: 'credit-notes', notaDebito: 'debit-notes', pos: 'pos-documents' }[type];
    const body = {
      external_id: 'pedido-10482',
      issue_date: DEMO_TODAY,
      ...(ref ? { reference: { number: ref.id, concept_code: draft.concept || null } } : {}),
      customer:
        party.idType === 'CF'
          ? { id_type: 'consumidor_final', id: party.idNumber }
          : { id_type: party.idType, id: party.idNumber, dv: party.dv || undefined, name: party.name, email: party.email || undefined, city: party.city || undefined },
      payment: { form: type === 'factura' ? draft.paymentForm : 'contado', method: draft.paymentMethod },
      lines: lines.map((l) => ({ description: l.description, quantity: l.qty, unit_price: l.unitPrice, vat: l.tax })),
    };
    if (tab === 'request') {
      return [
        `curl -X POST https://api.tu-empresa.example/v1/${path} \\`,
        '  -H "Authorization: Bearer <tu-llave-de-api>" \\',
        '  -H "Content-Type: application/json" \\',
        "  -d '" + JSON.stringify(body, null, 2).replace(/'/g, "'\\''") + "'",
      ].join('\n');
    }
    if (tab === 'response') {
      return JSON.stringify(
        {
          id: 'doc_ejemplo_01',
          number,
          status: state.dianDown ? 'contingency' : 'accepted',
          [type === 'factura' ? 'cufe' : 'cude']: '<sha384-96-caracteres>',
          totals: { subtotal: totals.subtotal, vat: totals.iva, total: totals.total },
          pdf_url: `https://api.tu-empresa.example/v1/documents/doc_ejemplo_01/pdf`,
          xml_url: `https://api.tu-empresa.example/v1/documents/doc_ejemplo_01/xml`,
        },
        null,
        2,
      );
    }
    return JSON.stringify(
      {
        event: 'invoice.accepted',
        created_at: `${DEMO_TODAY}T10:15:00-05:00`,
        data: { id: 'doc_ejemplo_01', number, status: 'accepted', total: totals.total },
        signature: 'sha256=<firma-hmac-del-webhook>',
      },
      null,
      2,
    );
  }, [draft, emissionTab, state.docs, state.issuer.prefix, state.dianDown, tab, t]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(t('api.copied'));
    } catch {
      toast.error(t('api.copyError'));
    }
  };

  return (
    <Card variant="bordered" padding="md" className="min-w-0">
      <SectionTitle
        icon={<CodeBracketIcon className="w-5 h-5" />}
        title={t('api.title')}
        subtitle={t('api.subtitle')}
        right={
          <Badge variant="warning" size="sm" className="whitespace-nowrap">
            {t('api.badge')}
          </Badge>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div role="tablist" aria-label={t('api.title')} className="flex flex-wrap gap-2">
          {(['request', 'response', 'webhook'] as ApiTab[]).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={
                'px-3 py-1 rounded-md text-xs font-medium ' +
                (tab === k ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200')
              }
            >
              {t(`api.tabs.${k}`)}
            </button>
          ))}
        </div>
        <Button size="sm" variant="ghost" onClick={copy}>
          <ClipboardDocumentIcon className="w-4 h-4 mr-1" /> {t('api.copy')}
        </Button>
      </div>
      <pre className="rounded-lg bg-secondary-900 text-secondary-100 text-[11px] leading-relaxed p-4 overflow-x-auto max-h-80">
        <code>{code}</code>
      </pre>
      <p className="mt-1 text-[11px] text-secondary-500">{t('api.live')}</p>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-secondary-900 dark:text-white mb-2">{t('api.endpoints')}</p>
          <ul className="space-y-1 text-xs">
            {ENDPOINTS.map(([method, path, key]) => (
              <li key={path} className="flex items-start gap-2">
                <Badge variant={method === 'GET' ? 'info' : 'success'} size="sm" className="flex-shrink-0">
                  {method}
                </Badge>
                <span className="min-w-0">
                  <code className="font-mono text-secondary-700 dark:text-secondary-200 break-all">{path}</code>
                  <span className="block text-secondary-500">{t(`api.endpointDesc.${key}`)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-secondary-900 dark:text-white mb-2">{t('api.webhooks')}</p>
          <ul className="space-y-1.5 text-xs">
            {WEBHOOKS.map((w) => (
              <li key={w} className="rounded-md bg-secondary-50 dark:bg-secondary-800/50 p-2">
                <code className="font-mono text-secondary-800 dark:text-secondary-100 break-all">{w}</code>
                <span className="block text-secondary-500">{t(`api.webhookDesc.${w.replace('.', '_')}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
