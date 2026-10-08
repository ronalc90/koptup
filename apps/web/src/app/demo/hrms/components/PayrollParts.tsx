'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { TrashIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import { liquidate, noveltyFactor, weeklyHours, type Period } from '../lib/payroll';
import { useHr } from '../lib/store';
import { active } from '../lib/selectors';
import { NOVELTY_KINDS, type NoveltyKind } from '../lib/types';
import { Empty, SectionTitle, btn, inputCls, useFmt } from './ui';

/** Novedades editables de la quincena (horas extra, recargos y comisiones). */
export function Novelties({ locked, period }: { locked: boolean; period: Period }) {
  const t = useTranslations('demoHrms.payroll.novelties');
  const { state, dispatch } = useHr();
  const f = useFmt();
  const people = useMemo(() => [...active(state)].filter((e) => e.contract !== 'apprentice').sort((a, b) => a.name.localeCompare(b.name, 'es')), [state]);
  const [who, setWho] = useState('');
  const [kind, setKind] = useState<NoveltyKind>('hed');
  const [qty, setQty] = useState(4);
  const byId = new Map(state.employees.map((e) => [e.id, e]));
  const value = (employeeId: string, k: NoveltyKind, n: number) => {
    const e = byId.get(employeeId);
    if (!e) return 0;
    return k === 'commission' ? n : liquidate(e, [{ id: 'x', employeeId, kind: k, qty: n }], period).overtime;
  };
  const valid = who && qty > 0 && (kind === 'commission' ? qty <= 20000000 : qty <= 60);
  return (
    <Card variant="bordered">
      <SectionTitle title={t('title')} subtitle={locked ? t('locked') : t('subtitle', { divisor: weeklyHours(period.to) * 5 })} />
      {!locked && (
        <form
          className="grid grid-cols-1 sm:grid-cols-[1fr_12rem_8rem_auto] gap-2 mb-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            dispatch({ type: 'novelty.add', novelty: { employeeId: who, kind, qty } });
            toast.success(t('added', { name: byId.get(who)!.name, value: f.money(value(who, kind, qty)) }));
          }}
        >
          <select aria-label={t('employee')} className={inputCls} value={who} onChange={(e) => setWho(e.target.value)}>
            <option value="">{t('employee')}</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select aria-label={t('kind')} className={inputCls} value={kind} onChange={(e) => { const k = e.target.value as NoveltyKind; setKind(k); setQty(k === 'commission' ? 300000 : 4); }}>
            {NOVELTY_KINDS.map((k) => <option key={k} value={k}>{t(`kinds.${k}`, { pct: Math.round((noveltyFactor(k, period.to) - (k === 'rn' || k === 'rdf' ? 0 : 1)) * 100) })}</option>)}
          </select>
          <input aria-label={kind === 'commission' ? t('amount') : t('hours')} type="number" min={1} className={inputCls} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          <button type="submit" className={btn.primary} disabled={!valid}>{t('add')}</button>
        </form>
      )}
      {state.run.novelties.length === 0 ? <Empty>{t('empty')}</Empty> : (
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-left text-xs text-secondary-500 border-b border-secondary-200 dark:border-secondary-700">
                <th className="py-2 pr-2 font-semibold">{t('employee')}</th>
                <th className="py-2 px-2 font-semibold">{t('kind')}</th>
                <th className="py-2 px-2 text-right font-semibold">{t('qty')}</th>
                <th className="py-2 px-2 text-right font-semibold">{t('value')}</th>
                <th className="py-2 pl-2"><span className="sr-only">{t('remove')}</span></th>
              </tr>
            </thead>
            <tbody>
              {state.run.novelties.map((n) => (
                <tr key={n.id} className="border-b border-secondary-100 dark:border-secondary-800">
                  <td className="py-1.5 pr-2">{byId.get(n.employeeId)?.name}</td>
                  <td className="py-1.5 px-2 text-xs">{t(`kinds.${n.kind}`, { pct: Math.round((noveltyFactor(n.kind, period.to) - (n.kind === 'rn' || n.kind === 'rdf' ? 0 : 1)) * 100) })}</td>
                  <td className="py-1.5 px-2 text-right">{n.kind === 'commission' ? f.money(n.qty) : t('hoursValue', { n: n.qty })}</td>
                  <td className="py-1.5 px-2 text-right whitespace-nowrap">{f.money(value(n.employeeId, n.kind, n.qty))}</td>
                  <td className="py-1.5 pl-2 text-right">
                    {!locked && (
                      <button type="button" aria-label={t('remove')} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950 text-red-600" onClick={() => { dispatch({ type: 'novelty.remove', id: n.id }); toast(t('removed')); }}>
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/** Beneficios extralegales de ejemplo y su costo mensual. */
export function Benefits() {
  const t = useTranslations('demoHrms.payroll.benefits');
  const { state } = useHr();
  const f = useFmt();
  const n = active(state).length;
  const items: { key: string; value: number; people: number }[] = [
    { key: 'food', value: 180000, people: active(state).filter((e) => e.area === 'production' || e.area === 'logistics').length },
    { key: 'life', value: 22000, people: n },
    { key: 'health', value: 95000, people: active(state).filter((e) => e.salary >= 3500000).length },
    { key: 'birthday', value: 0, people: n },
    { key: 'family', value: 0, people: n },
  ];
  return (
    <Card variant="bordered">
      <SectionTitle title={t('title')} subtitle={t('subtitle')} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((b) => (
          <div key={b.key} className="p-3 rounded-lg border border-secondary-200 dark:border-secondary-700">
            <p className="text-sm font-semibold text-secondary-900 dark:text-white">{t(`items.${b.key}`)}</p>
            <p className="text-xs text-secondary-500">{b.value ? t('perMonth', { value: f.money(b.value) }) : t('noCost')}</p>
            <p className="text-xs text-secondary-600 dark:text-secondary-300 mt-1">{t('people', { n: b.people })}{b.value ? ` · ${t('monthly', { value: f.money(b.value * b.people) })}` : ''}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-secondary-500 mt-3">{t('note')}</p>
    </Card>
  );
}
