'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowPathIcon, BuildingStorefrontIcon, CalendarDaysIcon, InformationCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import BookingDetail from './components/BookingDetail';
import BookingWizard from './components/BookingWizard';
import BusinessPanel, { type PanelTab } from './components/BusinessPanel';
import NewBookingModal from './components/NewBookingModal';
import PublicPage from './components/PublicPage';
import RescheduleDialog from './components/RescheduleDialog';
import type { NewPrefill } from './components/AgendaView';
import { ToastProvider, btnSmall, selectCls, useFmt, useToast } from './components/ui';
import { isWorkingDay } from './lib/engine';
import { addDays } from './lib/dates';
import { BUSINESSES } from './lib/presets';
import { ReservasProvider, useReservas } from './lib/store';
import { PRESETS, type ISODate, type PresetId } from './lib/types';

export default function SistemaReservasPage() {
  const t = useTranslations('demoReservas');
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <header className="mb-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-600 to-amber-600 text-white shrink-0">
                <CalendarDaysIcon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">{t('shell.title')}</h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 max-w-3xl">{t('shell.subtitle')}</p>
              </div>
            </div>
          </header>

          <div className="mb-5 flex flex-col lg:flex-row lg:items-start gap-3">
            <span
              className="self-start inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200 whitespace-nowrap"
              title={t('shell.sampleHint')}
            >
              {t('shell.sampleBadge')}
            </span>
            <details className="group flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-3 py-2 text-sm">
              <summary className="cursor-pointer list-none flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                <InformationCircleIcon className="h-4 w-4 text-orange-600 shrink-0" />
                {t('how.title')}
                <span className="ml-auto text-xs text-slate-500 group-open:hidden">{t('common.show')}</span>
                <span className="ml-auto text-xs text-slate-500 hidden group-open:inline">{t('common.hide')}</span>
              </summary>
              <div className="mt-3 grid gap-4 md:grid-cols-2 text-slate-700 dark:text-slate-300">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">{t('how.realTitle')}</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {(t.raw('how.real') as string[]).map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">{t('how.simTitle')}</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {(t.raw('how.sim') as string[]).map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div className="md:col-span-2">
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">{t('how.tourTitle')}</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    {(t.raw('how.tour') as string[]).map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </details>
          </div>

          <ReservasProvider
            fallback={
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center text-sm text-slate-500 dark:text-slate-400" role="status">
                {t('shell.loading')}
              </div>
            }
          >
            <Demo />
          </ReservasProvider>
        </div>
      </div>
    </ToastProvider>
  );
}

type Wizard = { serviceId: string; key: number } | null;

