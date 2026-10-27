'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { LockClosedIcon, MegaphoneIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { useDemo } from '../lib/store';
import { BASE_DOMAIN, DEMO_TODAY, PLANS, VENDOR, ZONES, moduleAllowed } from '../lib/data';
import { readableOn } from '../lib/format';
import type { ResourceLookup } from '../lib/logic';
import { useFmt } from '../lib/useFmt';
import type { ModuleId, Notice, Tenant } from '../lib/types';
import { PLAN_IDS } from '../lib/types';
import { FieldError, Panel, ScreenHeader, SimNote, TenantAvatar, TenantSelect, inputCls, selectCls } from './ui';

/** Texto de un comunicado: los de la semilla se traducen, los tuyos se muestran tal cual. */
export function useNoticeText() {
  const t = useTranslations('demoSaas');
  return (n: Notice) =>
    n.seedKey ? { title: t(`portal.seed.${n.seedKey}.title`), body: t(`portal.seed.${n.seedKey}.body`) } : { title: n.title, body: n.body };
}

export default function Portal() {
  const t = useTranslations('demoSaas');
  const { s, select, go } = useDemo();
  const supportId = s.impersonation?.tenantId ?? null;
  const tenant =
    s.tenants.find((x) => x.id === (supportId ?? s.selected.portal) && x.status !== 'cancelado') ?? s.tenants.find((x) => x.status !== 'cancelado');
  if (!tenant) return null;
  const fg = readableOn(tenant.color);

  return (
    <div className="space-y-5">
      <ScreenHeader title={t('screens.portal.title')} subtitle={t('screens.portal.subtitle')} />
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-secondary-200 bg-white p-3 dark:border-secondary-700 dark:bg-secondary-900">
        {supportId ? (
          <p className="text-xs text-secondary-600 dark:text-secondary-300">{t('portal.lockedSupport')}</p>
        ) : (
          <TenantSelect id="portal-tenant" label={t('portal.viewAs')} value={tenant.id} onChange={(id) => select('portal', id)} />
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-sm dark:border-secondary-700 dark:bg-secondary-900" data-testid="tenant-portal">
        <div className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5" style={{ backgroundColor: tenant.color, color: fg }}>
          <TenantAvatar tenant={{ ...tenant, color: fg === '#ffffff' ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.18)' }} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="break-words text-lg font-semibold sm:truncate">{tenant.name}</div>
            <div className="flex min-w-0 items-center gap-1 text-xs opacity-90">
              <LockClosedIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="break-all sm:truncate">{tenant.slug}.{BASE_DOMAIN}</span>
            </div>
          </div>
          <span className="w-full text-[11px] opacity-80 sm:w-auto">{t('portal.poweredBy', { product: VENDOR.product })}</span>
        </div>

        {tenant.status === 'suspendido' ? (
          <div className="p-5 text-sm">
            <h3 className="font-semibold text-secondary-900 dark:text-white">{t('portal.suspendedTitle')}</h3>
            <p className="mt-1 text-secondary-600 dark:text-secondary-300">{t('portal.suspendedText', { tenant: tenant.name })}</p>
            <Button
              size="sm"
              className="mt-3"
              onClick={() => {
                select('billing', tenant.id);
                go('billing');
              }}
            >
              {t('portal.goCharge')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">
            <Notices key={`n-${tenant.id}`} tenant={tenant} />
            <Fees tenant={tenant} />
            <Reservations key={`r-${tenant.id}`} tenant={tenant} />
            <Votes tenant={tenant} />
          </div>
        )}
      </div>

      <Isolation key={tenant.id} tenant={tenant} />
    </div>
  );
}

function ModuleOff({ tenant, module }: { tenant: Tenant; module: ModuleId }) {
  const t = useTranslations('demoSaas');
  const minPlan = PLAN_IDS.find((p) => PLANS[p].modules.includes(module));
  return (
    <p className="rounded-lg bg-secondary-50 p-3 text-xs text-secondary-600 dark:bg-secondary-800/60 dark:text-secondary-300">
      {moduleAllowed(tenant.plan, module)
        ? t('portal.moduleOff')
        : t('portal.notInPlan', { plan: t(`plans.${tenant.plan}.name`), min: minPlan ? t(`plans.${minPlan}.name`) : '' })}
    </p>
  );
}

function Notices({ tenant }: { tenant: Tenant }) {
  const t = useTranslations('demoSaas');
  const f = useFmt();
  const { s, publishNotice, toast } = useDemo();
  const text = useNoticeText();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const list = s.notices.filter((n) => n.tenantId === tenant.id).slice().sort((a, b) => b.at.localeCompare(a.at));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) return setError(t('portal.notices.titleError'));
    if (body.trim().length < 5) return setError(t('portal.notices.bodyError'));
    publishNotice(tenant.id, title, body, 'portal');
    toast('toast.noticePublished');
    setTitle('');
    setBody('');
    setError(null);
  };

  return (
    <Panel title={t('portal.notices.title')} className="xl:row-span-2">
      <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
        {list.length === 0 && <li className="text-sm text-secondary-500">{t('portal.notices.empty')}</li>}
        {list.map((n) => {
          const x = text(n);
          return (
            <li key={n.id} className="rounded-lg border border-secondary-200 p-3 dark:border-secondary-700">
              <div className="flex items-start gap-2">
                <MegaphoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-secondary-400" />
                <div className="min-w-0">
                  <div className="break-words text-sm font-medium text-secondary-900 dark:text-white">{x.title}</div>
                  <div className="text-[11px] text-secondary-500">{f.dateTime(n.at)} · <span className="font-mono">{n.id}</span></div>
                  {x.body && <p className="mt-1 whitespace-pre-line break-words text-xs text-secondary-700 dark:text-secondary-300">{x.body}</p>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <form onSubmit={submit} noValidate className="mt-4 space-y-2 border-t border-secondary-200 pt-3 dark:border-secondary-700">
        <label htmlFor="notice-title" className="block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('portal.notices.newTitle')}</label>
        <input id="notice-title" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} className={inputCls} />
        <label htmlFor="notice-body" className="block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('portal.notices.newBody')}</label>
        <textarea id="notice-body" rows={2} value={body} onChange={(e) => setBody(e.target.value.slice(0, 400))} className={inputCls} />
        <FieldError msg={error} />
        <Button type="submit" size="sm">{t('portal.notices.publish')}</Button>
      </form>
    </Panel>
  );
}

function Fees({ tenant }: { tenant: Tenant }) {
  const t = useTranslations('demoSaas');
  const f = useFmt();
  const { s, payFee } = useDemo();
  const units = s.units.filter((u) => u.tenantId === tenant.id);
  const paid = units.filter((u) => u.paid).length;
  return (
    <Panel title={t('modules.pagos.name')} subtitle={t('portal.fees.subtitle', { fee: f.money(tenant.fee) })}>
      {!tenant.modules.includes('pagos') ? (
        <ModuleOff tenant={tenant} module="pagos" />
      ) : (
        <>
          <p className="mb-2 text-xs font-medium text-secondary-700 dark:text-secondary-200">{t('portal.fees.summary', { paid, total: units.length })}</p>
          <ul className="divide-y divide-secondary-100 text-sm dark:divide-secondary-800">
            {units.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <div className="font-medium text-secondary-900 dark:text-white">{u.label}</div>
                  <div className="truncate text-[11px] text-secondary-500">{u.owner} · <span className="font-mono">{u.id}</span></div>
                </div>
                {u.paid ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">{t('portal.fees.paid')}</span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => payFee(u.id)}>{t('portal.fees.register')}</Button>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-secondary-500">{t('portal.fees.note')}</p>
        </>
      )}
    </Panel>
  );
}

function Reservations({ tenant }: { tenant: Tenant }) {
  const t = useTranslations('demoSaas');
  const f = useFmt();
  const { s, reserve } = useDemo();
  const units = s.units.filter((u) => u.tenantId === tenant.id);
  const [zone, setZone] = useState<string>(ZONES[0]);
  const [date, setDate] = useState('');
  const [unit, setUnit] = useState(units[0]?.label ?? '');
  const [error, setError] = useState<string | null>(null);
  const list = s.reservations.filter((r) => r.tenantId === tenant.id && r.date >= DEMO_TODAY).sort((a, b) => a.date.localeCompare(b.date));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = reserve(tenant.id, zone, date, unit);
    setError(err ? t(err) : null);
    if (!err) setDate('');
  };

  return (
    <Panel title={t('modules.reservas.name')}>
      {!tenant.modules.includes('reservas') ? (
        <ModuleOff tenant={tenant} module="reservas" />
      ) : (
        <>
          <form onSubmit={submit} noValidate className="grid gap-2 sm:grid-cols-3">
            <div>
              <label htmlFor="res-zone" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('portal.reservations.zone')}</label>
              <select id="res-zone" value={zone} onChange={(e) => setZone(e.target.value)} className={`${selectCls} w-full`}>
                {ZONES.map((z) => <option key={z} value={z}>{t(`portal.zones.${z}`)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="res-date" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('portal.reservations.date')}</label>
              <input id="res-date" type="date" min={DEMO_TODAY} value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="res-unit" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('portal.reservations.unit')}</label>
              <select id="res-unit" value={unit} onChange={(e) => setUnit(e.target.value)} className={`${selectCls} w-full`}>
                {units.map((u) => <option key={u.id} value={u.label}>{u.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-3">
              <FieldError msg={error} />
              <Button type="submit" size="sm" className="mt-1">{t('portal.reservations.reserve')}</Button>
            </div>
          </form>
          <div className="mt-3 text-xs font-medium text-secondary-700 dark:text-secondary-200">{t('portal.reservations.upcoming')}</div>
          {list.length === 0 ? (
            <p className="mt-1 text-xs text-secondary-500">{t('portal.reservations.empty')}</p>
          ) : (
            <ul className="mt-1 space-y-1 text-xs text-secondary-700 dark:text-secondary-300">
              {list.map((r) => (
                <li key={r.id}>
                  {f.date(r.date)} · {t(`portal.zones.${r.zone}`)} · {r.unit}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Panel>
  );
}

function Votes({ tenant }: { tenant: Tenant }) {
  const t = useTranslations('demoSaas');
  const f = useFmt();
  const { s, vote } = useDemo();
  const v = s.votes[tenant.id] ?? { si: 0, no: 0, abst: 0, voted: false };
  const total = v.si + v.no + v.abst;
  const opts = ['si', 'no', 'abst'] as const;
  return (
    <Panel title={t('modules.votaciones.name')}>
      {!tenant.modules.includes('votaciones') ? (
        <ModuleOff tenant={tenant} module="votaciones" />
      ) : (
        <>
          <p className="text-sm font-medium text-secondary-900 dark:text-white">{t('portal.votes.question')}</p>
          <div className="mt-3 space-y-2">
            {opts.map((o) => {
              const pct = total ? Math.round((v[o] / total) * 100) : 0;
              return (
                <div key={o}>
                  <div className="flex justify-between text-xs text-secondary-600 dark:text-secondary-300">
                    <span>{t(`portal.votes.options.${o}`)}</span>
                    <span>{f.num(v[o])} · {pct} %</span>
                  </div>
                  <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-secondary-200 dark:bg-secondary-800">
                    <div className="h-full bg-primary-600" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          {v.voted ? (
            <p className="mt-3 text-xs text-emerald-700 dark:text-emerald-300">{t('portal.votes.voted')}</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {opts.map((o) => (
                <Button key={o} size="sm" variant={o === 'si' ? 'primary' : 'outline'} onClick={() => vote(tenant.id, o)}>
                  {t(`portal.votes.options.${o}`)}
                </Button>
              ))}
            </div>
          )}
          <p className="mt-2 text-[11px] text-secondary-500">{t('portal.votes.note', { n: f.num(total) })}</p>
        </>
      )}
    </Panel>
  );
}

function Isolation({ tenant }: { tenant: Tenant }) {
  const t = useTranslations('demoSaas');
  const { s, checkResource } = useDemo();
  const text = useNoticeText();
  const [id, setId] = useState('');
  const [result, setResult] = useState<{ id: string; res: ResourceLookup } | null>(null);
  const own = s.units.find((u) => u.tenantId === tenant.id);
  const otherTenant = s.tenants.find((x) => x.id !== tenant.id && s.units.some((u) => u.tenantId === x.id));
  const foreign = otherTenant ? s.units.find((u) => u.tenantId === otherTenant.id) : undefined;

  const open = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    setId(clean);
    setResult({ id: clean, res: checkResource(tenant.id, clean) });
  };

  const label = (r: ResourceLookup & { ok: true }, rid: string) => {
    if (r.kind === 'unit') return s.units.find((u) => u.id === rid)?.label ?? rid;
    if (r.kind === 'notice') {
      const n = s.notices.find((x) => x.id === rid);
      return n ? text(n).title : rid;
    }
    return s.invoices.find((i) => i.id === rid || i.number === rid)?.number ?? rid;
  };

  return (
    <Panel title={t('portal.isolation.title')} subtitle={t('portal.isolation.subtitle', { tenant: tenant.name })}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          open(id);
        }}
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="iso-id" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-300">{t('portal.isolation.input')}</label>
          <input id="iso-id" value={id} onChange={(e) => setId(e.target.value.slice(0, 60))} placeholder="u-arrayanes-t1101" className={`${inputCls} font-mono`} />
        </div>
        <Button type="submit" size="sm" disabled={!id.trim()}>{t('portal.isolation.open')}</Button>
      </form>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
        {own && (
          <button type="button" onClick={() => open(own.id)} className="rounded-full bg-secondary-100 px-2 py-0.5 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-200">
            {t('portal.isolation.tryOwn', { id: own.id })}
          </button>
        )}
        {foreign && otherTenant && (
          <button type="button" onClick={() => open(foreign.id)} className="rounded-full bg-secondary-100 px-2 py-0.5 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-200">
            {t('portal.isolation.tryOther', { tenant: otherTenant.name })}
          </button>
        )}
      </div>
      {result && (
        <div
          role="status"
          className={`mt-3 flex items-start gap-2 rounded-lg border p-3 text-sm ${
            result.res.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100'
              : result.res.reason === 'forbidden'
                ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100'
                : 'border-secondary-200 bg-secondary-50 text-secondary-800 dark:border-secondary-700 dark:bg-secondary-800/60 dark:text-secondary-100'
          }`}
          data-testid="isolation-result"
        >
          <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <span className="min-w-0 break-words">
            {result.res.ok
              ? t('portal.isolation.ok', { kind: t(`portal.isolation.kinds.${result.res.kind}`), label: label(result.res, result.id) })
              : result.res.reason === 'forbidden'
                ? t('portal.isolation.forbidden')
                : t('portal.isolation.notFound')}
          </span>
        </div>
      )}
      <SimNote>{t('portal.isolation.note')}</SimNote>
    </Panel>
  );
}
