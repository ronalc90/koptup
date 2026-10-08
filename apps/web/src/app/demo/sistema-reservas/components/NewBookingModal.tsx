'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { addDays } from '../lib/dates';
import { dayInfo, freeSlots, isEmail, normalizeMobile, staffForService } from '../lib/engine';
import { useReservas } from '../lib/store';
import type { Channel, ISODate, Status } from '../lib/types';
import type { NewPrefill } from './AgendaView';
import { Field, Modal, btnPrimary, btnSecondary, inputCls, selectCls, useFmt, useKind, useToast } from './ui';

/** Reserva tomada por recepción (teléfono, WhatsApp o presencial). */
export default function NewBookingModal({ prefill, onClose, onCreated }: { prefill: NewPrefill; onClose: () => void; onCreated: (id: string, date: ISODate) => void }) {
  const t = useTranslations('demoReservas.newBooking');
  const td = useTranslations('demoReservas.reschedule.day');
  const tc = useTranslations('demoReservas.channel');
  const { biz, data, now, state, act } = useReservas();
  const f = useFmt();
  const kind = useKind(biz);
  const notify = useToast();

  const firstService = (prefill.staffId && biz.staff.find((s) => s.id === prefill.staffId)?.services[0]) || biz.services[0].id;
  const [serviceId, setServiceId] = useState(firstService);
  const [locationId, setLocationId] = useState(prefill.locationId ?? biz.locations[0].id);
  const [staffId, setStaffId] = useState(prefill.staffId ?? 'any');
  const [date, setDate] = useState<ISODate>(prefill.date && prefill.date >= now.date ? prefill.date : now.date);
  const [start, setStart] = useState<number | null>(prefill.start ?? null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [channel, setChannel] = useState<Exclude<Channel, 'web'>>('phone');
  const [status, setStatus] = useState<Extract<Status, 'confirmed' | 'pending'>>('confirmed');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const people = staffForService(biz, serviceId, locationId);
  const q = useMemo(() => ({ serviceId, staffId, locationId, now }), [serviceId, staffId, locationId, now]);
  const info = dayInfo(biz, data.bookings, q, date);
  const slots = info.kind === 'open' ? freeSlots(biz, data.bookings, { ...q, date }) : [];
  const chosen = slots.find((s) => s.start === start) ?? null;

  const save = () => {
    const e: Record<string, boolean> = {};
    if (name.trim().length < 3) e.name = true;
    if (!normalizeMobile(phone)) e.phone = true;
    if (email.trim() && !isEmail(email)) e.email = true;
    if (!chosen) e.slot = true;
    setErrors(e);
    if (Object.keys(e).length || !chosen) return;
    const id = `n${state.seq + 1}`;
    act({
      type: 'create',
      input: {
        serviceId,
        staffId: staffId === 'any' ? chosen.staffIds[0] : staffId,
        locationId,
        date,
        start: chosen.start,
        client: { name: name.trim(), phone: normalizeMobile(phone) ?? phone, email: email.trim() },
        channel,
        status,
        payment: { kind: 'none', method: 'onsite', amount: 0, ref: null },
        notes: notes.trim(),
        remind: { whatsapp: true, email: !!email.trim() },
      },
    });
    notify(t('created', { date: f.date(date, 'dayMonth'), time: f.time(chosen.start) }));
    onCreated(id, date);
  };

  return (
    <Modal labelId="new-booking-title" size="lg" title={t('title')} subtitle={t('subtitle')} onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('service')} htmlFor="nb-service">
          <select
            id="nb-service"
            className={selectCls}
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              setStaffId('any');
              setStart(null);
            }}
          >
            {biz.services.map((s) => (
              <option key={s.id} value={s.id}>
                {f.l(s.name)} · {f.duration(s.duration)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('location')} htmlFor="nb-loc">
          <select
            id="nb-loc"
            className={selectCls}
            value={locationId}
            onChange={(e) => {
              setLocationId(e.target.value);
              setStaffId('any');
              setStart(null);
            }}
          >
            {biz.locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={kind.one} htmlFor="nb-staff" error={people.length === 0 ? t('notOffered') : undefined}>
          <select
            id="nb-staff"
            className={selectCls}
            value={staffId}
            onChange={(e) => {
              setStaffId(e.target.value);
              setStart(null);
            }}
          >
            <option value="any">{kind.any}</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('date')} htmlFor="nb-date">
          <input
            id="nb-date"
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
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">{t('time')}</p>
        {info.kind !== 'open' ? (
          <p className="rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-600 dark:text-slate-300">{td(info.kind, { holiday: info.holiday ? f.l(info.holiday.name) : '' })}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {slots.map((s) => (
              <button
                key={s.start}
                type="button"
                aria-pressed={start === s.start}
                onClick={() => setStart(s.start)}
                className={`rounded-md border px-2 py-1 text-xs font-medium ${
                  start === s.start ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-200 dark:border-slate-700 hover:border-orange-400 text-slate-700 dark:text-slate-200'
                }`}
              >
                {f.time(s.start)}
              </button>
            ))}
          </div>
        )}
        {errors.slot && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{t('errors.slot')}</p>}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Field label={t('name')} htmlFor="nb-name" error={errors.name ? t('errors.name') : undefined}>
          <input id="nb-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t('phone')} htmlFor="nb-phone" error={errors.phone ? t('errors.phone') : undefined}>
          <input id="nb-phone" type="tel" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="300 555 0123" />
        </Field>
        <Field label={t('email')} htmlFor="nb-email" error={errors.email ? t('errors.email') : undefined}>
          <input id="nb-email" type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label={t('channel')} htmlFor="nb-channel">
          <select id="nb-channel" className={selectCls} value={channel} onChange={(e) => setChannel(e.target.value as Exclude<Channel, 'web'>)}>
            {(['phone', 'whatsapp', 'walkin'] as const).map((c) => (
              <option key={c} value={c}>
                {tc(c)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('status')} htmlFor="nb-status">
          <select id="nb-status" className={selectCls} value={status} onChange={(e) => setStatus(e.target.value as 'confirmed' | 'pending')}>
            <option value="confirmed">{t('statusConfirmed')}</option>
            <option value="pending">{t('statusPending')}</option>
          </select>
        </Field>
        <Field label={t('notes')} htmlFor="nb-notes">
          <input id="nb-notes" className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{t('consentNote')}</p>

      <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <button type="button" className={btnSecondary} onClick={onClose}>
          {t('cancel')}
        </button>
        <button type="button" className={btnPrimary} onClick={save}>
          {t('save')}
        </button>
      </div>
    </Modal>
  );
}
