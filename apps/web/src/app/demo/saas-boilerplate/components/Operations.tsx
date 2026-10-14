'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon, LifebuoyIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { useDemo } from '../lib/store';
import { DEMO_PERIOD, PLANS } from '../lib/data';
import { downloadCsv } from '../lib/files';
import { useFmt } from '../lib/useFmt';
import type { AuditAction, AuditEntry } from '../lib/types';
import { MODULE_IDS, PAY_METHODS, PLAN_IDS, ROLES } from '../lib/types';
import { FieldError, Panel, ScreenHeader, SimNote, StatusBadge, TenantSelect, Toggle, inputCls, selectCls } from './ui';
import { ApiConsole, TechSection, Webhooks } from './Technical';

export default function Operations() {
  const t = useTranslations('demoSaas');
  return (
    <div className="space-y-5">
      <ScreenHeader title={t('screens.operations.title')} subtitle={t('screens.operations.subtitle')} />
      <div className="grid gap-5 xl:grid-cols-2">
        <Support />
        <Modules />
      </div>
      <Audit />
      <Webhooks />
      <ApiConsole />
      <TechSection />
    </div>
  );
}

function Support() {
  const t = useTranslations('demoSaas');
  const f = useFmt();
  const { s, select, startSupport, endSupport, go } = useDemo();
  const tenant = s.tenants.find((x) => x.id === s.selected.operations && x.status !== 'cancelado') ?? s.tenants.find((x) => x.status !== 'cancelado');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const active = s.impersonation ? s.tenants.find((x) => x.id === s.impersonation?.tenantId) : null;
  if (!tenant) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10) {
      setError(t('operations.support.reasonError'));
      return;
    }
    setError(null);
    startSupport(tenant.id, reason);
    setReason('');
  };

  return (
    <Panel title={t('operations.support.title')} subtitle={t('operations.support.subtitle')}>
      {active && s.impersonation ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="break-words">{t('operations.support.active', { tenant: active.name, time: f.dateTime(s.impersonation.startedAt) })}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => go('portal')}>{t('operations.support.goPortal')}</Button>
            <Button size="sm" variant="outline" onClick={endSupport}>{t('support.end')}</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-3">
          <TenantSelect id="ops-tenant" label={t('common.tenant')} value={tenant.id} onChange={(id) => select('operations', id)} />
          <div>
            <label htmlFor="ops-reason" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('operations.support.reason')}</label>
            <textarea
              id="ops-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 200))}
              placeholder={t('operations.support.reasonPlaceholder')}
              className={inputCls}
              aria-invalid={!!error}
            />
            <FieldError msg={error} />
          </div>
          <Button type="submit" size="sm">
            <LifebuoyIcon className="mr-1 h-4 w-4" />
            {t('operations.support.start')}
          </Button>
        </form>
      )}
      <SimNote>{t('operations.support.note')}</SimNote>
    </Panel>
  );
}

