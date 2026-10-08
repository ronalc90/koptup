'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  ArrowDownTrayIcon,
  BanknotesIcon,
  DocumentArrowDownIcon,
  QrCodeIcon,
  ReceiptPercentIcon,
  ShoppingCartIcon,
  TicketIcon,
} from '@heroicons/react/24/outline';
import { COUPON_RE, pick, toCsv } from '../lib/engine';
import { downloadText } from '../lib/files';
import { useLmsReady } from '../lib/store';
import { allCourses, salesInWindow, salesList } from '../lib/selectors';
import type { PayMethod, Sale } from '../lib/types';
import { certPayload, useOrigin } from './EngagementSections';
import { verifyUrl } from '../lib/engine';
import { downloadReceipt } from './receipt';
import { Empty, SectionTitle, SimNote, btn, inputCls, labelCls, selectCls, useFmt } from './ui';

const METHODS: PayMethod[] = ['pse', 'card', 'nequi'];
const METHOD_COLOR: Record<PayMethod, string> = { pse: 'from-cyan-400 to-cyan-600', card: 'from-indigo-400 to-indigo-600', nequi: 'from-fuchsia-400 to-fuchsia-600' };
const PAGE = 12;

function SalesView() {
  const t = useTranslations('demoLms');
  const f = useFmt();
  const { state, today } = useLmsReady();
  const courses = allCourses(state);
  const sales = useMemo(() => salesList(state), [state]);
  const [period, setPeriod] = useState<'30' | '90' | 'all'>('30');
  const [method, setMethod] = useState<PayMethod | 'all'>('all');
  const [course, setCourse] = useState('all');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(PAGE);

  const courseTitle = (id: string) => {
    const c = courses.find((x) => x.id === id);
    return c ? pick(c.title, f.locale) : id;
  };

  const last30 = salesInWindow(sales, today, 30);
  const revenue = last30.reduce((a, s) => a + s.total, 0);
  const discounts = last30.reduce((a, s) => a + s.discount, 0);
  const byMethod = METHODS.map((m) => {
    const list = last30.filter((s) => s.method === m);
    return { m, count: list.length, total: list.reduce((a, s) => a + s.total, 0) };
  });
  const maxMethod = Math.max(1, ...byMethod.map((x) => x.total));
  const byCourse = courses
    .map((c) => {
      const list = last30.filter((s) => s.courseId === c.id);
      return { c, count: list.length, total: list.reduce((a, s) => a + s.total, 0) };
    })
    .filter((x) => x.count > 0)
    .sort((a, b) => b.total - a.total);
  const maxCourse = Math.max(1, ...byCourse.map((x) => x.total));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = period === 'all' ? sales : salesInWindow(sales, today, Number(period));
    return base.filter(
      (s) =>
        (method === 'all' || s.method === method) &&
        (course === 'all' || s.courseId === course) &&
        (!q || s.buyer.toLowerCase().includes(q) || s.ref.toLowerCase().includes(q) || s.invoice.toLowerCase().includes(q)),
    );
  }, [sales, period, method, course, search, today]);

  const exportCsv = () => {
    const head = [t('admin.colDate'), t('admin.colRef'), t('admin.colInvoice'), t('admin.colBuyer'), t('admin.colCourse'), t('admin.colMethod'), t('admin.colCoupon'), t('admin.colGross'), t('admin.colDiscount'), t('admin.colTotal')];
    const rows = filtered.map((s) => [s.date, s.ref, s.invoice, s.buyer, courseTitle(s.courseId), t(`pay.${s.method}`), s.coupon ?? '', s.gross, s.discount, s.total]);
    downloadText(`ventas-${period}-${today}.csv`, toCsv([head, ...rows]), 'text/csv;charset=utf-8');
    toast.success(t('admin.csvDone', { count: filtered.length }));
  };

  const kpis = [
    { icon: BanknotesIcon, label: t('admin.revenue30'), value: f.money(revenue), color: 'from-emerald-500 to-teal-600' },
    { icon: ShoppingCartIcon, label: t('admin.sales30'), value: f.int(last30.length), color: 'from-cyan-500 to-blue-600' },
    { icon: TicketIcon, label: t('admin.avgTicket'), value: last30.length ? f.money(revenue / last30.length) : '—', color: 'from-purple-500 to-pink-600' },
    { icon: ReceiptPercentIcon, label: t('admin.discounts30'), value: f.money(discounts), color: 'from-amber-500 to-orange-600' },
  ];

  const pdf = (s: Sale) => downloadReceipt(s, courseTitle(s.courseId), t, f).catch(() => toast.error(t('common.pdfError')));

  return (
    <div className="space-y-6">
      <SectionTitle
        title={t('admin.salesTitle')}
        subtitle={t('admin.salesSubtitle')}
        action={
          <button type="button" className={btn.outline} onClick={exportCsv}>
            <ArrowDownTrayIcon className="w-4 h-4" />
            {t('admin.exportCsv')}
          </button>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} variant="bordered">
            <CardContent className="p-0">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${k.color} flex items-center justify-center mb-3`}>
                <k.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white break-words">{k.value}</p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="bordered">
          <CardContent className="p-0">
            <h3 className="text-base font-semibold text-secondary-900 dark:text-white mb-4">{t('admin.byMethod')}</h3>
            <div className="space-y-3">
              {byMethod.map((x) => (
                <div key={x.m}>
                  <div className="flex items-center justify-between text-sm mb-1 gap-2">
                    <span className="text-secondary-800 dark:text-secondary-100">
                      {t(`pay.${x.m}`)} <span className="text-[11px] text-secondary-500">({t('admin.salesN', { count: x.count })})</span>
                    </span>
                    <span className="font-semibold text-secondary-700 dark:text-secondary-200">{f.money(x.total)}</span>
                  </div>
                  <div className="h-2 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${METHOD_COLOR[x.m]}`} style={{ width: `${(x.total / maxMethod) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="p-0">
            <h3 className="text-base font-semibold text-secondary-900 dark:text-white mb-4">{t('admin.byCourse')}</h3>
            <div className="space-y-3">
              {byCourse.map((x) => (
                <div key={x.c.id}>
                  <div className="flex items-center justify-between text-sm mb-1 gap-2">
                    <span className="text-secondary-800 dark:text-secondary-100 truncate min-w-0">
                      {pick(x.c.title, f.locale)} <span className="text-[11px] text-secondary-500">({t('admin.salesN', { count: x.count })})</span>
                    </span>
                    <span className="font-semibold text-secondary-700 dark:text-secondary-200 shrink-0">{f.money(x.total)}</span>
                  </div>
                  <div className="h-2 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${(x.total / maxCourse) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="bordered">
        <CardContent className="p-0 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <input
              className={`${inputCls} sm:w-72`}
              placeholder={t('admin.searchPh')}
              aria-label={t('admin.searchPh')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setLimit(PAGE);
              }}
            />
            <select className={`${selectCls} w-auto`} value={period} onChange={(e) => setPeriod(e.target.value as '30' | '90' | 'all')} aria-label={t('admin.period')}>
              <option value="30">{t('admin.period30')}</option>
              <option value="90">{t('admin.period90')}</option>
              <option value="all">{t('admin.periodAll')}</option>
            </select>
            <select className={`${selectCls} w-auto`} value={method} onChange={(e) => setMethod(e.target.value as PayMethod | 'all')} aria-label={t('admin.colMethod')}>
              <option value="all">{t('admin.allMethods')}</option>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {t(`pay.${m}`)}
                </option>
              ))}
            </select>
            <select className={`${selectCls} w-auto max-w-[14rem]`} value={course} onChange={(e) => setCourse(e.target.value)} aria-label={t('admin.colCourse')}>
              <option value="all">{t('analytics.allCourses')}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {pick(c.title, f.locale)}
                </option>
              ))}
            </select>
            <span className="text-xs text-secondary-500 dark:text-secondary-400" aria-live="polite">
              {t('admin.resultCount', { count: filtered.length, total: f.money(filtered.reduce((a, s) => a + s.total, 0)) })}
            </span>
          </div>
          {filtered.length === 0 ? (
            <Empty>{t('admin.noSales')}</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                    <th className="py-2 pr-3 font-semibold">{t('admin.colDate')}</th>
                    <th className="py-2 pr-3 font-semibold">{t('admin.colBuyer')}</th>
                    <th className="py-2 pr-3 font-semibold">{t('admin.colCourse')}</th>
                    <th className="py-2 pr-3 font-semibold">{t('admin.colMethod')}</th>
                    <th className="py-2 pr-3 font-semibold text-right">{t('admin.colTotal')}</th>
                    <th className="py-2 pr-3 font-semibold">{t('admin.colInvoice')}</th>
                    <th className="py-2 font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, limit).map((s) => (
                    <tr key={s.id} className={`border-t border-secondary-100 dark:border-secondary-800 ${s.mine ? 'bg-cyan-50/60 dark:bg-cyan-900/10' : ''}`}>
                      <td className="py-2 pr-3 whitespace-nowrap">{f.date(s.date)}</td>
                      <td className="py-2 pr-3">
                        {s.buyer}
                        {s.mine && <span className="ml-1 text-[10px] text-cyan-700 dark:text-cyan-300">({t('admin.yourPurchase')})</span>}
                        <span className="block text-[11px] text-secondary-500 font-mono">{s.ref}</span>
                      </td>
                      <td className="py-2 pr-3 text-xs">{courseTitle(s.courseId)}</td>
                      <td className="py-2 pr-3 text-xs whitespace-nowrap">
                        {t(`pay.${s.method}`)}
                        {s.coupon && <span className="block text-[10px] text-emerald-700 dark:text-emerald-300">{s.coupon}</span>}
                      </td>
                      <td className="py-2 pr-3 text-right whitespace-nowrap font-semibold">{f.money(s.total)}</td>
                      <td className="py-2 pr-3 text-xs font-mono">{s.invoice}</td>
                      <td className="py-2 text-right">
                        <button type="button" className={btn.small} onClick={() => pdf(s)} aria-label={t('admin.receipt')} title={t('admin.receipt')}>
                          <DocumentArrowDownIcon className="w-3.5 h-3.5" />
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {filtered.length > limit && (
            <div className="text-center">
              <button type="button" className={btn.outline} onClick={() => setLimit((l) => l + PAGE)}>
                {t('admin.showMore', { count: Math.min(PAGE, filtered.length - limit) })}
              </button>
            </div>
          )}
          <SimNote>{t('admin.salesNote')}</SimNote>
        </CardContent>
      </Card>
    </div>
  );
}

function CouponsView() {
  const t = useTranslations('demoLms');
  const { state, dispatch } = useLmsReady();
  const [code, setCode] = useState('');
  const [pct, setPct] = useState(10);
  const [error, setError] = useState('');

  const add = () => {
    const c = code.trim().toUpperCase();
    if (!COUPON_RE.test(c)) return setError(t('admin.couponErrCode'));
    if (!(pct >= 5 && pct <= 50)) return setError(t('admin.couponErrPct'));
    if (state.coupons.some((x) => x.code === c)) return setError(t('admin.couponErrDup'));
    dispatch({ type: 'coupon.add', code: c, pct });
    setCode('');
    setError('');
    toast.success(t('admin.couponCreated', { code: c }));
  };

  return (
    <div className="space-y-6">
      <SectionTitle title={t('admin.couponsTitle')} subtitle={t('admin.couponsSubtitle')} />
      <Card variant="bordered">
        <CardContent className="p-0">
          <form
            className="grid sm:grid-cols-[1fr_8rem_auto] gap-3 items-end"
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
          >
            <div>
              <label className={labelCls} htmlFor="lms-coupon-code">
                {t('admin.couponCode')}
              </label>
              <input id="lms-coupon-code" className={`${inputCls} uppercase`} value={code} maxLength={16} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CURSOS15" />
            </div>
            <div>
              <label className={labelCls} htmlFor="lms-coupon-pct">
                {t('admin.couponPct')}
              </label>
              <input id="lms-coupon-pct" type="number" min={5} max={50} className={inputCls} value={pct} onChange={(e) => setPct(Number(e.target.value))} />
            </div>
            <button type="submit" className={btn.primary}>
              {t('admin.couponCreate')}
            </button>
          </form>
          {error && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{error}</p>}
        </CardContent>
      </Card>
      <Card variant="bordered">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                <th className="py-2 pr-3 font-semibold">{t('admin.couponCode')}</th>
                <th className="py-2 pr-3 font-semibold">{t('admin.couponPct')}</th>
                <th className="py-2 pr-3 font-semibold">{t('admin.couponUses')}</th>
                <th className="py-2 pr-3 font-semibold">{t('admin.couponStatus')}</th>
                <th className="py-2 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {state.coupons.map((c) => (
                <tr key={c.code} className="border-t border-secondary-100 dark:border-secondary-800">
                  <td className="py-2 pr-3 font-mono font-semibold">{c.code}</td>
                  <td className="py-2 pr-3">{c.pct} %</td>
                  <td className="py-2 pr-3">{c.uses}</td>
                  <td className="py-2 pr-3">
                    <Badge variant={c.active ? 'success' : 'default'} size="sm">
                      {c.active ? t('admin.couponActive') : t('admin.couponInactive')}
                    </Badge>
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      className={btn.small}
                      onClick={() => {
                        dispatch({ type: 'coupon.toggle', code: c.code });
                        toast.success(c.active ? t('admin.couponDeactivated', { code: c.code }) : t('admin.couponActivated', { code: c.code }));
                      }}
                    >
                      {c.active ? t('admin.couponDeactivate') : t('admin.couponActivate')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <SimNote>{t('admin.couponsNote')}</SimNote>
    </div>
  );
}

function IssuedView() {
  const t = useTranslations('demoLms');
  const f = useFmt();
  const { state } = useLmsReady();
  const origin = useOrigin();
  const courses = allCourses(state);
  const perCourse = courses
    .map((c) => {
      const rows = state.cohort.filter((r) => r.courseId === c.id);
      const done = rows.filter((r) => r.progress >= 100).length + (state.certificates.some((x) => x.courseId === c.id) ? 1 : 0);
      const enrolled = rows.length + (state.enrollments[c.id] ? 1 : 0);
      return { c, done, enrolled };
    })
    .filter((x) => x.enrolled > 0);
  const total = perCourse.reduce((a, x) => a + x.done, 0);

  return (
    <div className="space-y-6">
      <SectionTitle title={t('admin.issuedTitle')} subtitle={t('admin.issuedSubtitle', { count: total })} />
      <Card variant="bordered">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                <th className="py-2 pr-3 font-semibold">{t('admin.colCourse')}</th>
                <th className="py-2 pr-3 font-semibold text-right">{t('admin.colEnrolled')}</th>
                <th className="py-2 pr-3 font-semibold text-right">{t('admin.colIssued')}</th>
                <th className="py-2 font-semibold text-right">{t('analytics.completionRate')}</th>
              </tr>
            </thead>
            <tbody>
              {perCourse.map((x) => (
                <tr key={x.c.id} className="border-t border-secondary-100 dark:border-secondary-800">
                  <td className="py-2 pr-3">{pick(x.c.title, f.locale)}</td>
                  <td className="py-2 pr-3 text-right">{f.int(x.enrolled)}</td>
                  <td className="py-2 pr-3 text-right">{f.int(x.done)}</td>
                  <td className="py-2 text-right">{f.pct(Math.round((x.done / x.enrolled) * 100))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Card variant="bordered">
        <CardContent className="p-0">
          <h3 className="text-base font-semibold text-secondary-900 dark:text-white mb-3">{t('admin.issuedMine')}</h3>
          {state.certificates.length === 0 ? (
            <Empty>{t('certificates.noCerts')}</Empty>
          ) : (
            <ul className="divide-y divide-secondary-100 dark:divide-secondary-800">
              {state.certificates.map((c) => {
                const course = courses.find((x) => x.id === c.courseId);
                const title = course ? pick(course.title, f.locale) : c.courseId;
                return (
                  <li key={c.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-secondary-900 dark:text-white">
                        <span className="font-mono">{c.id}</span> · {c.name}
                      </p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">
                        {title} · {f.date(c.date)}
                      </p>
                    </div>
                    {origin && (
                      <a className={btn.small} href={verifyUrl(origin, certPayload(c, title))} target="_blank" rel="noopener noreferrer">
                        <QrCodeIcon className="w-3.5 h-3.5" />
                        {t('certificates.verify')}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
      <SimNote>{t('admin.issuedNote')}</SimNote>
    </div>
  );
}

export default function AdminPanel({ section }: { section: 'sales' | 'coupons' | 'issued' }) {
  if (section === 'coupons') return <CouponsView />;
  if (section === 'issued') return <IssuedView />;
  return <SalesView />;
}
