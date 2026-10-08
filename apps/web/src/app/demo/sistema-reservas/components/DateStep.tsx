'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { addDays, addMonths, capitalize, daysInMonth, firstOfMonth, holidaysInMonth, startOfWeek, weekday } from '../lib/dates';
import { dayInfo, freeSlots, staffForService, type DayKind, type Slot, type SlotQuery } from '../lib/engine';
import { useReservas } from '../lib/store';
import type { ISODate } from '../lib/types';
import { Segmented, STAFF_COLORS, useFmt, useKind } from './ui';

const DAY_STYLE: Record<DayKind, string> = {
  past: 'text-slate-300 dark:text-slate-600 cursor-not-allowed',
  beyond: 'text-slate-300 dark:text-slate-600 cursor-not-allowed',
  holiday: 'bg-red-50 text-red-400 dark:bg-red-950/30 dark:text-red-400 cursor-not-allowed',
  closed: 'bg-slate-50 text-slate-400 dark:bg-slate-800/40 dark:text-slate-500 cursor-not-allowed',
  full: 'bg-slate-100 text-slate-400 line-through dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed',
  open: 'bg-white text-slate-800 border-slate-200 hover:border-orange-500 hover:bg-orange-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-orange-950/40',
};

const DOT: Record<DayKind, string> = {
  past: 'bg-transparent',
  beyond: 'bg-transparent',
  holiday: 'bg-red-400',
  closed: 'bg-slate-300 dark:bg-slate-600',
  full: 'bg-slate-400',
  open: 'bg-emerald-500',
};

