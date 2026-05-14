'use client';

import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';
import { QueuePatient, avatarColor, initials } from './types';

export function Tile({ label, value, unit, warn }: { label: string; value: string; unit: string; warn?: boolean }) {
  return (
    <div className={`p-2 rounded-lg border ${warn ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' : 'border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800/40'}`}>
      <p className="text-[10px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">{label}</p>
      <p className={`text-base font-bold ${warn ? 'text-red-600 dark:text-red-300' : 'text-secondary-900 dark:text-white'}`}>
        {value} <span className="text-[10px] font-normal text-secondary-500 dark:text-secondary-400">{unit}</span>
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400 mb-1.5">{title}</p>
      {children}
    </div>
  );
}

export default function PatientRecordPanel({ patient }: { patient: QueuePatient }) {
  const t = useTranslations('demoTelemed');
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarColor(patient.name)} flex items-center justify-center text-white font-bold`}>
          {initials(patient.name)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-secondary-900 dark:text-white truncate">{patient.name}</p>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            {patient.age} {t('patientRecord.age')} · {patient.blood} · {patient.insurance}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-xs">
        <Tile label={t('patientRecord.hr')} value={`${patient.vitals.hr}`} unit={t('patientRecord.hrUnit')} warn={patient.vitals.hr > 100} />
        <Tile label={t('patientRecord.bp')} value={patient.vitals.bp} unit={t('patientRecord.bpUnit')} warn={parseInt(patient.vitals.bp) > 140} />
        <Tile label={t('patientRecord.spo2')} value={`${patient.vitals.spo2}`} unit={t('patientRecord.spo2Unit')} warn={patient.vitals.spo2 < 95} />
        <Tile label={t('patientRecord.temp')} value={`${patient.vitals.temp}`} unit={t('patientRecord.tempUnit')} warn={patient.vitals.temp > 37.8} />
      </div>
      <p className="text-[10px] text-secondary-400 dark:text-secondary-500 italic">
        {t('patientRecord.vitalsSource')} · Apple Health · {t('patientRecord.lastSync')}: {t('common.now')}
      </p>

      <Section title={t('patientRecord.allergies')}>
        {patient.allergies.length === 0 ? (
          <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('patientRecord.noAllergies')}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {patient.allergies.map((a) => (
              <Badge key={a} variant="danger" size="sm">{a}</Badge>
            ))}
          </div>
        )}
      </Section>

      <Section title={t('patientRecord.history')}>
        <div className="flex flex-wrap gap-1.5">
          {patient.history.map((h) => (
            <Badge key={h} variant="info" size="sm">{h}</Badge>
          ))}
        </div>
      </Section>

      <Section title={t('patientRecord.meds')}>
        {patient.meds.length === 0 ? (
          <p className="text-xs text-secondary-500 dark:text-secondary-400">—</p>
        ) : (
          <ul className="space-y-1">
            {patient.meds.map((m, i) => (
              <li key={i} className="text-xs text-secondary-700 dark:text-secondary-200">
                <span className="font-medium">{m.name}</span> · {m.dose} · {m.freq}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={t('patientRecord.consultations')}>
        <ul className="space-y-1.5">
          {patient.pastConsults.map((c, i) => (
            <li key={i} className="text-xs">
              <p className="text-secondary-900 dark:text-white font-medium">
                {c.specialty} <span className="font-normal text-secondary-500 dark:text-secondary-400">· {c.date}</span>
              </p>
              <p className="text-secondary-600 dark:text-secondary-300">{c.notes}</p>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