function Demo() {
  const t = useTranslations('demoReservas.shell');
  const { state, biz, now, setPreset, reset } = useReservas();
  const f = useFmt();
  const notify = useToast();
  const [view, setView] = useState<'client' | 'business'>('client');
  const [locationId, setLocationId] = useState(biz.locations[0].id);
  const [wizard, setWizard] = useState<Wizard>(null);
  const [tab, setTab] = useState<PanelTab>('agenda');
  const [agendaDate, setAgendaDate] = useState<ISODate>(() => firstWorkingDay(biz.id, now.date));
  const [detailId, setDetailId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newPrefill, setNewPrefill] = useState<NewPrefill | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const top = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const changePreset = (p: PresetId) => {
    setPreset(p);
    setLocationId(BUSINESSES[p].locations[0].id);
    setWizard(null);
    setDetailId(null);
    setRescheduleId(null);
    setNewPrefill(null);
    setAgendaDate(firstWorkingDay(p, now.date));
    notify(t('presetChanged', { name: BUSINESSES[p].name }));
  };

  const goAgenda = (bookingId: string) => {
    const b = state.data[state.preset].bookings.find((x) => x.id === bookingId);
    if (b) setAgendaDate(b.date);
    setTab('agenda');
    setView('business');
    top();
  };

  return (
    <>
      <div className="mb-5 flex flex-col md:flex-row md:items-end gap-3">
        <div className="md:w-72">
          <label htmlFor="preset" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
            {t('preset')}
          </label>
          <select id="preset" className={selectCls} value={state.preset} onChange={(e) => changePreset(e.target.value as PresetId)}>
            {PRESETS.map((p) => (
              <option key={p} value={p}>
                {f.l(BUSINESSES[p].sector)} · {BUSINESSES[p].name}
              </option>
            ))}
          </select>
        </div>
        <div role="group" aria-label={t('viewLabel')} className="inline-flex rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 gap-1 self-start md:self-auto">
          {(
            [
              { id: 'client', icon: UserGroupIcon },
              { id: 'business', icon: BuildingStorefrontIcon },
            ] as const
          ).map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => setView(id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 sm:px-4 py-2 text-sm font-semibold transition-colors ${
                view === id ? 'bg-orange-600 text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t(id === 'client' ? 'viewClient' : 'viewBusiness')}
            </button>
          ))}
        </div>
        <div className="md:ml-auto flex items-center gap-2">
          {confirmReset ? (
            <>
              <span className="text-xs text-slate-600 dark:text-slate-300">{t('resetConfirm')}</span>
              <button
                type="button"
                className={`${btnSmall} !border-red-300 !text-red-700 dark:!text-red-300`}
                onClick={() => {
                  reset();
                  setWizard(null);
                  setConfirmReset(false);
                  setDetailId(null);
                  setRescheduleId(null);
                  setNewPrefill(null);
                  setLocationId(BUSINESSES.odontologia.locations[0].id);
                  setAgendaDate(firstWorkingDay('odontologia', now.date));
                  notify(t('resetDone'));
                }}
              >
                {t('resetYes')}
              </button>
              <button type="button" className={btnSmall} onClick={() => setConfirmReset(false)}>
                {t('resetNo')}
              </button>
            </>
          ) : (
            <button type="button" className={btnSmall} onClick={() => setConfirmReset(true)}>
              <ArrowPathIcon className="h-4 w-4" />
              {t('reset')}
            </button>
          )}
        </div>
      </div>

      {view === 'client' ? (
        wizard ? (
          <BookingWizard
            key={wizard.key}
            serviceId={wizard.serviceId}
            locationId={locationId}
            onExit={() => {
              setWizard(null);
              top();
            }}
            onAgenda={goAgenda}
            onReschedule={setRescheduleId}
          />
        ) : (
          <PublicPage
            locationId={locationId}
            onLocation={setLocationId}
            onBook={(serviceId) => {
              setWizard({ serviceId, key: Date.now() });
              top();
            }}
          />
        )
      ) : (
        <BusinessPanel
          tab={tab}
          setTab={setTab}
          agendaDate={agendaDate}
          setAgendaDate={setAgendaDate}
          onOpen={setDetailId}
          onNew={setNewPrefill}
          onReschedule={setRescheduleId}
        />
      )}

      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{t('footer', { nit: biz.nit })}</p>

      {detailId && (
        <BookingDetail
          key={detailId}
          bookingId={detailId}
          onClose={() => setDetailId(null)}
          onReschedule={(id) => {
            setDetailId(null);
            setRescheduleId(id);
          }}
        />
      )}
      {rescheduleId && <RescheduleDialog key={rescheduleId} bookingId={rescheduleId} onClose={() => setRescheduleId(null)} />}
      {newPrefill && (
        <NewBookingModal
          prefill={newPrefill}
          onClose={() => setNewPrefill(null)}
          onCreated={(_, date) => {
            setNewPrefill(null);
            setAgendaDate(date);
          }}
        />
      )}
    </>
  );
}

/** Hoy si el negocio atiende, si no el siguiente día con turnos en su primera sede. */
function firstWorkingDay(preset: PresetId, today: ISODate): ISODate {
  const biz = BUSINESSES[preset];
  for (let i = 0; i < 14; i++) {
    const d = addDays(today, i);
    if (biz.locations.some((l) => isWorkingDay(biz, d, l.id))) return d;
  }
  return today;
}
