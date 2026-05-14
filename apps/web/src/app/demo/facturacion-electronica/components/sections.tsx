'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  BuildingOffice2Icon,
  CheckCircleIcon,
  ChevronRightIcon,
  CloudArrowUpIcon,
  CodeBracketIcon,
  DocumentArrowDownIcon,
  DocumentChartBarIcon,
  DocumentDuplicateIcon,
  InboxArrowDownIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import {
  CODE_SAMPLES,
  CountryCode,
  DocStatus,
  ENDPOINTS,
  FISCAL_RULES,
  IncomingDoc,
  IssuedDoc,
  MOCK_BRANDS,
  formatMoney,
} from './mockData';
import { MiniStat, ReportRow, StorageFeature, ValidationPill } from './shared';

type StatusFilter = DocStatus | 'all';
type CodeLang = 'ts' | 'python' | 'go';

const STATUS_VARIANT: Record<DocStatus, 'success' | 'warning' | 'danger' | 'default'> = {
  accepted: 'success',
  pending: 'warning',
  rejected: 'danger',
  voided: 'default',
};

interface DocumentsSectionProps {
  docs: IssuedDoc[];
  taxIdLabel: string;
  currencySymbol: string;
  onResend: (id: string) => void;
  onVoid: (id: string) => void;
}

