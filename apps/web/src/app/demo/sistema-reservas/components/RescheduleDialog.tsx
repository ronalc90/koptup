'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { addDays } from '../lib/dates';
import { dayInfo, firstOpenDay, freeSlots, serviceOf, staffForService, staffOf } from '../lib/engine';
import { useReservas } from '../lib/store';
import { Field, Modal, btnPrimary, btnSecondary, inputCls, selectCls, useFmt, useKind, useToast } from './ui';

/** Reprogramar una cita: solo ofrece horas libres para su servicio y sede. */
export default function RescheduleDialog({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const t = useTranslations('demoReservas.reschedule');
  const { biz, data, now, act } = useReservas();
  const f = useFmt();
  const kind = useKind(biz);
  const notify = useToast();
  const booking = data.bookings.find((b) => b.id === bookingId);
  const [staffId, setStaffId] = useState<string>(booking?.staffId ?? 'any');
  const base = useMemo(
    () => ({ serviceId: booking?.serviceId ?? '', staffId, locationId: booking?.locationId ?? '', now, ignoreBookingId: bookingId }),
    [booking?.serviceId, booking?.locationId, staffId, now, bookingId],
  );
  // Al abrir: el mismo día si aún tiene cupo, si no el primer día con cupo.
  const [date, setDate] = useState(() => {
    if (!booking) return now.date;
    if (booking.date >= now.date && dayInfo(biz, data.bookings, base, booking.date).kind === 'open') return booking.date;
    return firstOpenDay(biz, data.bookings, base) ?? now.date;
  });
  const [start, setStart] = useState<number | null>(null);

  if (!booking) return null;
  const svc = serviceOf(biz, booking.serviceId);
  const info = dayInfo(biz, data.bookings, base, date);
  const slots = info.kind === 'open' ? freeSlots(biz, data.bookings, { ...base, date }) : [];
  const chosen = slots.find((s) => s.start === start);
  const options = staffForService(biz, booking.serviceId, booking.locationId);

  const save = () => {
    if (!chosen) return;
    const assigned = staffId === 'any' ? chosen.staffIds[0] : staffId;
    act({ type: 'reschedule', id: booking.id, date, start: chosen.start, staffId: assigned });
    notify(t('done', { code: booking.code, date: f.date(date, 'dayMonth'), time: f.time(chosen.start) }));
    onClose();
  };

  return (
    <Modal
      labelId="reschedule-title"
      title={t('title', { code: booking.code })}
      subtitle={t('current', { service: svc ? f.l(svc.name) : '', date: f.date(booking.date, 'dayMonth'), time: f.time(booking.start), staff: staffOf(biz, booking.staffId)?.name ?? '' })}
      onClose={onClose}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('date')} htmlFor="rs-date">
          <input
            id="rs-date"
            type="date"
            className={inputCls}
            value={date}
            min={now.date}
            max={addDays(now.date, biz.horizonDays)}
            onChange={(e) => {
              if (e.target.value) setDate(e.target.value);
              setStart(null);
            }}
          />
        </Field>
        <Field label={kind.one} htmlFor="rs-staff">
          <select
            id="rs-staff"
            className={selectCls}
            value={staffId}
            onChange={(e) => {
              setStaffId(e.target.value);
              setStart(null);
            }}
          >
            <option value="any">{kind.any}</option>
            {options.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('slots', { date: f.date(date, 'dayMonth') })}</p>
        {info.kind !== 'open' ? (
          <p className="rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-3 text-sm text-slate-600 dark:text-slate-300">
            {t(`day.${info.kind}`, { holiday: info.holiday ? f.l(info.holiday.name) : '' })}
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
            {slots.map((s) => (
              <button
                key={s.start}
                type="button"
                aria-pressed={start === s.start}
                onClick={() => setStart(s.start)}
                className={`rounded-lg px-2 py-2 text-sm font-medium border transition-colors ${
                  start === s.start
                    ? 'bg-orange-600 border-orange-600 text-white'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-orange-400 text-slate-700 dark:text-slate-200'
                }`}
              >
                {f.time(s.start)}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{t('notice')}</p>
      <div className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <button type="button" className={btnSecondary} onClick={onClose}>
          {t('cancel')}
        </button>
        <button type="button" className={btnPrimary} disabled={!chosen} onClick={save}>
          {chosen ? t('save', { time: f.time(chosen.start) }) : t('pick')}
        </button>
      </div>
    </Modal>
  );
}
