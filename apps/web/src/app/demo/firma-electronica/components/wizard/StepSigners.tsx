'use client';

import { useTranslations } from 'next-intl';
import { ArrowDownIcon, ArrowUpIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { MAX_SIGNERS } from '../../lib/data';
import { useFirma } from '../../lib/store';
import { CHANNELS, ROLES, type Signer } from '../../lib/types';
import { SignerDot, SimNote, focusRing, inputCls, labelCls, selectCls, smallBtn } from '../ui';

export default function StepSigners() {
  const t = useTranslations('demoSign');
  const { s, patchDraft } = useFirma();
  const d = s.draft;

  const setSigners = (signers: Signer[]) => patchDraft({ signers });
  const update = (id: string, p: Partial<Signer>) => setSigners(d.signers.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= d.signers.length) return;
    const list = [...d.signers];
    [list[i], list[j]] = [list[j], list[i]];
    setSigners(list);
  };
  const add = () => {
    const used = new Set(d.signers.map((x) => x.id));
    let n = d.signers.length + 1;
    while (used.has(`s${n}`)) n += 1;
    setSigners([...d.signers, { id: `s${n}`, name: '', email: '', phone: '', channel: 'email', role: 'signer', state: 'pending' }]);
  };
  const remove = (id: string) =>
    patchDraft({ signers: d.signers.filter((x) => x.id !== id), fields: d.fields.filter((f) => f.signerId !== id) });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">{t('wizard.signers.title')}</h3>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('wizard.signers.subtitle')}</p>
      </div>

      <div role="radiogroup" aria-label={t('wizard.signers.modeLabel')} className="grid gap-2 sm:grid-cols-2">
        {(['sequential', 'parallel'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={d.mode === m}
            onClick={() => patchDraft({ mode: m })}
            className={`rounded-lg border p-3 text-left ${focusRing} ${
              d.mode === m ? 'border-lime-600 bg-lime-50 dark:bg-lime-950/40' : 'border-secondary-200 hover:border-lime-400 dark:border-secondary-700'
            }`}
          >
            <span className="block text-sm font-medium">{t(`wizard.signers.modes.${m}.name`)}</span>
            <span className="block text-xs text-secondary-600 dark:text-secondary-400">{t(`wizard.signers.modes.${m}.help`)}</span>
          </button>
        ))}
      </div>

      <ol className="space-y-3">
        {d.signers.map((x, i) => (
          <li key={x.id} className="rounded-lg border border-secondary-200 p-3 dark:border-secondary-700">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <SignerDot index={i} />
                {d.mode === 'sequential' ? t('wizard.signers.orderN', { n: i + 1 }) : t('wizard.signers.personN', { n: i + 1 })}
              </p>
              <div className="flex items-center gap-1">
                <button type="button" className={`${smallBtn} text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800`} disabled={i === 0} onClick={() => move(i, -1)} aria-label={t('wizard.signers.up', { n: i + 1 })}>
                  <ArrowUpIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={`${smallBtn} text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800`}
                  disabled={i === d.signers.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label={t('wizard.signers.down', { n: i + 1 })}
                >
                  <ArrowDownIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={`${smallBtn} text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950`}
                  disabled={d.signers.length <= 1}
                  onClick={() => remove(x.id)}
                  aria-label={t('wizard.signers.remove', { n: i + 1 })}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]">
              <div className="min-w-0">
                <label htmlFor={`${x.id}-name`} className={labelCls}>
                  {t('wizard.signers.name')}
                </label>
                <input id={`${x.id}-name`} className={inputCls} value={x.name} autoComplete="off" onChange={(e) => update(x.id, { name: e.target.value })} />
              </div>
              <div className="min-w-0">
                <label htmlFor={`${x.id}-email`} className={labelCls}>
                  {t('wizard.signers.email')}
                </label>
                <input id={`${x.id}-email`} type="email" className={inputCls} value={x.email} autoComplete="off" onChange={(e) => update(x.id, { email: e.target.value })} />
              </div>
              <div className="min-w-0">
                <label htmlFor={`${x.id}-phone`} className={labelCls}>
                  {t('wizard.signers.phone')}
                </label>
                <input
                  id={`${x.id}-phone`}
                  type="tel"
                  inputMode="tel"
                  className={inputCls}
                  value={x.phone}
                  placeholder="300 555 0123"
                  autoComplete="off"
                  onChange={(e) => update(x.id, { phone: e.target.value })}
                />
              </div>
              <div className="min-w-0">
                <label htmlFor={`${x.id}-channel`} className={labelCls}>
                  {t('wizard.signers.channel')}
                </label>
                <select id={`${x.id}-channel`} className={selectCls} value={x.channel} onChange={(e) => update(x.id, { channel: e.target.value as Signer['channel'] })}>
                  {CHANNELS.map((c) => (
                    <option key={c} value={c}>
                      {t(`channels.${c}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0">
                <label htmlFor={`${x.id}-role`} className={labelCls}>
                  {t('wizard.signers.role')}
                </label>
                <select id={`${x.id}-role`} className={selectCls} value={x.role} onChange={(e) => update(x.id, { role: e.target.value as Signer['role'] })}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {t(`roles.${r}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-2 text-xs text-secondary-500 dark:text-secondary-400">{t(`wizard.signers.roleHelp.${x.role}`)}</p>
          </li>
        ))}
      </ol>
      <Button variant="outline" size="sm" onClick={add} disabled={d.signers.length >= MAX_SIGNERS}>
        <UserPlusIcon className="mr-1 h-4 w-4" /> {t('wizard.signers.add')}
      </Button>
      {d.signers.length >= MAX_SIGNERS && <p className="text-xs text-secondary-500">{t('wizard.signers.max', { n: MAX_SIGNERS })}</p>}
      <SimNote>{t('wizard.signers.simNote')}</SimNote>
    </div>
  );
}
