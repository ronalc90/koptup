'use client';

import { useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { avatarColor, fmtDate, fmtDec, initials, payerOf, tx } from './logic';
import { useDateNames, useLoc } from './ui';
import type { Patient } from './types';

function Tile({ label, value, unit, warn }: { label: string; value: string; unit: string; warn?: boolean }) {
  return (
    <div
      className={`p-2 rounded-lg border ${
        warn
          ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
          : 'border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800/40'
      }`}
    >
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

export default function PatientRecordPanel({ patient }: { patient: Patient }) {
  const t = useTranslations('demoTelemed');
  const loc = useLoc();
  const names = useDateNames();
  const v = patient.vitals;
  const pre = patient.preconsult;
  const sys = v.bp ? parseInt(v.bp, 10) : 0;

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 shrink-0 rounded-full bg-gradient-to-br ${avatarColor(patient.name)} flex items-center justify-center text-white font-bold`}>
          {initials(patient.name)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-secondary-900 dark:text-white truncate">{patient.name}</p>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            {patient.age} {t('record.years')}
            {patient.sex ? ` · ${t(`record.sex.${patient.sex}`)}` : ''} · {patient.docType} {patient.doc}
          </p>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            {patient.blood ? `${t('record.blood')} ${patient.blood} · ` : ''}
            {tx(payerOf(patient.payerId).name, loc)}
          </p>
          {patient.guardian && <p className="text-xs text-secondary-600 dark:text-secondary-300">{tx(patient.guardian, loc)}</p>}
        </div>
      </div>

      {(v.hr || v.bp || v.spo2 || v.temp || v.glucose) && (
        <div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {v.hr !== undefined && <Tile label={t('record.hr')} value={`${v.hr}`} unit={t('record.hrUnit')} warn={v.hr > 100} />}
            {v.bp && <Tile label={t('record.bp')} value={v.bp} unit="mmHg" warn={sys >= 140} />}
            {v.spo2 !== undefined && <Tile label="SpO₂" value={`${v.spo2}`} unit="%" warn={v.spo2 < 94} />}
            {v.temp !== undefined && <Tile label={t('record.temp')} value={fmtDec(v.temp, loc)} unit="°C" warn={v.temp >= 38} />}
            {v.glucose !== undefined && <Tile label={t('record.glucose')} value={`${v.glucose}`} unit="mg/dL" warn={v.glucose >= 180} />}
          </div>
          <p className="mt-1 text-[10px] text-secondary-500 dark:text-secondary-400 italic">{t(`record.vitalsSource.${v.source}`)}</p>
        </div>
      )}

      <Section title={t('record.preconsult')}>
        {!pre ? (
          <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('record.noPreconsult')}</p>
        ) : (
          <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-2 space-y-1 text-xs">
            <p className="text-secondary-800 dark:text-secondary-100">{tx(pre.reason, loc)}</p>
            <p className="text-secondary-500 dark:text-secondary-400">
              {t('record.onset')}: {tx(pre.onset, loc) || '—'} · {t('record.intensity')}: {pre.intensity}/10
            </p>
            {tx(pre.prev, loc) && (
              <p className="text-secondary-500 dark:text-secondary-400">
                {t('record.prev')}: {tx(pre.prev, loc)}
              </p>
            )}
            <div className="flex flex-wrap gap-1 pt-1">
              {(
                [
                  ['consentTele', pre.consentTele],
                  ['consentData', pre.consentData],
                  ['consentRec', pre.consentRec],
                ] as const
              ).map(([k, ok]) => (
                <span
                  key={k}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    ok
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                      : 'bg-secondary-100 text-secondary-600 dark:bg-secondary-800 dark:text-secondary-300'
                  }`}
                >
                  {ok ? <CheckCircleIcon className="w-3 h-3" /> : <XCircleIcon className="w-3 h-3" />}
                  {t(`record.${k}`)}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-secondary-400">{t('record.preconsultAt', { time: pre.at })}</p>
          </div>
        )}
      </Section>

      <Section title={t('record.allergies')}>
        {patient.allergies.length === 0 ? (
          <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('record.noAllergies')}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {patient.allergies.map((a, i) => (
              <Badge key={i} variant="danger" size="sm">
                {tx(a.label, loc)}
              </Badge>
            ))}
          </div>
        )}
      </Section>

      <Section title={t('record.history')}>
        {patient.history.length === 0 ? (
          <p className="text-xs text-secondary-500 dark:text-secondary-400">—</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {patient.history.map((h, i) => (
              <Badge key={i} variant="info" size="sm">
                {tx(h, loc)}
              </Badge>
            ))}
          </div>
        )}
      </Section>

      <Section title={t('record.meds')}>
        {patient.meds.length === 0 ? (
          <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('record.noMeds')}</p>
        ) : (
          <ul className="space-y-1">
            {patient.meds.map((m, i) => (
              <li key={i} className="text-xs text-secondary-700 dark:text-secondary-200">
                <span className="font-medium">{tx(m.name, loc)}</span> · {m.dose} · {tx(m.freq, loc)}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={t('record.pastConsults')}>
        {patient.pastConsults.length === 0 ? (
          <p className="text-xs text-secondary-500 dark:text-secondary-400">—</p>
        ) : (
          <ul className="space-y-1.5">
            {patient.pastConsults.map((c, i) => (
              <li key={i} className="text-xs">
                <p className="text-secondary-900 dark:text-white font-medium">
                  {t(`specialties.${c.spec}`)}{' '}
                  <span className="font-normal text-secondary-500 dark:text-secondary-400">· {fmtDate(c.date, loc, names, { year: true })}</span>
                </p>
                <p className="text-secondary-600 dark:text-secondary-300">{tx(c.notes, loc)}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