export default function DateStep({
  serviceId,
  locationId,
  staffId,
  onStaff,
  selected,
  onPickDate,
  onPickSlot,
}: {
  serviceId: string;
  locationId: string;
  staffId: string;
  onStaff: (id: string) => void;
  selected: ISODate | null;
  onPickDate: (date: ISODate) => void;
  onPickSlot: (date: ISODate, slot: Slot) => void;
}) {
  const t = useTranslations('demoReservas.date');
  const { biz, data, now } = useReservas();
  const f = useFmt();
  const kind = useKind(biz);
  const q: Omit<SlotQuery, 'date'> = useMemo(() => ({ serviceId, staffId, locationId, now }), [serviceId, staffId, locationId, now]);
  const [mode, setMode] = useState<'month' | 'week'>('month');
  const [month, setMonth] = useState<ISODate>(firstOfMonth(selected ?? now.date));
  const [week, setWeek] = useState<ISODate>(startOfWeek(selected ?? now.date));

  const minMonth = firstOfMonth(now.date);
  const maxDate = addDays(now.date, biz.horizonDays);
  const maxMonth = firstOfMonth(maxDate);
  const minWeek = startOfWeek(now.date);
  const maxWeek = startOfWeek(maxDate);
  const people = staffForService(biz, serviceId, locationId);

  const monthDays = useMemo(() => {
    const lead = (weekday(month) + 6) % 7; // lunes primero
    const cells: (ISODate | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 0; d < daysInMonth(month); d++) cells.push(addDays(month, d));
    return cells;
  }, [month]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(week, i)), [week]);
  const headers = useMemo(() => Array.from({ length: 7 }, (_, i) => capitalize(f.date(addDays('2026-10-05', i), 'weekdayShort').replace('.', ''))), [f]);

  const holidayList = mode === 'month' ? holidaysInMonth(month) : weekDays.map((d) => holidaysInMonth(d).find((h) => h.date === d)).filter((h): h is NonNullable<typeof h> => !!h);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">{kind.choose}</p>
        <div role="group" aria-label={kind.choose} className="flex flex-wrap gap-2">
          {[{ id: 'any', name: kind.any, role: t('anyHint') }, ...people.map((p) => ({ id: p.id, name: p.name, role: f.l(p.role), color: p.color }))].map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={staffId === p.id}
              onClick={() => onStaff(p.id)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors ${
                staffId === p.id ? 'border-orange-600 bg-orange-50 dark:bg-orange-950/40' : 'border-slate-200 dark:border-slate-700 hover:border-orange-400'
              }`}
            >
              {'color' in p && p.color ? <span className={`h-2.5 w-2.5 rounded-full ${STAFF_COLORS[p.color].dot}`} aria-hidden="true" /> : null}
              <span>
                <span className="block text-sm font-medium text-slate-900 dark:text-white">{p.name}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{p.role}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={mode === 'month' ? t('prevMonth') : t('prevWeek')}
            disabled={mode === 'month' ? month <= minMonth : week <= minWeek}
            onClick={() => (mode === 'month' ? setMonth(addMonths(month, -1)) : setWeek(addDays(week, -7)))}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <h3 className="min-w-[10rem] text-center text-base font-semibold text-slate-900 dark:text-white" aria-live="polite">
            {mode === 'month' ? capitalize(f.date(month, 'month')) : t('weekOf', { from: f.date(week, 'short'), to: f.date(addDays(week, 6), 'short') })}
          </h3>
          <button
            type="button"
            aria-label={mode === 'month' ? t('nextMonth') : t('nextWeek')}
            disabled={mode === 'month' ? month >= maxMonth : week >= maxWeek}
            onClick={() => (mode === 'month' ? setMonth(addMonths(month, 1)) : setWeek(addDays(week, 7)))}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
        <Segmented
          label={t('viewLabel')}
          value={mode}
          onChange={(m) => {
            setMode(m);
            if (m === 'week') setWeek(startOfWeek(selected ?? (month === minMonth ? now.date : month)));
            else setMonth(firstOfMonth(selected ?? week));
          }}
          options={[
            { id: 'month', label: t('month') },
            { id: 'week', label: t('week') },
          ]}
        />
      </div>

      {mode === 'month' ? (
        <div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1">
            {headers.map((h) => (
              <div key={h} className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 py-1">
                {h}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {monthDays.map((d, i) => {
              if (!d) return <div key={`e${i}`} />;
              const info = dayInfo(biz, data.bookings, q, d);
              const isToday = d === now.date;
              const isSel = d === selected;
              const label =
                info.kind === 'open'
                  ? t('slotsLeft', { n: info.slots })
                  : info.kind === 'holiday'
                    ? t('holiday')
                    : info.kind === 'closed'
                      ? t('closed')
                      : info.kind === 'full'
                        ? t('full')
                        : '';
              const title = info.holiday ? `${f.l(info.holiday.name)}${info.kind === 'holiday' ? ` · ${t('closed')}` : ''}` : label;
              return (
                <button
                  key={d}
                  type="button"
                  disabled={info.kind !== 'open'}
                  onClick={() => onPickDate(d)}
                  title={title || undefined}
                  aria-label={`${f.date(d, 'long')}${label ? ` · ${label}` : ''}${info.holiday ? ` · ${f.l(info.holiday.name)}` : ''}`}
                  aria-pressed={isSel}
                  className={`relative h-12 sm:h-16 rounded-lg border border-transparent text-sm font-medium flex flex-col items-center justify-center transition-colors ${DAY_STYLE[info.kind]} ${
                    isSel ? '!bg-orange-600 !text-white !border-orange-600' : ''
                  } ${isToday && !isSel ? 'ring-2 ring-orange-400' : ''}`}
                >
                  <span>{Number(d.slice(8))}</span>
                  <span className={`hidden sm:block text-[10px] leading-tight font-normal ${isSel ? 'text-orange-50' : ''}`}>{label}</span>
                  <span className={`sm:hidden mt-0.5 h-1.5 w-1.5 rounded-full ${isSel ? 'bg-white' : DOT[info.kind]}`} aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-7">
          {weekDays.map((d) => {
            const info = dayInfo(biz, data.bookings, q, d);
            const slots = info.kind === 'open' ? freeSlots(biz, data.bookings, { ...q, date: d }) : [];
            return (
              <div key={d} className={`rounded-xl border p-2 ${d === now.date ? 'border-orange-400' : 'border-slate-200 dark:border-slate-700'}`}>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 text-center">{capitalize(f.date(d, 'short'))}</p>
                {info.holiday && <p className="text-[10px] text-center text-red-500 truncate">{f.l(info.holiday.name)}</p>}
                <div className="mt-2 flex flex-wrap md:flex-col gap-1.5 md:max-h-72 md:overflow-y-auto">
                  {info.kind === 'open' ? (
                    slots.map((s) => (
                      <button
                        key={s.start}
                        type="button"
                        onClick={() => onPickSlot(d, s)}
                        className="rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/40"
                      >
                        {f.time(s.start)}
                      </button>
                    ))
                  ) : (
                    <p className="w-full text-center text-[11px] text-slate-400 py-2">
                      {info.kind === 'holiday' ? t('holiday') : info.kind === 'closed' ? t('closed') : info.kind === 'full' ? t('full') : t('unavailable')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {t('legendOpen')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-400" />
          {t('legendFull')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          {biz.holidaysOpen ? t('legendHolidayOpen') : t('legendHoliday')}
        </span>
        <span>{t('legendRules', { days: biz.horizonDays, lead: biz.leadMinutes })}</span>
      </div>
      {holidayList.length > 0 && (
        <p className="text-xs text-slate-600 dark:text-slate-300">
          {t('holidaysIn')}{' '}
          {holidayList.map((h, i) => (
            <span key={h.date}>
              {i > 0 && ' · '}
              {f.date(h.date, 'dayMonth')} ({f.l(h.name)})
            </span>
          ))}
          {biz.holidaysOpen ? ` — ${t('holidayOpenNote')}` : ''}
        </p>
      )}
    </div>
  );
}
