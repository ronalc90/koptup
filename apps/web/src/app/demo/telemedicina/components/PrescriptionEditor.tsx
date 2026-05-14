'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { PlusIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { QueuePatient, RxMed } from './types';

interface Props {
  patient: QueuePatient | null;
  onAudit: (action: string) => void;
}

export default function PrescriptionEditor({ patient, onAudit }: Props) {
  const t = useTranslations('demoTelemed');
  const [rxDiagnosis, setRxDiagnosis] = useState('');
  const [rxMeds, setRxMeds] = useState<RxMed[]>([]);
  const [rxSigned, setRxSigned] = useState(false);
  const [rxSent, setRxSent] = useState(false);
  const rxPharmacy = 'Cruz Verde · Sucursal Chapinero';
  const [rxHistory, setRxHistory] = useState<{ id: string; date: string; patient: string; meds: number }[]>([
    { id: 'RX-2026-0148', date: '2026-05-12', patient: 'Juan Sánchez', meds: 2 },
    { id: 'RX-2026-0142', date: '2026-05-09', patient: 'Sofía Ramírez', meds: 1 },
  ]);

  function addMed() {
    setRxMeds((m) => [...m, { id: `med-${Date.now()}`, name: '', dose: '', freq: '', duration: '', instructions: '' }]);
  }
  function updateMed(id: string, k: keyof RxMed, v: string) {
    setRxMeds((m) => m.map((x) => (x.id === id ? { ...x, [k]: v } : x)));
  }
  function removeMed(id: string) {
    setRxMeds((m) => m.filter((x) => x.id !== id));
  }

  function signRx() {
    if (!rxMeds.length || !patient) return;
    setRxSigned(true);
    onAudit('Receta firmada digitalmente (RSA-2048 + timestamp)');
  }

  function sendToPharmacy() {
    if (!rxSigned || !patient) return;
    setRxSent(true);
    const id = `RX-2026-${(rxHistory.length + 149).toString().padStart(4, '0')}`;
    setRxHistory((h) => [{ id, date: new Date().toISOString().slice(0, 10), patient: patient.name, meds: rxMeds.length }, ...h]);
    onAudit(`Receta ${id} enviada a farmacia ${rxPharmacy}`);
    setTimeout(() => {
      setRxMeds([]);
      setRxSigned(false);
      setRxSent(false);
      setRxDiagnosis('');
    }, 2200);
  }

  return (
    <Card variant="bordered" padding="md">
      <CardHeader>
        <CardTitle>{t('prescription.title')}</CardTitle>
        <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('prescription.subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">{t('prescription.patient')}</label>
            <Input value={patient?.name || ''} readOnly placeholder="—" />
          </div>
          <Input
            label={t('prescription.diagnosis')}
            value={rxDiagnosis}
            onChange={(e) => setRxDiagnosis(e.target.value)}
            placeholder={t('prescription.diagnosisPh')}
          />
        </div>
        <div className="space-y-2">
          {rxMeds.length === 0 && (
            <p className="text-sm text-secondary-500 dark:text-secondary-400 italic">{t('prescription.noMeds')}</p>
          )}
          {rxMeds.map((m) => (
            <div key={m.id} className="p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50/50 dark:bg-secondary-800/40 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={m.name}
                  onChange={(e) => updateMed(m.id, 'name', e.target.value)}
                  placeholder={t('prescription.medPh')}
                  aria-label={t('prescription.med')}
                />
                <Button variant="ghost" size="sm" onClick={() => removeMed(m.id)} aria-label={t('prescription.remove')}>
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input value={m.dose} onChange={(e) => updateMed(m.id, 'dose', e.target.value)} placeholder={t('prescription.dosePh')} aria-label={t('prescription.dose')} />
                <Input value={m.freq} onChange={(e) => updateMed(m.id, 'freq', e.target.value)} placeholder={t('prescription.frequencyPh')} aria-label={t('prescription.frequency')} />
                <Input value={m.duration} onChange={(e) => updateMed(m.id, 'duration', e.target.value)} placeholder={t('prescription.durationPh')} aria-label={t('prescription.duration')} />
              </div>
              <Input
                value={m.instructions}
                onChange={(e) => updateMed(m.id, 'instructions', e.target.value)}
                placeholder={t('prescription.instructionsPh')}
                aria-label={t('prescription.instructions')}
              />
            </div>
          ))}
        </div>
        <Button variant="outline" fullWidth onClick={addMed}>
          <PlusIcon className="w-4 h-4 mr-1" />
          {t('prescription.addMed')}
        </Button>
        <div className="flex gap-2">
          <Button onClick={signRx} disabled={!rxMeds.length || !patient || rxSigned} variant={rxSigned ? 'secondary' : 'primary'} className="flex-1">
            {rxSigned ? (
              <>
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                {t('prescription.signed')}
              </>
            ) : (
              t('prescription.sign')
            )}
          </Button>
          <Button onClick={sendToPharmacy} disabled={!rxSigned || rxSent} className="flex-1">
            {t('prescription.sendPharmacy')}
          </Button>
        </div>
        {rxSent && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5" /> {t('prescription.sent')} · {rxPharmacy}
          </div>
        )}
        <div className="pt-3 border-t border-secondary-200 dark:border-secondary-700">
          <p className="text-xs uppercase tracking-wide text-secondary-500 dark:text-secondary-400 mb-2">{t('prescription.history')}</p>
          <ul className="space-y-1.5">
            {rxHistory.slice(0, 3).map((r) => (
              <li key={r.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-secondary-50 dark:bg-secondary-800/60">
                <span className="font-mono text-secondary-700 dark:text-secondary-200">{r.id}</span>
                <span className="text-secondary-600 dark:text-secondary-300">{r.patient}</span>
                <span className="text-secondary-500 dark:text-secondary-400">{r.date}</span>
                <Badge size="sm" variant="success">{r.meds} med.</Badge>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
