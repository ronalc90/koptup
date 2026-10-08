'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeftIcon, CheckIcon, ClockIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline';
import { capitalize } from '../lib/dates';
import { depositOf, freeSlots, isEmail, locationOf, normalizeMobile, serviceOf, staffOf, type Slot } from '../lib/engine';
import { useReservas } from '../lib/store';
import type { ISODate, PayMethod } from '../lib/types';
import ConfirmStep from './ConfirmStep';
import DateStep from './DateStep';
import DetailsStep, { EMPTY_FORM, type FormErrors, type FormState } from './DetailsStep';
import PayStep, { type PayOption } from './PayStep';
import { ServiceIcon, btnSecondary, useFmt, useKind } from './ui';

const STEPS = ['date', 'time', 'details', 'pay', 'done'] as const;

export default function BookingWizard({
  serviceId,
  locationId,
  onExit,
  onAgenda,
  onReschedule,
}: {
  serviceId: string;
  locationId: string;
  onExit: () => void;
  onAgenda: (bookingId: string) => void;
  onReschedule: (bookingId: string) => void;
}) {
  const t = useTranslations('demoReservas.wizard');
  const { biz, data, now, state, act } = useReservas();
  const f = useFmt();
  const kind = useKind(biz);
  const svc = serviceOf(biz, serviceId);
  const loc = locationOf(biz, locationId);

  const [step, setStep] = useState(1);
  const [staffId, setStaffId] = useState('any');
  const [date, setDate] = useState<ISODate | null>(null);
  const [start, setStart] = useState<number | null>(null);
  const [assigned, setAssigned] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [payOption, setPayOption] = useState<PayOption>(svc && svc.deposit > 0 ? 'deposit' : 'onsite');
  const [method, setMethod] = useState<PayMethod>('pse');
  const [processing, setProcessing] = useState(false);
  const [slotError, setSlotError] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const go = (n: number) => {
    setStep(n);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!svc || !loc) return null;

  const slots = date ? freeSlots(biz, data.bookings, { serviceId, staffId, locationId, date, now }) : [];
  const groups = [
    { id: 'morning', items: slots.filter((s) => s.start < 12 * 60) },
    { id: 'afternoon', items: slots.filter((s) => s.start >= 12 * 60 && s.start < 18 * 60) },
    { id: 'evening', items: slots.filter((s) => s.start >= 18 * 60) },
  ].filter((g) => g.items.length);

  const pickSlot = (d: ISODate, s: Slot) => {
    setDate(d);
    setStart(s.start);
    setAssigned(staffId === 'any' ? s.staffIds[0] : staffId);
    setSlotError(false);
    go(3);
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (form.name.trim().length < 3) e.name = 'name';
    if (!normalizeMobile(form.phone)) e.phone = 'phone';
    if (form.email.trim() && !isEmail(form.email)) e.email = 'email';
    if (form.remindEmail && !form.email.trim()) e.email = 'emailNeeded';
    if (!form.consent) e.consent = 'consent';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const amount = payOption === 'deposit' ? depositOf(svc) : payOption === 'full' ? svc.price : 0;

  const finish = () => {
    if (!date || start === null || !assigned) return;
    // La hora pudo ocuparse (o pasar) mientras llenabas los datos.
    const still = freeSlots(biz, data.bookings, { serviceId, staffId: assigned, locationId, date, now }).some((s) => s.start === start);
    if (!still) {
      setSlotError(true);
      setStart(null);
      go(2);
      return;
    }
    const create = () => {
      const id = `n${state.seq + 1}`;
      act({
        type: 'create',
        input: {
          serviceId,
          staffId: assigned,
          locationId,
          date,
          start,
          client: { name: form.name.trim(), phone: normalizeMobile(form.phone) ?? form.phone, email: form.email.trim() },
          channel: 'web',
          status: payOption === 'onsite' ? 'pending' : 'confirmed',
          payment:
            payOption === 'onsite'
              ? { kind: 'none', method: 'onsite', amount: 0, ref: null }
              : { kind: payOption, method, amount, ref: `SIM-${String(Date.now()).slice(-6)}` },
          notes: form.comments.trim(),
          remind: { whatsapp: form.remindWa, email: form.remindEmail && !!form.email.trim() },
        },
      });
      setBookingId(id);
      setProcessing(false);
      go(5);
    };
    if (payOption === 'onsite') {
      create();
      return;
    }
    setProcessing(true);
    timer.current = window.setTimeout(create, 1400);
  };

  const staff = assigned ? staffOf(biz, assigned) : staffId !== 'any' ? staffOf(biz, staffId) : undefined;

  return (
    <div ref={topRef} className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 sm:p-6">
      {step < 5 && (
        <button type="button" onClick={onExit} className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-700 dark:text-orange-300 hover:underline mb-4">
          <ArrowLeftIcon className="h-4 w-4" />
          {t('backToServices')}
        </button>
      )}

      <ol className="flex items-center gap-1 sm:gap-2 mb-5" aria-label={t('progress')}>
        {STEPS.map((s, i) => {
          const n = i + 1;
          const done = step > n;
          const active = step === n;
          return (
            <li key={s} className="flex items-center flex-1 min-w-0 gap-1 sm:gap-2" aria-current={active ? 'step' : undefined}>
              <span
                className={`h-7 w-7 sm:h-8 sm:w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                  done || active ? 'bg-orange-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                }`}
              >
                {done ? <CheckIcon className="h-4 w-4" /> : n}
              </span>
              <span className={`truncate text-[11px] sm:text-xs ${active ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'} ${active ? '' : 'hidden sm:inline'}`}>
                {t(`steps.${s}`)}
              </span>
              {i < STEPS.length - 1 && <span className={`hidden sm:block h-0.5 flex-1 ${done ? 'bg-orange-600' : 'bg-slate-200 dark:bg-slate-700'}`} />}
            </li>
          );
        })}
      </ol>

      {step < 5 && (
        <div className="mb-5 flex flex-wrap gap-x-4 gap-y-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200">
          <span className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
            <ServiceIcon icon={svc.icon} className="h-4 w-4 text-orange-600" />
            {f.l(svc.name)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPinIcon className="h-4 w-4 text-slate-400" />
            {loc.name}
          </span>
          <span className="flex items-center gap-1.5">
            <UserIcon className="h-4 w-4 text-slate-400" />
            {staff ? staff.name : kind.any}
          </span>
          {date && (
            <span className="flex items-center gap-1.5">
              <ClockIcon className="h-4 w-4 text-slate-400" />
              {capitalize(f.date(date, 'dayMonth'))}
              {start !== null ? ` · ${f.time(start)}` : ''}
            </span>
          )}
          <span className="sm:ml-auto font-semibold text-orange-700 dark:text-orange-300">
            {f.money(svc.price)} · {f.duration(svc.duration)}
          </span>
        </div>
      )}

      {step === 1 && (
        <>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('dateTitle')}</h2>
          <DateStep
            serviceId={serviceId}
            locationId={locationId}
            staffId={staffId}
            onStaff={(id) => {
              setStaffId(id);
              setDate(null);
              setStart(null);
              setAssigned(null);
            }}
            selected={date}
            onPickDate={(d) => {
              setDate(d);
              setStart(null);
              setAssigned(null);
              go(2);
            }}
            onPickSlot={pickSlot}
          />
        </>
      )}

      {step === 2 && date && (
        <>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('timeTitle')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {t('timeHint', { date: capitalize(f.date(date, 'long')), duration: f.duration(svc.duration), buffer: svc.buffer })}
          </p>
          {slotError && (
            <p role="alert" className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {t('slotTaken')}
            </p>
          )}
          {groups.length === 0 ? (
            <p className="rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-3 text-sm text-slate-600 dark:text-slate-300">{t('noSlots')}</p>
          ) : (
            <div className="space-y-4">
              {groups.map((g) => (
                <div key={g.id}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">{t(`groups.${g.id}`)}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                    {g.items.map((s) => (
                      <button
                        key={s.start}
                        type="button"
                        onClick={() => pickSlot(date, s)}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-2 text-left hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors"
                      >
                        <span className="block text-sm font-semibold text-slate-900 dark:text-white">{f.time(s.start)}</span>
                        <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {staffId === 'any' ? staffOf(biz, s.staffIds[0])?.name : t('until', { time: f.time(s.start + svc.duration) })}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6">
            <button type="button" className={btnSecondary} onClick={() => go(1)}>
              {t('changeDate')}
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <DetailsStep
          form={form}
          setForm={setForm}
          errors={errors}
          onBack={() => go(date && start !== null ? 2 : 1)}
          onNext={() => {
            if (validate()) go(4);
          }}
        />
      )}

      {step === 4 && (
        <PayStep
          service={svc}
          option={payOption}
          setOption={setPayOption}
          method={method}
          setMethod={setMethod}
          amount={amount}
          processing={processing}
          onBack={() => go(3)}
          onPay={finish}
        />
      )}

      {step === 5 && bookingId && <ConfirmStep bookingId={bookingId} onAgenda={onAgenda} onAnother={onExit} onReschedule={onReschedule} />}
    </div>
  );
}
