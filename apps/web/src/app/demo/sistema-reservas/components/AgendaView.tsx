'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { addDays, capitalize, holidayOn, startOfWeek } from '../lib/dates';
import { occupies, serviceOf, shiftsOn, staffOf } from '../lib/engine';
import { buildIcs, download, fileSlug } from '../lib/files';
import { useReservas } from '../lib/store';
import type { Booking, ISODate, Staff } from '../lib/types';
import { useEventText } from './ConfirmStep';
import { STAFF_COLORS, STATUS_STYLE, Segmented, btnSmall, selectCls, useFmt, useKind, useToast } from './ui';

export interface NewPrefill {
  date?: ISODate;
  start?: number;
  staffId?: string;
  locationId?: string;
}

const PX_PER_MIN = 0.9;

export default function AgendaView({
  viewAs,
  date,
  setDate,
  onOpen,
  onNew,
}: {
  viewAs: string;
  date: ISODate;
  setDate: (d: ISODate) => void;
  onOpen: (id: string) => void;
  onNew: (p: NewPrefill) => void;
}) {
  const t = useTranslations('demoReservas.agenda');
  const ts = useTranslations('demoReservas.status');
  const { biz, data, now, state } = useReservas();
  const f = useFmt();
  const kind = useKind(biz);
  const notify = useToast();
  const eventText = useEventText(biz);
  const [mode, setMode] = useState<'day' | 'week'>('day');
  const [locationId, setLocationId] = useState<string>('all');

  const inScope = (b: Booking) => (viewAs === 'all' || b.staffId === viewAs) && (locationId === 'all' || b.locationId === locationId);
  const weekStart = startOfWeek(date);
  const days = mode === 'day' ? [date] : Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const visible = data.bookings.filter((b) => inScope(b) && days.includes(b.date));
  const active = visible.filter((b) => occupies(b.status));

  // Columnas del día: quien tiene turno (en la sede elegida) o citas ese día.
  const columns: { staff: Staff; shifts: { loc: string; start: number; end: number }[] }[] = useMemo(() => {
    return biz.staff
      .filter((s) => viewAs === 'all' || s.id === viewAs)
      .map((s) => ({ staff: s, shifts: shiftsOn(biz, s, date).filter((sh) => locationId === 'all' || sh.loc === locationId) }))
      .filter((c) => c.shifts.length || data.bookings.some((b) => b.staffId === c.staff.id && b.date === date && (locationId === 'all' || b.locationId === locationId)));
  }, [biz, viewAs, date, locationId, data.bookings]);

  const dayStart = Math.min(7 * 60, ...columns.flatMap((c) => c.shifts.map((s) => Math.floor(s.start / 60) * 60)));
  const dayEnd = Math.max(19 * 60, ...columns.flatMap((c) => c.shifts.map((s) => Math.ceil(s.end / 60) * 60)));
  const hours = Array.from({ length: (dayEnd - dayStart) / 60 }, (_, i) => dayStart + i * 60);
  const holiday = holidayOn(date);

  const shift = (n: number) => setDate(addDays(date, mode === 'day' ? n : n * 7));
  const label = mode === 'day' ? capitalize(f.date(date, 'long')) : t('weekOf', { from: f.date(weekStart, 'short'), to: f.date(addDays(weekStart, 6), 'short') });

  const exportIcs = () => {
    if (!active.length) {
      notify(t('icsEmpty'));
      return;
    }
    const content = buildIcs(
      active.map((b) => ({ booking: b, text: eventText(b) })),
      now.stamp,
      t('icsReminder'),
    );
    download(`agenda-${fileSlug(biz)}-${days[0]}${mode === 'week' ? `-${days[6]}` : ''}.ics`, content, 'text/calendar;charset=utf-8');
    notify(t('icsDone', { n: active.length }));
  };

  const card = (b: Booking, compact: boolean) => {
    const svc = serviceOf(biz, b.serviceId);
    const staff = staffOf(biz, b.staffId);
    const isNew = b.id === state.lastBookingId;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpen(b.id);
        }}
        className={`w-full ${compact ? '' : 'h-full'} text-left rounded-md border-l-4 px-2 py-1 text-xs shadow-sm transition hover:brightness-95 ${
          staff ? STAFF_COLORS[staff.color].block : ''
        } ${b.status === 'cancelled' ? 'opacity-50 line-through' : ''} ${isNew ? 'ring-2 ring-orange-500 ring-offset-1 dark:ring-offset-slate-900' : ''}`}
      >
        <span className="flex items-center justify-between gap-1">
          <span className="font-semibold truncate">
            {f.time(b.start)} · {b.client.name}
          </span>
          {isNew && <span className="shrink-0 rounded bg-orange-600 px-1 text-[10px] font-bold text-white">{t('new')}</span>}
        </span>
        <span className="block truncate opacity-80">{svc ? f.l(svc.name) : ''}</span>
        {!compact && (
          <span className={`mt-0.5 inline-block rounded-full px-1.5 text-[10px] font-semibold ${STATUS_STYLE[b.status]}`}>{ts(b.status)}</span>
        )}
        {compact && <span className="block truncate opacity-70">{staff?.name}</span>}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col xl:flex-row xl:items-center gap-3 xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" aria-label={mode === 'day' ? t('prevDay') : t('prevWeek')} onClick={() => shift(-1)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button type="button" aria-label={mode === 'day' ? t('nextDay') : t('nextWeek')} onClick={() => shift(1)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronRightIcon className="h-5 w-5" />
          </button>
          <button type="button" className={btnSmall} onClick={() => setDate(now.date)} disabled={date === now.date}>
            {t('today')}
          </button>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white" aria-live="polite">
            {label}
          </h3>
          {mode === 'day' && holiday && <span className="rounded-full bg-red-100 dark:bg-red-950/50 px-2 py-0.5 text-xs text-red-700 dark:text-red-300">{f.l(holiday.name)}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label={t('modeLabel')}
            size="sm"
            value={mode}
            onChange={setMode}
            options={[
              { id: 'day', label: t('day') },
              { id: 'week', label: t('week') },
            ]}
          />
          <label className="sr-only" htmlFor="ag-loc">
            {t('location')}
          </label>
          <select id="ag-loc" className={`${selectCls} !w-auto`} value={locationId} onChange={(e) => setLocationId(e.target.value)}>
            <option value="all">{t('allLocations')}</option>
            {biz.locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <button type="button" className={btnSmall} onClick={exportIcs}>
            <ArrowDownTrayIcon className="h-4 w-4" />
            {t('exportIcs')}
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t('summary', { n: active.length, pending: active.filter((b) => b.status === 'pending').length })} · {t('hint')}
      </p>

      {mode === 'day' ? (
        columns.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            {holiday && !biz.holidaysOpen ? t('closedHoliday', { name: f.l(holiday.name) }) : t('closedDay')}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex" style={{ minWidth: 60 + columns.length * 170 }}>
              <div className="w-[60px] shrink-0 border-r border-slate-200 dark:border-slate-800">
                <div className="h-12 border-b border-slate-200 dark:border-slate-800" />
                <div className="relative" style={{ height: (dayEnd - dayStart) * PX_PER_MIN }}>
                  {hours.map((h) => (
                    <span key={h} className="absolute right-1 -translate-y-1/2 text-[10px] text-slate-400" style={{ top: (h - dayStart) * PX_PER_MIN }}>
                      {h === dayStart ? '' : f.time(h).replace(':00', '')}
                    </span>
                  ))}
                </div>
              </div>
              {columns.map(({ staff, shifts }) => {
                const list = data.bookings.filter((b) => b.staffId === staff.id && b.date === date && (locationId === 'all' || b.locationId === locationId));
                const locNames = Array.from(new Set(shifts.map((s) => biz.locations.find((l) => l.id === s.loc)?.name ?? '')));
                return (
                  <div key={staff.id} className="flex-1 min-w-[170px] border-r last:border-r-0 border-slate-200 dark:border-slate-800">
                    <div className="h-12 border-b border-slate-200 dark:border-slate-800 px-2 py-1.5">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white truncate">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${STAFF_COLORS[staff.color].dot}`} />
                        {staff.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{shifts.length ? locNames.join(' · ') : t('offShift')}</p>
                    </div>
                    <div
                      className="relative bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,rgba(148,163,184,0.15)_6px,rgba(148,163,184,0.15)_12px)] cursor-copy"
                      style={{ height: (dayEnd - dayStart) * PX_PER_MIN }}
                      title={t('clickToBook')}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const minute = dayStart + (e.clientY - rect.top) / PX_PER_MIN;
                        const sh = shifts.find((s) => minute >= s.start && minute < s.end);
                        if (!sh) return;
                        const start = Math.floor(minute / biz.step) * biz.step;
                        onNew({ date, start: Math.max(start, sh.start), staffId: staff.id, locationId: sh.loc });
                      }}
                    >
                      {shifts.map((s) => (
                        <div
                          key={`${s.loc}${s.start}`}
                          className="absolute inset-x-0 bg-white dark:bg-slate-900"
                          style={{ top: (s.start - dayStart) * PX_PER_MIN, height: (s.end - s.start) * PX_PER_MIN }}
                        />
                      ))}
                      {hours.map((h) => (
                        <div key={h} className="pointer-events-none absolute inset-x-0 border-t border-slate-100 dark:border-slate-800" style={{ top: (h - dayStart) * PX_PER_MIN }} />
                      ))}
                      {date === now.date && now.minutes > dayStart && now.minutes < dayEnd && (
                        <div className="pointer-events-none absolute inset-x-0 border-t-2 border-red-500 z-10" style={{ top: (now.minutes - dayStart) * PX_PER_MIN }} />
                      )}
                      {list.map((b) => (
                        <div
                          key={b.id}
                          className="absolute left-1 right-1 z-[5]"
                          style={{ top: (b.start - dayStart) * PX_PER_MIN, height: Math.max(26, (b.end - b.start) * PX_PER_MIN - 2) }}
                        >
                          <div className="h-full overflow-hidden">{card(b, false)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : (
        <div className="grid gap-3 md:grid-cols-7">
          {days.map((d) => {
            const list = visible.filter((b) => b.date === d);
            const hol = holidayOn(d);
            return (
              <div key={d} className={`rounded-xl border p-2 min-w-0 ${d === now.date ? 'border-orange-400' : 'border-slate-200 dark:border-slate-800'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setDate(d);
                    setMode('day');
                  }}
                  className="w-full text-left text-xs font-semibold text-slate-800 dark:text-slate-100 hover:text-orange-700">
                  {capitalize(f.date(d, 'short'))}
                </button>
                {hol && <p className="text-[10px] text-red-500 truncate">{f.l(hol.name)}</p>}
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1.5">{t('count', { n: list.filter((b) => occupies(b.status)).length })}</p>
                <div className="space-y-1.5">
                  {list.map((b) => (
                    <div key={b.id}>{card(b, true)}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-xs text-slate-500 dark:text-slate-400">{t('icsNote', { kind: kind.many.toLowerCase() })}</p>
    </div>
  );
}
