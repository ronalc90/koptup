'use client';

/**
 * Laboratorio (resultados de ejemplo por paciente, órdenes emitidas y PDF) y
 * Pagos y facturación (valores por pagador, cobro con pasarela simulada,
 * factura electrónica y RIPS simulados, exportación CSV y JSON).
 */
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { ArrowDownTrayIcon, CheckCircleIcon, DocumentTextIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { DEMO_DATE, IPS, LAB_ORDERS } from './mockData';
import { billingTotals, fileSlug, fmtCOP, fmtDate, payerOf, ripsFor, toCsv, tx } from './logic';
import { downloadText, makePdf } from './pdf';
import { Modal, SimTag, useDateNames, useLoc } from './ui';
import type { LogFn, TelemedStore } from './store';
import type { Attention, LabFlag, PayMethod } from './types';

type T = ReturnType<typeof useTranslations>;

export function flagBadge(f: LabFlag, t: T) {
  const v: Record<LabFlag, 'success' | 'warning' | 'danger' | 'info'> = { normal: 'success', high: 'warning', low: 'info', critical: 'danger' };
  return (
    <Badge variant={v[f]} size="sm">
      {t(`lab.flags.${f}`)}
    </Badge>
  );
}

export function LabPanel({ store, notify }: { store: TelemedStore; notify: (text: string, tone?: 'ok' | 'warn') => void }) {
  const t = useTranslations('demoTelemed');
  const loc = useLoc();
  const names = useDateNames();
  const patients = store.state.patients;
  const [selId, setSelId] = useState('p4');
  const patient = patients.find((p) => p.id === selId) ?? patients[0];
  const orders = store.state.attentions.filter((a) => a.patientName === patient.name && a.orders.length > 0);

  async function download() {
    await makePdf({
      filename: `${t('lab.fileName')}-${fileSlug(patient.name)}.pdf`,
      title: t('lab.pdfTitle'),
      subtitle: `${patient.name} · ${patient.docType} ${patient.doc} · ${patient.age} ${t('record.years')}`,
      sample: t('pdf.sample'),
      ipsLine: t('pdf.ipsLine', { nit: IPS.nit, city: IPS.city[loc] }),
      sections: [
        patient.labs.length
          ? {
              table: {
                head: [t('lab.cols.test'), t('lab.cols.value'), t('lab.cols.ref'), t('lab.cols.flag'), t('lab.cols.date')],
                rows: patient.labs.map((r) => [
                  tx(r.test, loc),
                  tx(r.value, loc),
                  tx(r.ref, loc),
                  t(`lab.flags.${r.flag}`),
                  fmtDate(r.date, loc, names, { year: true }),
                ]),
                widths: [56, 32, 32, 26, 34],
              },
            }
          : { paragraphs: [t('lab.noResults')] },
        ...(orders.length
          ? [
              {
                heading: t('lab.orderedToday'),
                paragraphs: orders.flatMap((a) => a.orders.map((o) => `• ${tx(LAB_ORDERS.find((x) => x.id === o)?.label, loc)} (${a.id})`)),
              },
            ]
          : []),
      ],
      footer: t('pdf.footer'),
    });
    log();
    notify(t('toasts.pdf', { name: `${t('lab.fileName')}-${fileSlug(patient.name)}.pdf` }));
  }

  function log() {
    store.log('doctor', 'labPdf', { patient: patient.name });
  }

  return (
    <Card variant="bordered" padding="md">
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="min-w-0">
            <CardTitle>{t('lab.title')}</CardTitle>
            <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('lab.subtitle')}</p>
          </div>
          <SimTag>{t('lab.simTag')}</SimTag>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="sm:w-80">
            <label htmlFor="lab-patient" className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
              {t('lab.patient')}
            </label>
            <select
              id="lab-patient"
              value={patient.id}
              onChange={(e) => setSelId(e.target.value)}
              className="w-full rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white px-3 py-2.5 text-sm"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.labs.length})
                </option>
              ))}
            </select>
          </div>
          <Button variant="outline" onClick={download}>
            <ArrowDownTrayIcon className="w-4 h-4 mr-1" /> {t('lab.download')}
          </Button>
        </div>

        {patient.labs.length === 0 ? (
          <p className="text-sm text-secondary-500 dark:text-secondary-400">{t('lab.noResults')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="text-left text-secondary-500 dark:text-secondary-400 border-b border-secondary-200 dark:border-secondary-700">
                <tr>
                  <th className="py-2 pr-3">{t('lab.cols.test')}</th>
                  <th className="py-2 pr-3">{t('lab.cols.value')}</th>
                  <th className="py-2 pr-3">{t('lab.cols.ref')}</th>
                  <th className="py-2 pr-3">{t('lab.cols.flag')}</th>
                  <th className="py-2 pr-3">{t('lab.cols.date')}</th>
                </tr>
              </thead>
              <tbody>
                {patient.labs.map((r, i) => (
                  <tr key={i} className="border-b border-secondary-100 dark:border-secondary-800">
                    <td className="py-2.5 pr-3 text-secondary-900 dark:text-white font-medium">{tx(r.test, loc)}</td>
                    <td className="py-2.5 pr-3 text-secondary-900 dark:text-white whitespace-nowrap">{tx(r.value, loc)}</td>
                    <td className="py-2.5 pr-3 text-secondary-500 dark:text-secondary-400 whitespace-nowrap">{tx(r.ref, loc)}</td>
                    <td className="py-2.5 pr-3">{flagBadge(r.flag, t)}</td>
                    <td className="py-2.5 pr-3 text-secondary-500 dark:text-secondary-400 whitespace-nowrap">{fmtDate(r.date, loc, names, { year: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {orders.length > 0 && (
          <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-3">
            <p className="text-xs font-semibold text-secondary-800 dark:text-secondary-100 mb-1">{t('lab.orderedToday')}</p>
            <ul className="text-xs text-secondary-700 dark:text-secondary-200 space-y-0.5">
              {orders.flatMap((a) =>
                a.orders.map((o) => (
                  <li key={`${a.id}-${o}`}>
                    • {tx(LAB_ORDERS.find((x) => x.id === o)?.label, loc)}{' '}
                    <span className="text-secondary-400">
                      · {a.id} · {t('lab.pending')}
                    </span>
                  </li>
                )),
              )}
            </ul>
          </div>
        )}
        <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('lab.note')}</p>
      </CardContent>
    </Card>
  );
}

type BillFilter = 'all' | 'pending' | 'paid' | 'na';

export function BillingPanel({ store, notify }: { store: TelemedStore; notify: (text: string, tone?: 'ok' | 'warn') => void }) {
  const t = useTranslations('demoTelemed');
  const loc = useLoc();
  const names = useDateNames();
  const { attentions } = store.state;
  const [filter, setFilter] = useState<BillFilter>('all');
  const [q, setQ] = useState('');
  const [payFor, setPayFor] = useState<Attention | null>(null);
  const [method, setMethod] = useState<PayMethod>('pse');
  const [paying, setPaying] = useState(false);
  const [paidRef, setPaidRef] = useState<string | null>(null);
  const [detail, setDetail] = useState<Attention | null>(null);

  const totals = billingTotals(attentions);
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return [...attentions]
      .reverse()
      .filter((a) => filter === 'all' || a.payStatus === filter)
      .filter((a) => !n || a.patientName.toLowerCase().includes(n) || a.id.toLowerCase().includes(n) || (a.invoice ?? '').toLowerCase().includes(n));
  }, [attentions, filter, q]);

  const shareLabel = (a: Attention) => t(`billing.shareKind.${payerOf(a.payerId).kind}`);

  function exportCsv() {
    const head = [
      t('billing.cols.attention'),
      t('billing.cols.date'),
      t('billing.cols.patient'),
      t('billing.cols.service'),
      t('billing.cols.payer'),
      t('billing.cols.dx'),
      t('billing.cols.value'),
      t('billing.cols.patientShare'),
      t('billing.cols.payerShare'),
      t('billing.cols.status'),
      t('billing.cols.invoice'),
      'RIPS',
    ];
    const body = rows.map((a) => [
      a.id,
      `${a.date} ${a.time}`,
      a.patientName,
      a.kind === 'referral' ? t('billing.referral') : t(`specialties.${a.spec}`),
      tx(payerOf(a.payerId).name, loc),
      a.dx?.code ?? '',
      a.value,
      a.patientShare,
      a.payerShare,
      t(`billing.status.${a.payStatus}`),
      a.invoice ?? '',
      a.rips ? t('billing.ripsYes') : t('billing.ripsNo'),
    ]);
    downloadText(`${t('billing.fileName')}-${DEMO_DATE}.csv`, toCsv([head, ...body]), 'text/csv;charset=utf-8');
    store.log('billing', 'csvExported', { count: String(body.length) });
    notify(t('toasts.csv', { count: String(body.length) }));
  }

  function confirmPay() {
    if (!payFor) return;
    setPaying(true);
    window.setTimeout(() => {
      const ref = store.payAttention(payFor.id, method);
      store.log('billing', 'paid', { attention: payFor.id, amount: fmtCOP(payFor.patientShare, loc), method: { t: `billing.methods.${method}` } });
      setPaidRef(ref);
      setPaying(false);
    }, 1200);
  }

  function closePay() {
    setPayFor(null);
    setPaidRef(null);
    setPaying(false);
  }

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(
          [
            ['collected', totals.collected],
            ['pending', totals.pending],
            ['payers', totals.payers],
            ['total', totals.total],
          ] as const
        ).map(([k, v]) => (
          <Card key={k} variant="bordered" padding="sm">
            <p className="text-xs uppercase tracking-wide text-secondary-500 dark:text-secondary-400">{t(`billing.totals.${k}`)}</p>
            <p className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white mt-1">{fmtCOP(v, loc)}</p>
            <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t(`billing.totals.${k}Sub`)}</p>
          </Card>
        ))}
      </div>

      <Card variant="bordered" padding="md">
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="min-w-0">
              <CardTitle>{t('billing.title')}</CardTitle>
              <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
                {t('billing.subtitle', { date: fmtDate(DEMO_DATE, loc, names, { weekday: true, year: true }) })}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <ArrowDownTrayIcon className="w-4 h-4 mr-1" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="relative sm:w-72">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" />
              <Input className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('billing.search')} aria-label={t('billing.search')} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'pending', 'paid', 'na'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    filter === f
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white dark:bg-secondary-800 border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-200'
                  }`}
                >
                  {t(`billing.filters.${f}`)}
                </button>
              ))}
            </div>
          </div>
          {/* Tarjetas en celular */}
          <ul className="sm:hidden space-y-2">
            {rows.length === 0 && <li className="py-6 text-center text-sm text-secondary-500">{t('billing.empty')}</li>}
            {rows.map((a) => (
              <li key={a.id} className="rounded-xl border border-secondary-200 dark:border-secondary-700 p-3 text-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-secondary-900 dark:text-white">{a.patientName}</p>
                    <p className="text-secondary-500">
                      {a.id} · {a.time} · {a.kind === 'referral' ? t('billing.referral') : t(`specialties.${a.spec}`)}
                    </p>
                    <p className="text-secondary-600 dark:text-secondary-300">
                      {tx(payerOf(a.payerId).name, loc)}
                      {a.kind === 'consult' && ` · ${shareLabel(a)}`}
                    </p>
                  </div>
                  <Badge size="sm" variant={a.payStatus === 'paid' ? 'success' : a.payStatus === 'pending' ? 'warning' : 'default'}>
                    {t(`billing.status.${a.payStatus}`)}
                  </Badge>
                </div>
                <dl className="grid grid-cols-3 gap-2">
                  <div>
                    <dt className="text-secondary-500">{t('billing.cols.value')}</dt>
                    <dd className="font-semibold text-secondary-900 dark:text-white">{fmtCOP(a.value, loc)}</dd>
                  </div>
                  <div>
                    <dt className="text-secondary-500">{t('billing.cols.patientShare')}</dt>
                    <dd className="font-semibold text-secondary-900 dark:text-white">{fmtCOP(a.patientShare, loc)}</dd>
                  </div>
                  <div>
                    <dt className="text-secondary-500">{t('billing.cols.payerShare')}</dt>
                    <dd className="font-semibold text-secondary-900 dark:text-white">{fmtCOP(a.payerShare, loc)}</dd>
                  </div>
                </dl>
                <p className="text-secondary-500">
                  {t('billing.cols.invoice')}: <span className="font-mono">{a.invoice ?? '—'}</span> · RIPS:{' '}
                  {a.rips ? t('billing.ripsYes') : t('billing.ripsNo')}
                </p>
                <div className="flex gap-2">
                  {a.payStatus === 'pending' && (
                    <Button size="sm" className="flex-1" onClick={() => setPayFor(a)}>
                      {t('billing.collect')}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setDetail(a)}>
                    {t('billing.detail')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="text-left text-secondary-500 dark:text-secondary-400 border-b border-secondary-200 dark:border-secondary-700 text-xs">
                <tr>
                  <th className="py-2 pr-3">{t('billing.cols.attention')}</th>
                  <th className="py-2 pr-3">{t('billing.cols.patient')}</th>
                  <th className="py-2 pr-3">{t('billing.cols.payer')}</th>
                  <th className="py-2 pr-3 text-right">{t('billing.cols.value')}</th>
                  <th className="py-2 pr-3 text-right">{t('billing.cols.patientShare')}</th>
                  <th className="py-2 pr-3 text-right">{t('billing.cols.payerShare')}</th>
                  <th className="py-2 pr-3">{t('billing.cols.status')}</th>
                  <th className="py-2 pr-3">{t('billing.cols.invoice')}</th>
                  <th className="py-2 pr-3" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-secondary-500">
                      {t('billing.empty')}
                    </td>
                  </tr>
                )}
                {rows.map((a) => (
                  <tr key={a.id} className="border-b border-secondary-100 dark:border-secondary-800 align-top">
                    <td className="py-2.5 pr-3">
                      <p className="font-mono text-xs text-secondary-700 dark:text-secondary-200">{a.id}</p>
                      <p className="text-xs text-secondary-500">{a.time}</p>
                    </td>
                    <td className="py-2.5 pr-3">
                      <p className="text-secondary-900 dark:text-white">{a.patientName}</p>
                      <p className="text-xs text-secondary-500">{a.kind === 'referral' ? t('billing.referral') : t(`specialties.${a.spec}`)}</p>
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-secondary-700 dark:text-secondary-200">
                      {tx(payerOf(a.payerId).name, loc)}
                      {a.kind === 'consult' && <p className="text-secondary-500">{shareLabel(a)}</p>}
                    </td>
                    <td className="py-2.5 pr-3 text-right text-secondary-900 dark:text-white whitespace-nowrap">{fmtCOP(a.value, loc)}</td>
                    <td className="py-2.5 pr-3 text-right text-secondary-900 dark:text-white whitespace-nowrap">{fmtCOP(a.patientShare, loc)}</td>
                    <td className="py-2.5 pr-3 text-right text-secondary-900 dark:text-white whitespace-nowrap">{fmtCOP(a.payerShare, loc)}</td>
                    <td className="py-2.5 pr-3">
                      <Badge size="sm" variant={a.payStatus === 'paid' ? 'success' : a.payStatus === 'pending' ? 'warning' : 'default'}>
                        {t(`billing.status.${a.payStatus}`)}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-3 text-xs">
                      <p className="font-mono text-secondary-700 dark:text-secondary-200">{a.invoice ?? '—'}</p>
                      <p className="text-secondary-500">RIPS: {a.rips ? t('billing.ripsYes') : t('billing.ripsNo')}</p>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex gap-1.5 justify-end">
                        {a.payStatus === 'pending' && (
                          <Button size="sm" onClick={() => setPayFor(a)}>
                            {t('billing.collect')}
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setDetail(a)}>
                          {t('billing.detail')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('billing.note')}</p>
        </CardContent>
      </Card>

      {/* Cobro con pasarela simulada */}
      <Modal open={!!payFor} onClose={closePay} title={t('billing.payTitle')}>
        {payFor && (
          <div className="space-y-3 text-sm">
            <p className="text-secondary-700 dark:text-secondary-200">
              {t('billing.payBody', { name: payFor.patientName, amount: fmtCOP(payFor.patientShare, loc), concept: shareLabel(payFor) })}
            </p>
            {!paidRef ? (
              <>
                <fieldset className="space-y-1.5">
                  <legend className="text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1">{t('billing.method')}</legend>
                  {(['pse', 'card', 'wallet'] as const).map((m) => (
                    <label key={m} className="flex items-center gap-2 rounded-lg border border-secondary-200 dark:border-secondary-700 p-2 cursor-pointer">
                      <input type="radio" name="pay-method" checked={method === m} onChange={() => setMethod(m)} />
                      <span className="text-secondary-800 dark:text-secondary-100">{t(`billing.methods.${m}`)}</span>
                    </label>
                  ))}
                </fieldset>
                <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('billing.gatewayNote')}</p>
                <Button fullWidth onClick={confirmPay} disabled={paying}>
                  {paying ? t('billing.processing') : t('billing.payNow', { amount: fmtCOP(payFor.patientShare, loc) })}
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 p-3 text-emerald-900 dark:text-emerald-100">
                  <CheckCircleIcon className="w-5 h-5 shrink-0" />
                  <p>{t('billing.approved', { ref: paidRef })}</p>
                </div>
                <Button fullWidth variant="outline" onClick={closePay}>
                  {t('common.close')}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Detalle con RIPS simulado */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `${t('billing.detailTitle')} ${detail.id}` : ''} wide>
        {detail && <AttentionDetail a={detail} log={store.log} notify={notify} />}
      </Modal>
    </section>
  );
}

function AttentionDetail({ a, log, notify }: { a: Attention; log: LogFn; notify: (text: string) => void }) {
  const t = useTranslations('demoTelemed');
  const loc = useLoc();
  const rips = ripsFor(a);
  const json = JSON.stringify(rips, null, 2);
  return (
    <div className="space-y-4 text-sm">
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
        {(
          [
            [t('billing.cols.patient'), `${a.patientName} · ${a.docType} ${a.doc}`],
            [t('billing.cols.service'), a.kind === 'referral' ? t('billing.referral') : `${t(`specialties.${a.spec}`)} · ${t('summary.modalityValue')}`],
            [t('billing.cols.payer'), tx(payerOf(a.payerId).name, loc)],
            [t('billing.cols.dx'), a.dx ? `${a.dx.code} · ${tx(a.dx.label, loc)}` : '—'],
            [t('billing.cols.value'), fmtCOP(a.value, loc)],
            [`${t('billing.cols.patientShare')} (${t(`billing.shareKind.${payerOf(a.payerId).kind}`)})`, fmtCOP(a.patientShare, loc)],
            [t('billing.cols.payerShare'), fmtCOP(a.payerShare, loc)],
            [
              t('billing.cols.status'),
              `${t(`billing.status.${a.payStatus}`)}${a.payRef ? ` · ${t(`billing.methods.${a.payMethod ?? 'pse'}`)} · ${a.payRef}` : ''}`,
            ],
            [t('billing.cols.invoice'), a.invoice ? `${a.invoice} (${t('common.simulated')})` : t('billing.notBillable')],
            [t('billing.rx'), a.rx ? `${a.rx.number} · ${a.rx.meds.map((m) => tx(m.name, loc)).join(', ')}` : '—'],
          ] as [string, string][]
        ).map(([k, v]) => (
          <div key={k}>
            <dt className="text-secondary-500 dark:text-secondary-400">{k}</dt>
            <dd className="text-secondary-900 dark:text-white">{v}</dd>
          </div>
        ))}
      </dl>
      {a.rips ? (
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="text-xs font-semibold text-secondary-800 dark:text-secondary-100 flex items-center gap-1">
              <DocumentTextIcon className="w-4 h-4" /> {t('billing.ripsTitle')}
            </p>
            <SimTag>{t('common.simulated')}</SimTag>
          </div>
          <pre className="max-h-56 overflow-auto rounded-lg bg-secondary-900 text-secondary-100 p-3 text-[11px] leading-snug">{json}</pre>
          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                downloadText(`RIPS-${a.invoice}.json`, json, 'application/json');
                log('billing', 'ripsDownloaded', { invoice: a.invoice ?? '' });
                notify(t('toasts.json', { name: `RIPS-${a.invoice}.json` }));
              }}
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-1" /> {t('billing.ripsDownload')}
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-secondary-500 dark:text-secondary-400">{t('billing.ripsNote')}</p>
        </div>
      ) : (
        <p className="text-xs text-secondary-500">{t('billing.ripsNa')}</p>
      )}
    </div>
  );
}
