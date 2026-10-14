'use client';

import { useTranslations } from 'next-intl';
import { BanknotesIcon, BellAlertIcon, CalendarDaysIcon, ClockIcon, MapPinIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { depositOf, isOffered, staffForService } from '../lib/engine';
import { useReservas } from '../lib/store';
import { ServiceIcon, useFmt } from './ui';

/** Página pública de reservas del negocio (lo que ve su cliente). */
export default function PublicPage({ locationId, onLocation, onBook }: { locationId: string; onLocation: (id: string) => void; onBook: (serviceId: string) => void }) {
  const t = useTranslations('demoReservas.public');
  const { biz } = useReservas();
  const f = useFmt();
  const loc = biz.locations.find((l) => l.id === locationId) ?? biz.locations[0];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 sm:px-8 py-6 sm:py-8">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-xl bg-white/20 flex items-center justify-center text-lg sm:text-xl font-bold" aria-hidden="true">
            {biz.name
              .split(' ')
              .filter((w) => w.length > 2)
              .slice(0, 2)
              .map((w) => w[0])
              .join('')}
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-orange-100">{t('eyebrow')}</p>
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight">{biz.name}</h2>
            <p className="text-sm sm:text-base text-orange-50/95 mt-1">
              {f.l(biz.tagline)} · {biz.city}
            </p>
          </div>
        </div>
        <ul className="mt-5 grid gap-2 sm:grid-cols-3 text-sm text-orange-50">
          <li className="flex items-start gap-2">
            <CalendarDaysIcon className="h-5 w-5 shrink-0" />
            <span>{t('perk1')}</span>
          </li>
          <li className="flex items-start gap-2">
            <BanknotesIcon className="h-5 w-5 shrink-0" />
            <span>{t('perk2')}</span>
          </li>
          <li className="flex items-start gap-2">
            <BellAlertIcon className="h-5 w-5 shrink-0" />
            <span>{t('perk3')}</span>
          </li>
        </ul>
      </div>

      <div className="px-4 sm:px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('chooseLocation')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
              <MapPinIcon className="h-4 w-4 shrink-0" />
              <span>
                {loc.address}, {loc.city}
              </span>
            </p>
          </div>
          <div role="group" aria-label={t('chooseLocation')} className="flex flex-wrap gap-2">
            {biz.locations.map((l) => (
              <button
                key={l.id}
                type="button"
                aria-pressed={l.id === loc.id}
                onClick={() => onLocation(l.id)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  l.id === loc.id
                    ? 'border-orange-600 bg-orange-600 text-white'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-orange-400'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">{t('services')}</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {biz.services.map((s) => {
            const offered = isOffered(biz, s.id, loc.id);
            const other = biz.locations.filter((l) => l.id !== loc.id && isOffered(biz, s.id, l.id));
            const people = staffForService(biz, s.id, loc.id);
            return (
              <article key={s.id} className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 shrink-0 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 flex items-center justify-center">
                    <ServiceIcon icon={s.icon} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-900 dark:text-white leading-snug">{f.l(s.name)}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      <ClockIcon className="h-3.5 w-3.5" />
                      {f.duration(s.duration)}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 flex-1">{f.l(s.description)}</p>
                <div className="mt-3">
                  <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{f.money(s.price)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {s.deposit > 0 ? t('deposit', { pct: s.deposit, amount: f.money(depositOf(s)) }) : t('noDeposit')}
                  </p>
                  {offered && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate" title={people.map((p) => p.name).join(', ')}>
                      {people.map((p) => p.name).join(' · ')}
                    </p>
                  )}
                </div>
                {offered ? (
                  <button
                    type="button"
                    onClick={() => onBook(s.id)}
                    className="mt-4 w-full rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-orange-700 hover:to-amber-700"
                  >
                    {t('book')}
                  </button>
                ) : (
                  <div className="mt-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{t('notHere', { location: loc.name })}</p>
                    {other[0] && (
                      <button
                        type="button"
                        onClick={() => onLocation(other[0].id)}
                        className="w-full rounded-lg border border-orange-300 dark:border-orange-800 px-4 py-2 text-sm font-medium text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/40"
                      >
                        {t('seeIn', { location: other[0].name })}
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <PhoneIcon className="h-4 w-4" />
            {t('contact', { phone: biz.phone })}
          </span>
          <span className="hidden sm:inline">·</span>
          <span>{t('policy', { hours: biz.cancelHours })}</span>
        </div>
      </div>
    </div>
  );
}
