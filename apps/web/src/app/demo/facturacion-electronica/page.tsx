'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  BoltIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  DocumentCheckIcon,
  DocumentTextIcon,
  EyeIcon,
  GlobeAltIcon,
  PaperAirplaneIcon,
  PlusIcon,
  ServerStackIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  COUNTRIES,
  CountryCode,
  FISCAL_RULES,
  IncomingDoc,
  IssuedDoc,
  MOCK_DOCS,
  MOCK_INCOMING,
  ReceptionLine,
  SAMPLE_LINES,
  formatMoney,
  generateUuid,
} from './components/mockData';
import { EmissionSuccess, MetricCard, SummaryItem } from './components/shared';
import {
  ApiSection,
  DocumentsSection,
  ReceptionSection,
  ReportsSection,
  StorageSection,
  WhiteLabelSection,
} from './components/sections';

type EmissionTab = 'factura' | 'notaCredito' | 'notaDebito' | 'pos' | 'contingencia';
type EmissionState = 'idle' | 'signing' | 'sending' | 'validating' | 'accepted';

interface ClientForm {
  taxId: string;
  name: string;
  email: string;
  city: string;
}

export default function FacturacionElectronicaPage() {
  const t = useTranslations('demoBilling');

  const [country, setCountry] = useState<CountryCode>('colombia');
  const rule = FISCAL_RULES[country];
  const countryName = t(`countries.${country}.name`);
  const authority = t(`countries.${country}.authority`);
  const taxIdLabel = t(`countries.${country}.taxId`);
  const docPrefix = t(`countries.${country}.docPrefix`);
  const currencySymbol = t(`countries.${country}.currencySymbol`);

  const [emissionTab, setEmissionTab] = useState<EmissionTab>('factura');
  const [client, setClient] = useState<ClientForm>({ taxId: '', name: '', email: '', city: '' });
  const [lines, setLines] = useState<ReceptionLine[]>(SAMPLE_LINES);
  const [emissionState, setEmissionState] = useState<EmissionState>('idle');
  const [generatedUuid, setGeneratedUuid] = useState<string>('');

  const [docs, setDocs] = useState<IssuedDoc[]>(MOCK_DOCS);
  const [incoming, setIncoming] = useState<IncomingDoc[]>(MOCK_INCOMING);

  // Validación NIT/RUT/RFC en tiempo real (mock)
  const taxIdValidation = useMemo(() => {
    const value = client.taxId.trim();
    if (!value) return null;
    if (value.length < 3) return 'checking';
    return rule.taxIdRegex.test(value) ? 'valid' : 'invalid';
  }, [client.taxId, rule.taxIdRegex]);

  const totals = useMemo(() => {
    const subtotal = lines.reduce((acc, l) => acc + l.qty * l.unitPrice, 0);
    const vat = lines.reduce((acc, l) => acc + l.qty * l.unitPrice * l.vatRate, 0);
    const withholding = lines.reduce((acc, l) => acc + l.qty * l.unitPrice * l.withholding, 0);
    const ica = subtotal * rule.icaRate;
    return { subtotal, vat, withholding, ica, total: subtotal + vat - withholding + ica };
  }, [lines, rule.icaRate]);

  const handleCountryChange = (next: CountryCode) => {
    setCountry(next);
    setLines((prev) =>
      prev.map((l) => ({
        ...l,
        vatRate: FISCAL_RULES[next].vatRate,
        withholding: FISCAL_RULES[next].withholdingRate,
      })),
    );
    setEmissionState('idle');
    setGeneratedUuid('');
  };

  const updateLine = (idx: number, patch: Partial<ReceptionLine>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const addLine = () =>
    setLines((prev) => [
      ...prev,
      { description: '', qty: 1, unitPrice: 0, vatRate: rule.vatRate, withholding: rule.withholdingRate },
    ]);

  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const resetForm = () => {
    setClient({ taxId: '', name: '', email: '', city: '' });
    setLines(SAMPLE_LINES);
    setEmissionState('idle');
    setGeneratedUuid('');
  };

  const submitDocument = async () => {
    if (taxIdValidation !== 'valid' || !client.name || lines.length === 0) return;
    const steps: EmissionState[] = ['signing', 'validating', 'sending', 'accepted'];
    for (const step of steps) {
      setEmissionState(step);
      await new Promise((r) => setTimeout(r, step === 'accepted' ? 0 : 700));
    }
    const uuid = generateUuid(docPrefix);
    setGeneratedUuid(uuid);
    const newDoc: IssuedDoc = {
      id: uuid,
      number: `${docPrefix}-${Math.floor(Math.random() * 9000 + 1000)}`,
      client: client.name,
      taxId: client.taxId,
      date: new Date().toISOString().slice(0, 10),
      amount: Math.round(totals.total),
      status: 'accepted',
    };
    setDocs((prev) => [newDoc, ...prev]);
  };

  const resendDoc = (id: string) =>
    setDocs((prev) => prev.map((d) => (d.id === id && d.status !== 'voided' ? { ...d, status: 'accepted' } : d)));
  const voidDoc = (id: string) => setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'voided' } : d)));
  const decideIncoming = (id: string, decision: 'approved' | 'rejected') =>
    setIncoming((prev) => prev.map((i) => (i.id === id ? { ...i, decision } : i)));

  const acceptedDocs = docs.filter((d) => d.status === 'accepted').length;
  const acceptanceRate = docs.length === 0 ? 0 : Math.round((acceptedDocs / docs.length) * 100);

  const monthlySales = useMemo(() => {
    const acc = docs.filter((d) => d.status === 'accepted');
    return { count: acc.length, total: acc.reduce((a, b) => a + b.amount, 0) };
  }, [docs]);

  const monthlyPurchases = useMemo(() => {
    const acc = incoming.filter((i) => i.decision === 'approved');
    return { count: acc.length, total: acc.reduce((a, b) => a + b.amount, 0) };
  }, [incoming]);

  const submitDisabled = taxIdValidation !== 'valid' || !client.name || lines.length === 0 || emissionState !== 'idle';

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      <header className="bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <Link href="/demo" className="inline-flex items-center gap-2 text-secondary-600 dark:text-secondary-300 hover:text-primary-600">
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="text-sm font-medium">{t('back')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <DocumentCheckIcon className="w-6 h-6 text-primary-600" />
            <span className="font-semibold text-secondary-900 dark:text-white">{t('pageTitle')}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <section className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 sm:p-8 text-white shadow-sm">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t('pageTitle')}</h1>
          <p className="mt-2 text-lg text-emerald-50/90 max-w-3xl">{t('pageSubtitle')}</p>
        </section>

        {/* Selector país */}
        <Card variant="bordered" padding="md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
            <div>
              <p className="text-sm font-semibold text-secondary-900 dark:text-white flex items-center gap-2">
                <GlobeAltIcon className="w-5 h-5 text-primary-600" /> {t('selectCountry')}
              </p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('selectCountryHelp')}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="info">{authority}</Badge>
              <Badge variant="primary">{t(`countries.${country}.vat`)}</Badge>
              <Badge variant="secondary">{t(`countries.${country}.extraTax`)}</Badge>
              <Badge variant="default">{t(`countries.${country}.ica`)}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {COUNTRIES.map((c) => {
              const isActive = c === country;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCountryChange(c)}
                  className={
                    'inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition ' +
                    (isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-200 hover:border-emerald-500')
                  }
                >
                  <span className="text-lg leading-none">{FISCAL_RULES[c].flag}</span>
                  <span className="font-medium">{t(`countries.${c}.name`)}</span>
                  <span className={'text-xs ' + (isActive ? 'text-emerald-100' : 'text-secondary-500')}>
                    {t(`countries.${c}.authority`)}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Métricas top */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard icon={<DocumentTextIcon className="w-5 h-5" />} label={t('topMetrics.emittedToday')} value={String(monthlySales.count + 3)} accent="primary" />
          <MetricCard icon={<CheckBadgeIcon className="w-5 h-5" />} label={t('topMetrics.acceptanceRate')} value={`${acceptanceRate}%`} accent="success" />
          <MetricCard icon={<BoltIcon className="w-5 h-5" />} label={t('topMetrics.avgResponse')} value="1.8s" accent="warning" />
          <MetricCard icon={<ServerStackIcon className="w-5 h-5" />} label={t('topMetrics.storage')} value="384.2K" accent="info" />
        </section>

        {/* Emisión + Preview */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card variant="bordered" padding="md" className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle className="text-xl">{t('emission.title')}</CardTitle>
                  <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
                    {t('emission.subtitle', { authority })}
                  </p>
                </div>
                <Badge variant="info" size="sm">
                  {rule.flag} {countryName}
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(['factura', 'notaCredito', 'notaDebito', 'pos', 'contingencia'] as EmissionTab[]).map((tab) => {
                  const active = tab === emissionTab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setEmissionTab(tab)}
                      className={
                        'px-3 py-1.5 text-sm rounded-lg transition ' +
                        (active
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200 hover:bg-secondary-200 dark:hover:bg-secondary-700')
                      }
                    >
                      {t(`emission.tabs.${tab}`)}
                    </button>
                  );
                })}
              </div>
            </CardHeader>

            <CardContent>
              {emissionState === 'accepted' ? (
                <EmissionSuccess uuid={generatedUuid} authority={authority} onReset={resetForm} />
              ) : (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3">
                      {t('emission.form.client')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Input
                          label={t('emission.form.fields.taxId', { taxId: taxIdLabel })}
                          placeholder={t('emission.form.fields.taxIdPlaceholder', { taxId: taxIdLabel })}
                          value={client.taxId}
                          onChange={(e) => setClient({ ...client, taxId: e.target.value })}
                          helperText={
                            taxIdValidation === null
                              ? t('emission.form.validation.format', { format: rule.taxIdFormat })
                              : undefined
                          }
                          error={taxIdValidation === 'invalid' ? t('emission.form.validation.invalid') : undefined}
                        />
                        {taxIdValidation === 'checking' && (
                          <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                            <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                            {t('emission.form.validation.checking', { authority })}
                          </p>
                        )}
                        {taxIdValidation === 'valid' && (
                          <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            {t('emission.form.validation.valid', { authority })}
                          </p>
                        )}
                      </div>
                      <Input
                        label={t('emission.form.fields.name')}
                        placeholder={t('emission.form.fields.namePlaceholder')}
                        value={client.name}
                        onChange={(e) => setClient({ ...client, name: e.target.value })}
                      />
                      <Input
                        label={t('emission.form.fields.email')}
                        type="email"
                        placeholder={t('emission.form.fields.emailPlaceholder')}
                        value={client.email}
                        onChange={(e) => setClient({ ...client, email: e.target.value })}
                      />
                      <Input
                        label={t('emission.form.fields.city')}
                        placeholder={t('emission.form.fields.cityPlaceholder')}
                        value={client.city}
                        onChange={(e) => setClient({ ...client, city: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">
                        {t('emission.form.lines')}
                      </h3>
                      <Button size="sm" variant="outline" onClick={addLine}>
                        <PlusIcon className="w-4 h-4 mr-1" /> {t('emission.form.addLine')}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {lines.map((line, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-12 gap-2 p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800/50"
                        >
                          <input
                            className="col-span-12 md:col-span-5 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700"
                            placeholder={t('emission.form.lineFields.description')}
                            value={line.description}
                            onChange={(e) => updateLine(idx, { description: e.target.value })}
                          />
                          <input
                            type="number"
                            min={1}
                            className="col-span-3 md:col-span-1 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700"
                            value={line.qty}
                            onChange={(e) => updateLine(idx, { qty: Number(e.target.value) || 0 })}
                            aria-label={t('emission.form.lineFields.qty')}
                          />
                          <input
                            type="number"
                            min={0}
                            className="col-span-4 md:col-span-2 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700"
                            value={line.unitPrice}
                            onChange={(e) => updateLine(idx, { unitPrice: Number(e.target.value) || 0 })}
                            aria-label={t('emission.form.lineFields.unitPrice')}
                          />
                          <input
                            type="number"
                            step={0.01}
                            min={0}
                            max={1}
                            className="col-span-2 md:col-span-1 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700"
                            value={line.vatRate}
                            onChange={(e) => updateLine(idx, { vatRate: Number(e.target.value) || 0 })}
                            aria-label={t('emission.form.lineFields.vatRate')}
                          />
                          <input
                            type="number"
                            step={0.01}
                            min={0}
                            max={1}
                            className="col-span-2 md:col-span-1 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700"
                            value={line.withholding}
                            onChange={(e) => updateLine(idx, { withholding: Number(e.target.value) || 0 })}
                            aria-label={t('emission.form.lineFields.withholding')}
                          />
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="col-span-1 inline-flex items-center justify-center text-red-500 hover:text-red-700"
                            aria-label={t('emission.form.removeLine')}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 rounded-lg bg-secondary-50 dark:bg-secondary-800/50 border border-secondary-200 dark:border-secondary-700 text-sm">
                    <SummaryItem label={t('emission.form.subtotal')} value={formatMoney(totals.subtotal, currencySymbol)} />
                    <SummaryItem label={t('emission.form.vat')} value={formatMoney(totals.vat, currencySymbol)} />
                    <SummaryItem label={t('emission.form.withholding')} value={`- ${formatMoney(totals.withholding, currencySymbol)}`} />
                    <SummaryItem label={t('emission.form.ica')} value={formatMoney(totals.ica, currencySymbol)} />
                    <SummaryItem label={t('emission.form.total')} value={formatMoney(totals.total, currencySymbol)} highlight />
                  </div>

                  {emissionState !== 'idle' && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200 text-sm">
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      <span>
                        {emissionState === 'signing' && t('emission.result.signing')}
                        {emissionState === 'validating' && t('emission.result.validating')}
                        {emissionState === 'sending' && t('emission.result.sending', { authority })}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={submitDocument} isLoading={emissionState !== 'idle'} disabled={submitDisabled}>
                      <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                      {emissionState === 'idle' ? t('emission.form.submit') : t('emission.form.submitting', { authority })}
                    </Button>
                    <Button variant="ghost" onClick={resetForm}>
                      {t('emission.form.reset')}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card variant="elevated" padding="md" className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <EyeIcon className="w-5 h-5 text-primary-600" /> {t('emission.preview.title')}
              </CardTitle>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                {t('emission.preview.subtitle')}
              </p>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 p-4 text-xs space-y-3">
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-secondary-200 dark:border-secondary-700">
                  <div>
                    <p className="font-bold text-secondary-900 dark:text-white">{t('emission.preview.issuerName')}</p>
                    <p className="text-secondary-500">{taxIdLabel}: {t('emission.preview.issuerTaxId')}</p>
                    <p className="text-secondary-500">{authority} · {countryName}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="primary" size="sm">{docPrefix}</Badge>
                    <p className="text-secondary-500 mt-1">{new Date().toISOString().slice(0, 10)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-secondary-500 uppercase tracking-wide text-[10px]">{t('emission.preview.receiver')}</p>
                  {client.name ? (
                    <>
                      <p className="font-medium text-secondary-900 dark:text-white">{client.name}</p>
                      <p className="text-secondary-500">{taxIdLabel}: {client.taxId || '—'}</p>
                      <p className="text-secondary-500">{client.city || '—'} · {client.email || '—'}</p>
                    </>
                  ) : (
                    <p className="italic text-secondary-400">{t('emission.preview.noReceiver')}</p>
                  )}
                </div>
                <div className="space-y-1">
                  {lines.slice(0, 4).map((line, idx) => (
                    <div key={idx} className="flex justify-between gap-2">
                      <span className="truncate text-secondary-600 dark:text-secondary-300">
                        {line.qty} × {line.description || '—'}
                      </span>
                      <span className="text-secondary-700 dark:text-secondary-200 tabular-nums">
                        {formatMoney(line.qty * line.unitPrice, currencySymbol)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-dashed border-secondary-200 dark:border-secondary-700 flex justify-between font-semibold text-secondary-900 dark:text-white">
                  <span>{t('emission.form.total')}</span>
                  <span className="tabular-nums">{formatMoney(totals.total, currencySymbol)}</span>
                </div>
                <div className="pt-2 flex items-center gap-3">
                  <div className="w-16 h-16 rounded bg-[repeating-conic-gradient(#1f2937_0%_25%,transparent_0%_50%)] opacity-80" aria-hidden />
                  <div className="text-[10px] text-secondary-500 dark:text-secondary-400">
                    <p className="uppercase tracking-wide">{t('emission.preview.cufeLabel')}</p>
                    <p className="font-mono break-all">{generatedUuid || t('emission.preview.cufePending')}</p>
                  </div>
                </div>
                <p className="text-[10px] text-secondary-400 pt-2 border-t border-secondary-200 dark:border-secondary-700">
                  {t('emission.preview.footer')}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <DocumentsSection docs={docs} taxIdLabel={taxIdLabel} currencySymbol={currencySymbol} onResend={resendDoc} onVoid={voidDoc} />

        <ReceptionSection incoming={incoming} taxIdLabel={taxIdLabel} currencySymbol={currencySymbol} onDecide={decideIncoming} />

        <ReportsSection
          salesCount={monthlySales.count}
          salesTotal={monthlySales.total}
          purchasesCount={monthlyPurchases.count}
          purchasesTotal={monthlyPurchases.total}
          vatTotal={monthlySales.total * rule.vatRate}
          withholdingTotal={monthlySales.total * rule.withholdingRate}
          totalDocs={docs.length}
          currencySymbol={currencySymbol}
        />

        <ApiSection />

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WhiteLabelSection />
          <StorageSection country={country} />
        </section>
      </main>
    </div>
  );
}
