'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface Props {
  onAudit: (action: string, actor?: string) => void;
}

interface Slot {
  time: string;
  taken?: boolean;
}

export default function SchedulingPanel({ onAudit }: Props) {
  const t = useTranslations('demoTelemed');
  const specialties = useMemo(
    () => [
      { key: 'general', label: t('specialties.general'), pro: 'Dr. Andrés Mejía' },
      { key: 'cardio', label: t('specialties.cardio'), pro: 'Dra. Patricia Vargas' },
      { key: 'derma', label: t('specialties.derma'), pro: 'Dr. Felipe Rojas' },
      { key: 'pedia', label: t('specialties.pedia'), pro: 'Dra. Laura Ríos' },
      { key: 'psych', label: t('specialties.psych'), pro: 'Dr. Iván Cárdenas' },
    ],
    [t],
  );

  const [schedSpec, setSchedSpec] = useState(specialties[0].key);
  const [schedDateOffset, setSchedDateOffset] = useState(0);
  const [schedModality, setSchedModality] = useState<'video' | 'phone' | 'inPerson'>('video');
  const [bookedSlots, setBookedSlots] = useState<Record<string, boolean>>({});
  const [bookingConfirmed, setBookingConfirmed] = useState<string | null>(null);

  const schedDates = useMemo(() => {
    const arr: { iso: string; label: string; weekday: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      arr.push({
        iso: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' }),
        weekday: d.toLocaleDateString(undefined, { weekday: 'short' }),
      });
    }
    return arr;
  }, []);

  const slotsForDay: Slot[] = useMemo(() => {
    const base = ['08:00', '08:30', '09:00', '09:30', '10:00', '11:00', '14:00', '14:30', '15:00', '16:00', '17:30'];
    const seed = (schedSpec + schedDateOffset).length + schedDateOffset * 3;
    return base.map((time, idx) => ({ time, taken: (idx + seed) % 4 === 0 }));
  }, [schedSpec, schedDateOffset]);

  function bookSlot(time: string) {
    const key = `${schedSpec}-${schedDates[schedDateOffset].iso}-${time}`;
    setBookedSlots((b) => ({ ...b, [key]: true }));
    const specLabel = specialties.find((s) => s.key === schedSpec)?.label;
    setBookingConfirmed(`${schedDates[schedDateOffset].label} · ${time} · ${specLabel}`);
    onAudit(`Cita reservada · ${specLabel} · ${schedDates[schedDateOffset].iso} ${time}`, 'Paciente');
    setTimeout(() => setBookingConfirmed(null), 3500);
  }

  return (
    <Card variant="bordered" padding="md">
      <CardHeader>
        <CardTitle>{t('scheduling.title')}</CardTitle>
        <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('scheduling.subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">{t('scheduling.specialty')}</label>
            <select
              value={schedSpec}
              onChange={(e) => setSchedSpec(e.target.value)}
              className="w-full rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white px-3 py-2.5 text-sm"
              aria-label={t('scheduling.specialty')}
            >
              {specialties.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">{t('scheduling.professional')}</label>
            <Input value={specialties.find((s) => s.key === schedSpec)?.pro || ''} readOnly />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">Modalidad</label>
            <div className="flex gap-1">
              {(['video', 'phone', 'inPerson'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setSchedModality(m)}
                  className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium border ${
                    schedModality === m
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white dark:bg-secondary-800 border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-200'
                  }`}
                >
                  {t(`scheduling.modalities.${m}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {schedDates.map((d, i) => (
            <button
              key={d.iso}
              onClick={() => setSchedDateOffset(i)}
              className={`p-2 rounded-lg text-center border transition-colors ${
                schedDateOffset === i
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white dark:bg-secondary-800 border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-200 hover:border-primary-400'
              }`}
            >
              <p className="text-[10px] uppercase opacity-80">{d.weekday}</p>
              <p className="text-sm font-semibold">{d.label}</p>
            </button>
          ))}
        </div>

        <div>
          <p className="text-sm font-semibold text-secondary-900 dark:text-white mb-2">{t('scheduling.slots')}</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
            {slotsForDay.map((s) => {
              const key = `${schedSpec}-${schedDates[schedDateOffset].iso}-${s.time}`;
              const isBooked = s.taken || bookedSlots[key];
              return (
                <button
                  key={s.time}
                  onClick={() => !isBooked && bookSlot(s.time)}
                  disabled={isBooked}
                  aria-label={`${s.time} ${isBooked ? t('scheduling.booked') : t('scheduling.book')}`}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                    isBooked
                      ? 'bg-secondary-100 dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700 text-secondary-400 line-through cursor-not-allowed'
                      : 'bg-white dark:bg-secondary-800 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                  }`}
                >
                  {s.time}
                </button>
              );
            })}
          </div>
        </div>

        {bookingConfirmed && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
            <CheckCircleIcon className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">{t('scheduling.confirmedTitle')}</p>
              <p className="text-sm">{bookingConfirmed}</p>
              <p className="text-xs opacity-80 mt-0.5">{t('scheduling.confirmedMsg')}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
