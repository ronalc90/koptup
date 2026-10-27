'use client';

/**
 * Agenda por especialidad: días hábiles, sábados en la mañana, sin domingos ni festivos
 * de Colombia; valor según el pagador; confirmación por WhatsApp (simulada). Las citas de
 * hoy se conectan con la sala de espera: el paciente hace su pre-consulta (ingreso) desde la
 * vista del paciente y entra a la sala con la especialidad de la cita.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { CheckCircleIcon, ClipboardDocumentIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline';
import { PAYERS, SPECIALTIES } from './mockData';
import { agendaDays, fmtCOP, fmtDate, payerOf, priceFor, slotsFor, specOf, tx, weekdayOf } from './logic';
import { SimTag, useDateNames, useLoc } from './ui';
import type { TelemedStore } from './store';
import type { Appointment, AppointmentStatus, SpecKey } from './types';

interface Props {
  store: TelemedStore;
  notify: (text: string, tone?: 'ok' | 'warn') => void;
  preset: { spec: SpecKey; n: number } | null;
  /** Lleva a la vista del paciente con la cita de hoy elegida para hacer su pre-consulta. */
  onPreconsult: (apptId: string) => void;
}

const STATUS_VARIANT: Record<AppointmentStatus, 'info' | 'warning' | 'success' | 'danger'> = {
  booked: 'info',
  checkedIn: 'warning',
  attended: 'success',
  referred: 'danger',
};