function Modules() {
  const t = useTranslations('demoSaas');
  const { s, select, toggleModule } = useDemo();
  const tenant = s.tenants.find((x) => x.id === s.selected.operations && x.status !== 'cancelado') ?? s.tenants.find((x) => x.status !== 'cancelado');
  if (!tenant) return null;
  return (
    <Panel title={t('operations.modules.title')} subtitle={t('operations.modules.subtitle')}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <TenantSelect id="ops-mod-tenant" label={t('common.tenant')} value={tenant.id} onChange={(id) => select('operations', id)} />
        <StatusBadge status={tenant.status} />
      </div>
      <ul className="space-y-3">
        {MODULE_IDS.map((m) => {
          const allowed = PLANS[tenant.plan].modules.includes(m);
          const minPlan = PLAN_IDS.find((p) => PLANS[p].modules.includes(m));
          return (
            <li key={m} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-secondary-900 dark:text-white">{t(`modules.${m}.name`)}</div>
                <div className="text-xs text-secondary-500 dark:text-secondary-400">
                  {allowed ? t(`modules.${m}.desc`) : t('operations.modules.requires', { plan: minPlan ? t(`plans.${minPlan}.name`) : '' })}
                </div>
              </div>
              <Toggle checked={tenant.modules.includes(m)} disabled={!allowed} onChange={() => toggleModule(tenant.id, m)} label={t(`modules.${m}.name`)} />
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-secondary-500 dark:text-secondary-400">{t('operations.modules.note')}</p>
    </Panel>
  );
}

const GROUPS: Record<string, AuditAction[]> = {
  tenants: ['tenant.created', 'tenant.plan_changed', 'tenant.suspended', 'tenant.reactivated', 'tenant.cancelled', 'module.toggled'],
  billing: ['invoice.paid', 'payment.failed', 'payment.rejected', 'dunning.reminder'],
  members: ['member.invited', 'member.invite_resent', 'member.invite_revoked', 'member.joined', 'member.role_changed'],
  auth: ['auth.login', 'auth.login_denied', 'auth.settings_changed'],
  support: ['support.impersonation_started', 'support.impersonation_ended'],
  portal: ['notice.published', 'portal.access_denied', 'api.request'],
};
const PAGE = 12;
const LOGIN_METHODS = ['password', 'google', 'microsoft'];
const SETTINGS = ['google', 'microsoft', 'mfa'];

/** Descripción legible de un registro de la bitácora. */
export function useAuditText() {
  const t = useTranslations('demoSaas');
  return (e: AuditEntry) => {
    const p = e.params ?? {};
    const args: Record<string, string> = {
      plan: '—', from: '—', to: '—', number: '—', method: '—', day: '—', email: '—', setting: '—', value: '—', module: '—', reason: '—', title: '—', via: '—', resource: '—', path: '—', status: '—',
    };
    for (const [k, v] of Object.entries(p)) {
      if (typeof v !== 'string') continue;
      if ((k === 'plan' || k === 'from' || k === 'to') && (PLAN_IDS as string[]).includes(v)) args[k] = t(`plans.${v}.name`);
      else if ((k === 'from' || k === 'to') && (ROLES as string[]).includes(v)) args[k] = t(`roles.${v}`);
      else if (k === 'method' && (PAY_METHODS as string[]).includes(v)) args[k] = t(`methods.${v}`);
      else if (k === 'method' && LOGIN_METHODS.includes(v)) args[k] = t(`access.methods.${v}`);
      else if (k === 'module' && (MODULE_IDS as string[]).includes(v)) args[k] = t(`modules.${v}.name`);
      else if (k === 'setting' && SETTINGS.includes(v)) args[k] = t(`access.settings.${v}`);
      else if (k === 'value' && (v === 'on' || v === 'off')) args[k] = t(`operations.audit.${v}`);
      else if (k === 'via' && (v === 'portal' || v === 'api')) args[k] = t(`operations.audit.via.${v}`);
      else args[k] = v;
    }
    return t(`audit.${e.action.replace('.', '_')}`, args);
  };
}

function Audit() {
  const t = useTranslations('demoSaas');
  const f = useFmt();
  const { s } = useDemo();
  const describe = useAuditText();
  const [tenantId, setTenantId] = useState('all');
  const [group, setGroup] = useState('all');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const tenantName = (id: string | null) => (id ? s.tenants.find((x) => x.id === id)?.name ?? id : t('operations.audit.platform'));

  const needle = q.trim().toLowerCase();
  const rows = s.audit
    .slice()
    .reverse()
    .filter((e) => (tenantId === 'all' ? true : tenantId === 'none' ? e.tenantId === null : e.tenantId === tenantId))
    .filter((e) => group === 'all' || GROUPS[group]?.includes(e.action))
    .map((e) => ({ e, text: describe(e) }))
    .filter(({ e, text }) => !needle || `${text} ${e.actor} ${e.action} ${e.ip}`.toLowerCase().includes(needle));

  const exportCsv = () => {
    downloadCsv(
      `bitacora-${DEMO_PERIOD}.csv`,
      [t('operations.audit.cols.when'), t('operations.audit.cols.actor'), t('operations.audit.cols.tenant'), t('operations.audit.cols.code'), t('operations.audit.cols.action'), 'IP'],
      rows.map(({ e, text }) => [e.at.replace('T', ' '), e.actor, tenantName(e.tenantId), e.action, text, e.ip]),
      f.loc === 'en' ? ',' : ';',
    );
  };

  return (
    <Panel
      title={t('operations.audit.title')}
      subtitle={t('operations.audit.subtitle')}
      actions={
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          <ArrowDownTrayIcon className="mr-1 h-4 w-4" />
          {t('common.exportCsv')}
        </Button>
      }
    >
      <div className="mb-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)]">
        <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-secondary-600 dark:text-secondary-300">
          {t('common.tenant')}
          <select value={tenantId} onChange={(e) => { setTenantId(e.target.value); setLimit(PAGE); }} className={`${selectCls} w-full min-w-0`}>
            <option value="all">{t('common.all')}</option>
            <option value="none">{t('operations.audit.platform')}</option>
            {s.tenants.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-secondary-600 dark:text-secondary-300">
          {t('operations.audit.filterGroup')}
          <select value={group} onChange={(e) => { setGroup(e.target.value); setLimit(PAGE); }} className={`${selectCls} w-full min-w-0`}>
            <option value="all">{t('common.all')}</option>
            {Object.keys(GROUPS).map((g) => <option key={g} value={g}>{t(`operations.audit.groups.${g}`)}</option>)}
          </select>
        </label>
        <label className="relative flex min-w-0 flex-col gap-1 text-xs font-medium text-secondary-600 dark:text-secondary-300">
          {t('operations.audit.search')}
          <span className="relative block">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-secondary-400" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} placeholder={t('operations.audit.searchPlaceholder')} className={`${inputCls} pl-8`} />
          </span>
        </label>
      </div>
      <p className="mb-2 text-xs text-secondary-500">{t('operations.audit.count', { shown: Math.min(limit, rows.length), total: rows.length })}</p>
      {rows.length === 0 ? (
        <p className="rounded-lg bg-secondary-50 p-4 text-center text-sm text-secondary-500 dark:bg-secondary-800/50">{t('operations.audit.empty')}</p>
      ) : (
        <ul className="divide-y divide-secondary-100 rounded-lg border border-secondary-200 text-sm dark:divide-secondary-800 dark:border-secondary-700" data-testid="audit-list">
          {rows.slice(0, limit).map(({ e, text }) => (
            <li key={e.id} className="grid gap-1 px-3 py-2 md:grid-cols-[150px_minmax(0,1fr)_minmax(0,0.8fr)_110px] md:items-center md:gap-3">
              <span className="text-[11px] text-secondary-500">{f.dateTime(e.at)}</span>
              <span className="min-w-0">
                <span className="block break-words text-secondary-900 dark:text-white">{text}</span>
                <span className="block truncate font-mono text-[10px] text-secondary-400">{e.action}</span>
              </span>
              <span className="min-w-0 text-xs text-secondary-600 dark:text-secondary-300">
                <span className="block truncate">{e.actor}</span>
                <span className="block truncate text-secondary-400">{tenantName(e.tenantId)}</span>
              </span>
              <span className="font-mono text-[11px] text-secondary-500 md:text-right">{e.ip}</span>
            </li>
          ))}
        </ul>
      )}
      {rows.length > limit && (
        <div className="mt-3 text-center">
          <Button size="sm" variant="ghost" onClick={() => setLimit((x) => x + PAGE)}>{t('operations.audit.more')}</Button>
        </div>
      )}
      <SimNote>{t('operations.audit.note')}</SimNote>
    </Panel>
  );
}