export function DocumentsSection({ docs, taxIdLabel, currencySymbol, onResend, onVoid }: DocumentsSectionProps) {
  const t = useTranslations('demoBilling');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = useMemo(() => {
    return docs.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        d.number.toLowerCase().includes(q) ||
        d.client.toLowerCase().includes(q) ||
        d.taxId.toLowerCase().includes(q)
      );
    });
  }, [docs, statusFilter, searchQuery]);

  return (
    <Card variant="bordered" padding="md">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <DocumentDuplicateIcon className="w-5 h-5 text-primary-600" /> {t('documents.title')}
        </CardTitle>
        <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('documents.subtitle')}</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'accepted', 'pending', 'rejected', 'voided'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={
                  'px-3 py-1.5 rounded-full text-xs font-medium transition ' +
                  (statusFilter === s
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200 hover:bg-secondary-200 dark:hover:bg-secondary-700')
                }
              >
                {t(`documents.filters.${s}`)}
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={t('documents.filters.search', { taxId: taxIdLabel })}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-secondary-500 dark:text-secondary-400 border-b border-secondary-200 dark:border-secondary-700">
              <tr>
                <th className="py-2 pr-3">{t('documents.table.number')}</th>
                <th className="py-2 pr-3">{t('documents.table.client')}</th>
                <th className="py-2 pr-3">{t('documents.table.date')}</th>
                <th className="py-2 pr-3 text-right">{t('documents.table.amount')}</th>
                <th className="py-2 pr-3">{t('documents.table.status')}</th>
                <th className="py-2 pr-3 text-right">{t('documents.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-secondary-500">
                    {t('documents.empty')}
                  </td>
                </tr>
              )}
              {filteredDocs.map((d) => (
                <tr key={d.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                  <td className="py-2 pr-3 font-mono text-xs">{d.number}</td>
                  <td className="py-2 pr-3">
                    <div className="font-medium text-secondary-900 dark:text-white">{d.client}</div>
                    <div className="text-xs text-secondary-500">{d.taxId}</div>
                  </td>
                  <td className="py-2 pr-3 text-secondary-600 dark:text-secondary-300">{d.date}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{formatMoney(d.amount, currencySymbol)}</td>
                  <td className="py-2 pr-3">
                    <Badge variant={STATUS_VARIANT[d.status]} size="sm">
                      {t(`documents.filters.${d.status}`)}
                    </Badge>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center justify-end gap-2 text-xs">
                      <button onClick={() => onResend(d.id)} className="text-primary-600 hover:underline" type="button">
                        {t('documents.table.resend')}
                      </button>
                      <button className="text-secondary-600 dark:text-secondary-300 hover:underline" type="button">
                        {t('documents.table.pdf')}
                      </button>
                      <button className="text-secondary-600 dark:text-secondary-300 hover:underline" type="button">
                        {t('documents.table.xml')}
                      </button>
                      {d.status !== 'voided' && (
                        <button onClick={() => onVoid(d.id)} className="text-red-500 hover:underline" type="button">
                          {t('documents.table.void')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

interface ReceptionSectionProps {
  incoming: IncomingDoc[];
  taxIdLabel: string;
  currencySymbol: string;
  onDecide: (id: string, decision: 'approved' | 'rejected') => void;
}

export function ReceptionSection({ incoming, taxIdLabel, currencySymbol, onDecide }: ReceptionSectionProps) {
  const t = useTranslations('demoBilling');
  return (
    <Card variant="bordered" padding="md">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <InboxArrowDownIcon className="w-5 h-5 text-primary-600" /> {t('reception.title')}
        </CardTitle>
        <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
          {t('reception.subtitle', { taxId: taxIdLabel })}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <MiniStat
            label={t('reception.stats.incoming')}
            value={incoming.filter((i) => i.decision === 'pending').length}
            accent="warning"
          />
          <MiniStat
            label={t('reception.stats.validated')}
            value={incoming.filter((i) => i.decision === 'approved').length}
            accent="success"
          />
          <MiniStat
            label={t('reception.stats.rejected')}
            value={incoming.filter((i) => i.decision === 'rejected').length}
            accent="danger"
          />
        </div>
        <div className="space-y-3">
          {incoming.map((i) => (
            <div
              key={i.id}
              className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-3 flex flex-col md:flex-row md:items-center gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-secondary-900 dark:text-white">{i.supplier}</p>
                  <span className="text-xs text-secondary-500">
                    {taxIdLabel}: {i.taxId}
                  </span>
                </div>
                <p className="text-xs text-secondary-500 mt-0.5">
                  {i.date} · {formatMoney(i.amount, currencySymbol)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  <ValidationPill ok={i.ocrConfidence >= 0.9} label={`${t('reception.list.ocr')} ${Math.round(i.ocrConfidence * 100)}%`} />
                  <ValidationPill ok={i.taxIdValid} label={t('reception.list.taxIdCheck', { taxId: taxIdLabel })} />
                  <ValidationPill ok={!i.duplicate} label={t('reception.list.duplicateCheck')} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {i.decision === 'pending' ? (
                  <>
                    <Button size="sm" onClick={() => onDecide(i.id, 'approved')}>
                      <CheckCircleIcon className="w-4 h-4 mr-1" /> {t('reception.list.approve')}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => onDecide(i.id, 'rejected')}>
                      <XCircleIcon className="w-4 h-4 mr-1" /> {t('reception.list.reject')}
                    </Button>
                  </>
                ) : (
                  <Badge variant={i.decision === 'approved' ? 'success' : 'danger'}>
                    {i.decision === 'approved' ? t('reception.list.approved') : t('reception.list.rejectedLabel')}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ReportsSectionProps {
  salesCount: number;
  salesTotal: number;
  purchasesCount: number;
  purchasesTotal: number;
  vatTotal: number;
  withholdingTotal: number;
  totalDocs: number;
  currencySymbol: string;
}

export function ReportsSection({
  salesCount,
  salesTotal,
  purchasesCount,
  purchasesTotal,
  vatTotal,
  withholdingTotal,
  totalDocs,
  currencySymbol,
}: ReportsSectionProps) {
  const t = useTranslations('demoBilling');
  const [reportMonth, setReportMonth] = useState(5);
  const [reportYear, setReportYear] = useState(2026);
  const formats = [t('reports.formats.pdf'), t('reports.formats.excel'), t('reports.formats.xml')];
  return (
    <Card variant="bordered" padding="md">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <DocumentChartBarIcon className="w-5 h-5 text-primary-600" /> {t('reports.title')}
        </CardTitle>
        <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('reports.subtitle')}</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-300 mb-1">
              {t('reports.period')}
            </label>
            <div className="flex gap-2">
              <select
                value={reportMonth}
                onChange={(e) => setReportMonth(Number(e.target.value))}
                className="rounded-md text-sm px-3 py-1.5 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {t(`reports.months.${m}`)}
                  </option>
                ))}
              </select>
              <select
                value={reportYear}
                onChange={(e) => setReportYear(Number(e.target.value))}
                className="rounded-md text-sm px-3 py-1.5 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700"
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ReportRow
            title={t('reports.books.sales')}
            count={salesCount}
            amount={formatMoney(salesTotal, currencySymbol)}
            tDocs={t('reports.totalDocs')}
            tAmount={t('reports.totalAmount')}
            tExport={t('reports.export')}
            tFormats={formats}
          />
          <ReportRow
            title={t('reports.books.purchases')}
            count={purchasesCount}
            amount={formatMoney(purchasesTotal, currencySymbol)}
            tDocs={t('reports.totalDocs')}
            tAmount={t('reports.totalAmount')}
            tExport={t('reports.export')}
            tFormats={formats}
          />
          <ReportRow
            title={t('reports.books.vat')}
            count={totalDocs}
            amount={formatMoney(vatTotal, currencySymbol)}
            tDocs={t('reports.totalDocs')}
            tAmount={t('reports.totalAmount')}
            tExport={t('reports.export')}
            tFormats={formats}
          />
          <ReportRow
            title={t('reports.books.withholding')}
            count={totalDocs}
            amount={formatMoney(withholdingTotal, currencySymbol)}
            tDocs={t('reports.totalDocs')}
            tAmount={t('reports.totalAmount')}
            tExport={t('reports.export')}
            tFormats={formats}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function ApiSection() {
  const t = useTranslations('demoBilling');
  const [codeLang, setCodeLang] = useState<CodeLang>('ts');
  return (
    <Card variant="bordered" padding="md">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <CodeBracketIcon className="w-5 h-5 text-primary-600" /> {t('api.title')}
        </CardTitle>
        <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('api.subtitle')}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="flex gap-2 mb-3">
              {(['ts', 'python', 'go'] as CodeLang[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setCodeLang(lang)}
                  className={
                    'px-3 py-1 rounded-md text-xs font-medium ' +
                    (codeLang === lang
                      ? 'bg-primary-600 text-white'
                      : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-200')
                  }
                >
                  {t(`api.languages.${lang}`)}
                </button>
              ))}
            </div>
            <pre className="rounded-lg bg-secondary-900 text-secondary-100 text-xs p-4 overflow-x-auto">
              <code>{CODE_SAMPLES.find((s) => s.language === codeLang)?.code}</code>
            </pre>
            <div className="mt-4">
              <p className="text-sm font-semibold text-secondary-900 dark:text-white mb-2">{t('api.endpoints')}</p>
              <ul className="space-y-1 text-xs">
                {ENDPOINTS.map((ep) => (
                  <li key={ep.path} className="flex items-center gap-2 flex-wrap">
                    <Badge variant={ep.method === 'GET' ? 'info' : 'success'} size="sm">
                      {ep.method}
                    </Badge>
                    <code className="font-mono text-secondary-700 dark:text-secondary-200">{ep.path}</code>
                    <span className="text-secondary-500">— {ep.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-secondary-900 dark:text-white mb-2">{t('api.webhooks')}</p>
            <ul className="space-y-2 text-xs">
              {(['accepted', 'rejected', 'received', 'void', 'credit'] as const).map((key) => (
                <li key={key} className="flex items-start gap-2 p-2 rounded-md bg-secondary-50 dark:bg-secondary-800/50">
                  <ChevronRightIcon className="w-3.5 h-3.5 mt-0.5 text-primary-500 flex-shrink-0" />
                  <span className="text-secondary-700 dark:text-secondary-200 font-mono">
                    {t(`api.webhookEvents.${key}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WhiteLabelSection() {
  const t = useTranslations('demoBilling');
  const [whiteLabelOn, setWhiteLabelOn] = useState(true);
  return (
    <Card variant="bordered" padding="md">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-primary-600" /> {t('whiteLabel.title')}
        </CardTitle>
        <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('whiteLabel.subtitle')}</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <span
              className={
                'relative inline-flex h-6 w-11 items-center rounded-full transition ' +
                (whiteLabelOn ? 'bg-primary-600' : 'bg-secondary-300 dark:bg-secondary-700')
              }
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={whiteLabelOn}
                onChange={(e) => setWhiteLabelOn(e.target.checked)}
              />
              <span
                className={
                  'inline-block h-4 w-4 rounded-full bg-white transition ' +
                  (whiteLabelOn ? 'translate-x-6' : 'translate-x-1')
                }
              />
            </span>
            <span className="text-sm text-secondary-700 dark:text-secondary-200">
              {whiteLabelOn ? t('whiteLabel.toggle') : t('whiteLabel.toggleOff')}
            </span>
          </label>
          {whiteLabelOn && (
            <Button size="sm" variant="outline">
              <PlusIcon className="w-4 h-4 mr-1" /> {t('whiteLabel.addBrand')}
            </Button>
          )}
        </div>
        <div className={whiteLabelOn ? 'space-y-2' : 'opacity-40 pointer-events-none space-y-2'}>
          {MOCK_BRANDS.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-3 p-3 rounded-lg border border-secondary-200 dark:border-secondary-700"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                  <BuildingOffice2Icon className="w-5 h-5 text-primary-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-secondary-900 dark:text-white truncate">{b.name}</p>
                  <p className="text-xs text-secondary-500 truncate">{b.domain}</p>
                </div>
              </div>
              <div className="text-right text-xs text-secondary-500">
                <p>
                  {b.clients} {t('whiteLabel.brands.clients').toLowerCase()}
                </p>
                <p>
                  {b.monthlyDocs.toLocaleString()} {t('whiteLabel.brands.monthlyDocs').toLowerCase()}
                </p>
              </div>
              <Badge variant={b.status === 'active' ? 'success' : 'warning'} size="sm">
                {b.status === 'active' ? t('whiteLabel.brands.active') : t('whiteLabel.brands.trial')}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface StorageSectionProps {
  country: CountryCode;
}

export function StorageSection({ country }: StorageSectionProps) {
  const t = useTranslations('demoBilling');
  const rule = FISCAL_RULES[country];
  const countryName = t(`countries.${country}.name`);
  const authority = t(`countries.${country}.authority`);
  const storageYears = t(`countries.${country}.storageYears`);
  return (
    <Card variant="bordered" padding="md">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <ShieldCheckIcon className="w-5 h-5 text-primary-600" /> {t('storage.title')}
        </CardTitle>
        <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('storage.subtitle')}</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-primary-50 dark:bg-primary-900/30 mb-4">
          <span className="text-3xl">{rule.flag}</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-secondary-900 dark:text-white">{countryName}</p>
            <p className="text-xs text-secondary-500">{authority}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-300 tabular-nums">{storageYears}</p>
            <p className="text-xs text-secondary-500">{t('storage.yearsLabel')}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 text-sm">
          <StorageFeature icon={<DocumentArrowDownIcon className="w-4 h-4" />} label={`384,210 ${t('storage.storedDocs')}`} />
          <StorageFeature icon={<LockClosedIcon className="w-4 h-4" />} label={t('storage.encrypted')} />
          <StorageFeature icon={<CloudArrowUpIcon className="w-4 h-4" />} label={t('storage.immutable')} />
          <StorageFeature icon={<ShieldCheckIcon className="w-4 h-4" />} label={t('storage.audit')} />
        </div>
      </CardContent>
    </Card>
  );
}