export default function SchedulingPanel({ store, notify, preset, onPreconsult }: Props) {
  const t = useTranslations('demoTelemed');
  const loc = useLoc();
  const names = useDateNames();
  const { appointments, day: today } = store.state;
  const days = useMemo(() => agendaDays(today, 7), [today]);
  const firstOpen = Math.max(
    0,
    days.findIndex((d) => d.status !== 'holiday' && d.status !== 'sunday'),
  );

  const [spec, setSpec] = useState<SpecKey>('general');
  const [dayPick, setDayPick] = useState<number | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [form, setForm] = useState({ patient: '', phone: '', payerId: 'cordillera' });
  const [confirmed, setConfirmed] = useState<Appointment | null>(null);

  useEffect(() => {
    if (preset) {
      setSpec(preset.spec);
      setSlot(null);
      setConfirmed(null);
    }
  }, [preset]);

  // Hasta que elijas un día, se muestra el primero abierto (hoy, salvo domingo o festivo).
  const dayIdx = dayPick ?? firstOpen;
  const day = days[dayIdx];
  const slots = slotsFor(spec, day.iso, today, store.now);
  const isMine = (time: string) => appointments.some((a) => a.spec === spec && a.date === day.iso && a.time === time);
  const price = priceFor(spec, payerOf(form.payerId).kind);
  const phoneOk = /^[0-9 +]{10,16}$/.test(form.phone.trim());
  const canConfirm = !!slot && form.patient.trim().length >= 3 && phoneOk;

  function confirm() {
    if (!canConfirm || !slot) return;
    const appt: Omit<Appointment, 'id' | 'status'> = {
      spec,
      date: day.iso,
      time: slot,
      patient: form.patient.trim(),
      phone: form.phone.trim(),
      payerId: form.payerId,
    };
    const id = store.addAppointment(appt);
    store.log('patient', 'apptBooked', { spec: { t: `specialties.${spec}` }, date: { d: day.iso }, time: slot, patient: appt.patient, code: id }, appt.patient);
    setConfirmed({ ...appt, id, status: 'booked' });
    setSlot(null);
  }

  function messageFor(a: Pick<Appointment, 'patient' | 'spec' | 'date' | 'time' | 'id'>) {
    return t(a.date === today ? 'scheduling.waToday' : 'scheduling.waVideo', {
      name: a.patient.split(' ')[0],
      spec: t(`specialties.${a.spec}`),
      pro: specOf(a.spec).pro,
      date: fmtDate(a.date, loc, names, { weekday: true }),
      time: a.time,
      code: a.id,
    });
  }

  async function copy(a: Appointment) {
    try {
      await navigator.clipboard.writeText(messageFor(a));
      notify(t('toasts.copied'));
    } catch {
      notify(t('toasts.copyFailed'), 'warn');
    }
  }

  const dayLabel = (st: string) =>
    st === 'holiday' ? t('scheduling.holiday') : st === 'sunday' ? t('scheduling.closed') : st === 'saturday' ? t('scheduling.morning') : '';

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card variant="bordered" padding="md" className="lg:col-span-2 min-w-0">
        <CardHeader>
          <CardTitle>{t('scheduling.title')}</CardTitle>
          <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
            {t('scheduling.subtitle', { date: fmtDate(today, loc, names, { weekday: true, year: true }), time: store.now })}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="sched-spec" className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                {t('scheduling.specialty')}
              </label>
              <select
                id="sched-spec"
                value={spec}
                onChange={(e) => {
                  setSpec(e.target.value as SpecKey);
                  setSlot(null);
                }}
                className="w-full rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white px-3 py-2.5 text-sm"
              >
                {SPECIALTIES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {t(`specialties.${s.key}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">{t('scheduling.professional')}</p>
              <p className="rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800/50 px-3 py-2.5 text-sm text-secondary-900 dark:text-white truncate">
                {specOf(spec).pro}
              </p>
            </div>
            <div>
              <p className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">{t('scheduling.modality')}</p>
              <p className="rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800/50 px-3 py-2.5 text-sm text-secondary-900 dark:text-white truncate">
                {t('scheduling.modalityValue')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {days.map((d, i) => {
              const closed = d.status === 'holiday' || d.status === 'sunday';
              return (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => {
                    setDayPick(i);
                    setSlot(null);
                  }}
                  disabled={closed}
                  aria-pressed={dayIdx === i}
                  className={`p-2 rounded-lg text-center border transition-colors ${
                    closed
                      ? 'bg-secondary-100 dark:bg-secondary-800/60 border-secondary-200 dark:border-secondary-700 text-secondary-400 cursor-not-allowed'
                      : dayIdx === i
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white dark:bg-secondary-800 border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-200 hover:border-primary-400'
                  }`}
                >
                  <p className="text-[10px] uppercase opacity-80">{names.weekdays[weekdayOf(d.iso)]}</p>
                  <p className="text-sm font-semibold">{fmtDate(d.iso, loc, names)}</p>
                  <p className="text-[9px] leading-tight min-h-[11px]">
                    {i === 0 ? `${t('scheduling.today')}${dayLabel(d.status) ? ` · ${dayLabel(d.status)}` : ''}` : dayLabel(d.status)}
                  </p>
                </button>
              );
            })}
          </div>

          <div>
            <p className="text-sm font-semibold text-secondary-900 dark:text-white mb-2">{t('scheduling.slots')}</p>
            {slots.length === 0 ? (
              <p className="text-sm text-secondary-500">{t('scheduling.noSlots')}</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
                {slots.map((s) => {
                  const mine = isMine(s.time);
                  const unavailable = s.taken || mine;
                  return (
                    <button
                      key={s.time}
                      type="button"
                      onClick={() => setSlot(s.time)}
                      disabled={unavailable}
                      aria-pressed={slot === s.time}
                      aria-label={`${s.time} · ${mine ? t('scheduling.mine') : s.taken ? t('scheduling.taken') : t('scheduling.free')}`}
                      className={`px-2 py-2 rounded-lg text-sm font-medium border ${
                        mine
                          ? 'bg-sky-100 dark:bg-sky-900/40 border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-200 cursor-not-allowed'
                          : s.taken
                            ? 'bg-secondary-100 dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700 text-secondary-400 line-through cursor-not-allowed'
                            : slot === s.time
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white dark:bg-secondary-800 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                      }`}
                    >
                      {s.time}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="mt-2 text-[11px] text-secondary-500 dark:text-secondary-400">{t('scheduling.legend')}</p>
          </div>

          {slot && (
            <div className="rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/20 p-3 space-y-3">
              <p className="text-sm font-semibold text-secondary-900 dark:text-white">
                {t('scheduling.bookingFor', { spec: t(`specialties.${spec}`), date: fmtDate(day.iso, loc, names, { weekday: true }), time: slot })}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  label={t('scheduling.patientName')}
                  value={form.patient}
                  onChange={(e) => setForm({ ...form, patient: e.target.value })}
                  placeholder={t('scheduling.patientPh')}
                />
                <Input
                  label={t('scheduling.phone')}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="300 000 0000"
                  inputMode="tel"
                  error={form.phone && !phoneOk ? t('scheduling.phoneError') : undefined}
                />
                <div>
                  <label htmlFor="sched-payer" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    {t('scheduling.payer')}
                  </label>
                  <select
                    id="sched-payer"
                    value={form.payerId}
                    onChange={(e) => setForm({ ...form, payerId: e.target.value })}
                    className="w-full rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white px-3 py-2.5 text-sm"
                  >
                    {PAYERS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {tx(p.name, loc)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-secondary-700 dark:text-secondary-200">
                {t(`scheduling.price.${payerOf(form.payerId).kind}`, { amount: fmtCOP(price.patient, loc), value: fmtCOP(price.value, loc) })}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setSlot(null)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={confirm} disabled={!canConfirm}>
                  {t('scheduling.confirm')}
                </Button>
              </div>
            </div>
          )}

          {confirmed && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 space-y-2">
              <p className="flex items-center gap-2 font-semibold">
                <CheckCircleIcon className="w-5 h-5 shrink-0" /> {t('scheduling.confirmedTitle', { code: confirmed.id })}
              </p>
              <div className="rounded-lg bg-white dark:bg-secondary-900 border border-emerald-200 dark:border-emerald-800 p-2.5 text-xs text-secondary-800 dark:text-secondary-100">
                <p className="text-[10px] uppercase tracking-wide text-secondary-500 mb-1">{t('scheduling.waPreview', { phone: confirmed.phone })}</p>
                <p>{messageFor(confirmed)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => copy(confirmed)}>
                  <ClipboardDocumentIcon className="w-4 h-4 mr-1" /> {t('scheduling.copy')}
                </Button>
                <SimTag>{t('scheduling.simSend')}</SimTag>
              </div>
              {confirmed.date === today ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white/70 dark:bg-secondary-900/60 p-2.5">
                  <p className="text-xs flex-1">{t('scheduling.todayNext')}</p>
                  <Button size="sm" onClick={() => onPreconsult(confirmed.id)}>
                    <UserIcon className="w-4 h-4 mr-1" /> {t('scheduling.doPreconsult')}
                  </Button>
                </div>
              ) : (
                <p className="text-xs">{t('scheduling.laterNext')}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="bordered" padding="md" className="min-w-0">
        <CardHeader>
          <CardTitle className="text-base">{t('scheduling.listTitle')}</CardTitle>
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">{t('scheduling.listSubtitle')}</p>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-sm text-secondary-500 dark:text-secondary-400">{t('scheduling.listEmpty')}</p>
          ) : (
            <ul className="space-y-2">
              {[...appointments]
                .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
                .map((a) => (
                  <li key={a.id} className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-2.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-secondary-900 dark:text-white truncate">{a.patient}</p>
                        <p className="text-secondary-600 dark:text-secondary-300">
                          {t(`specialties.${a.spec}`)} · {specOf(a.spec).pro}
                        </p>
                        <p className="text-secondary-500">
                          {fmtDate(a.date, loc, names, { weekday: true })} · {a.time} · {a.id}
                        </p>
                        <div className="mt-1">
                          <Badge size="sm" variant={STATUS_VARIANT[a.status]}>
                            {t(`scheduling.status.${a.status}`)}
                          </Badge>
                        </div>
                      </div>
                      {a.status === 'booked' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`${t('scheduling.cancelAppt')} ${a.id}`}
                          title={t('scheduling.cancelAppt')}
                          onClick={() => {
                            store.cancelAppointment(a.id);
                            store.log('patient', 'apptCancelled', { code: a.id }, a.patient);
                            if (confirmed?.id === a.id) setConfirmed(null);
                            notify(t('toasts.apptCancelled', { code: a.id }));
                          }}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {a.status === 'booked' && a.date === today && (
                      <Button size="sm" variant="outline" fullWidth className="mt-2" onClick={() => onPreconsult(a.id)}>
                        {t('scheduling.doPreconsult')}
                      </Button>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
