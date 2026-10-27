'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, ChevronDownIcon, ChevronRightIcon, MagnifyingGlassIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { AREAS, CONTRACTS, SITES, SITE_CITY } from '../lib/catalog';
import { csv, download } from '../lib/payroll';
import { useHr } from '../lib/store';
import { onLeave } from '../lib/selectors';
import type { Employee } from '../lib/types';
import { Empty, Initials, Pager, SectionTitle, TabIntro, btn, inputCls, usePager, useFmt, usePos } from './ui';

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function PeopleTab() {
  const t = useTranslations('demoHrms.people');
  const pos = usePos();
  const ta = useTranslations('demoHrms.areas');
  const ts = useTranslations('demoHrms.sites');
  const tc = useTranslations('demoHrms.contracts');
  const { state, openProfile, peopleFilter, setPeopleFilter } = useHr();
  const f = useFmt();
  const [q, setQ] = useState('');
  const [area, setArea] = useState('all');
  const [site, setSite] = useState('all');
  const [contract, setContract] = useState('all');
  const [showRetired, setShowRetired] = useState(false);
  const managerId = peopleFilter?.managerId;
  const manager = managerId ? state.employees.find((e) => e.id === managerId) : undefined;
  const away = useMemo(() => new Set(onLeave(state, state.baseDate).map((l) => l.employeeId)), [state]);

  const list = useMemo(() => {
    const needle = norm(q.trim());
    return state.employees
      .filter((e) => (showRetired ? true : e.status !== 'retired'))
      .filter((e) => area === 'all' || e.area === area)
      .filter((e) => site === 'all' || e.site === site)
      .filter((e) => contract === 'all' || e.contract === contract)
      .filter((e) => !managerId || e.managerId === managerId)
      .filter((e) => !needle || norm(`${e.name} ${e.docId} ${pos(e)}`).includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [state.employees, q, area, site, contract, managerId, showRetired, pos]);

  const pager = usePager(list, 12);
  const { setPage } = pager;
  useEffect(() => setPage(1), [q, area, site, contract, managerId, showRetired, setPage]);

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      [t('csv.name'), t('csv.doc'), t('csv.position'), t('csv.area'), t('csv.site'), t('csv.contract'), t('csv.joined'), t('csv.end'), t('csv.salary'), t('csv.status')],
      ...list.map((e) => [e.name, e.docId, pos(e), ta(e.area), ts(e.site), tc(e.contract), e.joined, e.contractEnd ?? '', e.salary, t(`status.${e.status}`)]),
    ];
    download(`colaboradores-${state.baseDate}.csv`, csv(rows));
    toast.success(t('exported', { n: list.length }));
  };

  const selectCls = `${inputCls} md:w-44`;

  return (
    <div className="space-y-6">
      <TabIntro title={t('title')} subtitle={t('subtitle', { n: state.employees.filter((e) => e.status !== 'retired').length })} />

      <Card variant="bordered" padding="md">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')} aria-label={t('search')} className={`${inputCls} pl-9`} />
          </div>
          <select aria-label={t('filters.area')} className={selectCls} value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="all">{t('filters.allAreas')}</option>
            {AREAS.map((a) => <option key={a} value={a}>{ta(a)}</option>)}
          </select>
          <select aria-label={t('filters.site')} className={selectCls} value={site} onChange={(e) => setSite(e.target.value)}>
            <option value="all">{t('filters.allSites')}</option>
            {SITES.map((s) => <option key={s} value={s}>{ts(s)}</option>)}
          </select>
          <select aria-label={t('filters.contract')} className={selectCls} value={contract} onChange={(e) => setContract(e.target.value)}>
            <option value="all">{t('filters.allContracts')}</option>
            {CONTRACTS.map((c) => <option key={c} value={c}>{tc(c)}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-secondary-600 dark:text-secondary-300">{t('results', { n: list.length })}</span>
            <label className="inline-flex items-center gap-2 text-xs text-secondary-600 dark:text-secondary-300">
              <input type="checkbox" checked={showRetired} onChange={(e) => setShowRetired(e.target.checked)} className="rounded border-secondary-300" />
              {t('showRetired')}
            </label>
            {manager && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-200 text-xs font-semibold">
                {t('teamOf', { name: manager.name })}
                <button type="button" onClick={() => setPeopleFilter(null)} aria-label={t('clearTeam')} className="p-0.5 rounded hover:bg-violet-200 dark:hover:bg-violet-900">
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>
          <button type="button" className={btn.outline} onClick={exportCsv} disabled={list.length === 0}>
            <ArrowDownTrayIcon className="w-4 h-4" />
            {t('export')}
          </button>
        </div>
      </Card>

      {list.length === 0 ? (
        <Card variant="bordered"><Empty>{t('empty')}</Empty></Card>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pager.visible.map((e) => (
              <Card key={e.id} variant="bordered" padding="md" className="flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <Initials name={e.name} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-secondary-900 dark:text-white truncate">{e.name}</p>
                    <p className="text-xs text-secondary-500 truncate">{pos(e)}</p>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      <Badge variant="outline" size="sm">{ta(e.area)}</Badge>
                      <Badge variant="outline" size="sm">{SITE_CITY[e.site]}</Badge>
                      {e.status !== 'active' && <Badge variant={e.status === 'leaving' ? 'warning' : 'default'} size="sm">{t(`status.${e.status}`)}</Badge>}
                      {e.status === 'active' && away.has(e.id) && <Badge variant="info" size="sm">{t('away')}</Badge>}
                    </div>
                  </div>
                </div>
                <dl className="text-xs text-secondary-600 dark:text-secondary-400 space-y-1 mb-3 flex-1">
                  <div><dt className="inline font-semibold">{t('contract')}:</dt> <dd className="inline">{tc(e.contract)}{e.contractEnd ? ` · ${t('until', { date: f.date(e.contractEnd) })}` : ''}</dd></div>
                  <div><dt className="inline font-semibold">{t('joined')}:</dt> <dd className="inline">{f.date(e.joined)}</dd></div>
                  <div><dt className="inline font-semibold">{t('manager')}:</dt> <dd className="inline">{state.employees.find((m) => m.id === e.managerId)?.name ?? t('board')}</dd></div>
                </dl>
                <button type="button" className={`${btn.outline} w-full`} onClick={() => openProfile(e.id)}>
                  {t('viewProfile')}
                </button>
              </Card>
            ))}
          </div>
          <Pager pager={pager} />
        </div>
      )}

      <OrgChart />
    </div>
  );
}

function OrgChart() {
  const t = useTranslations('demoHrms.people.org');
  const pos = usePos();
  const { state, openProfile, setPeopleFilter } = useHr();
  const [open, setOpen] = useState<Record<string, boolean>>({ E001: true });
  const activeList = state.employees.filter((e) => e.status !== 'retired');
  const reports = useMemo(() => {
    const m = new Map<string, Employee[]>();
    activeList.forEach((e) => {
      if (!e.managerId) return;
      m.set(e.managerId, [...(m.get(e.managerId) ?? []), e]);
    });
    return m;
  }, [activeList]);
  const root = activeList.find((e) => !e.managerId);
  if (!root) return null;

  const node = (e: Employee, depth: number) => {
    const direct = reports.get(e.id) ?? [];
    const managers = direct.filter((d) => (reports.get(d.id) ?? []).length > 0);
    const others = direct.length - managers.length;
    const expanded = open[e.id] ?? false;
    return (
      <li key={e.id} className={depth > 0 ? 'ml-3 sm:ml-6' : ''}>
        <div className="flex items-center gap-2 p-2.5 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900">
          {managers.length > 0 ? (
            <button type="button" onClick={() => setOpen((s) => ({ ...s, [e.id]: !expanded }))} aria-expanded={expanded} aria-label={expanded ? t('collapse') : t('expand')} className="p-0.5 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800">
              {expanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
            </button>
          ) : (
            <span className="w-5" />
          )}
          <Initials name={e.name} size="sm" />
          <button type="button" onClick={() => openProfile(e.id)} className="flex-1 min-w-0 text-left">
            <span className="block text-sm font-semibold text-secondary-900 dark:text-white truncate">{e.name}</span>
            <span className="block text-xs text-secondary-500 truncate">{pos(e)}</span>
          </button>
          {direct.length > 0 && (
            <button
              type="button"
              className={`${btn.small} shrink-0`}
              onClick={() => {
                setPeopleFilter({ managerId: e.id });
                document.getElementById('hrms-tabs')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {t('team', { n: direct.length })}
            </button>
          )}
        </div>
        {expanded && managers.length > 0 && (
          <ul className="mt-2 space-y-2 border-l-2 border-dashed border-secondary-300 dark:border-secondary-700 pl-1 sm:pl-2">
            {managers.map((m) => node(m, depth + 1))}
            {others > 0 && <li className="ml-3 sm:ml-6 text-xs text-secondary-500">{t('others', { n: others })}</li>}
          </ul>
        )}
      </li>
    );
  };

  return (
    <Card variant="bordered">
      <SectionTitle title={<span className="inline-flex items-center gap-2"><UserGroupIcon className="w-5 h-5 text-violet-600" />{t('title')}</span>} subtitle={t('subtitle')} />
      <ul className="space-y-2">{node(root, 0)}</ul>
    </Card>
  );
}
