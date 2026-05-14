'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface Props {
  onAudit: (action: string, actor?: string) => void;
}

export default function PreconsultForm({ onAudit }: Props) {
  const t = useTranslations('demoTelemed');
  const [preForm, setPreForm] = useState({ reason: '', onset: '', intensity: 5, prev: '' });
  const [consents, setConsents] = useState({ tele: false, data: false, rec: false });
  const [preSubmitted, setPreSubmitted] = useState(false);

  return (
    <Card variant="bordered" padding="md">
      <CardHeader>
        <CardTitle>{t('preconsult.title')}</CardTitle>
        <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('preconsult.subtitle')}</p>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setPreSubmitted(true);
            onAudit('Formulario de pre-consulta enviado', 'Paciente');
            setTimeout(() => setPreSubmitted(false), 3000);
          }}
        >
          <Textarea
            label={`${t('preconsult.reason')} *`}
            value={preForm.reason}
            onChange={(e) => setPreForm({ ...preForm, reason: e.target.value })}
            placeholder={t('preconsult.reasonPh')}
            rows={3}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('preconsult.symptomsStart')}
              value={preForm.onset}
              onChange={(e) => setPreForm({ ...preForm, onset: e.target.value })}
              placeholder={t('preconsult.symptomsStartPh')}
            />
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                {t('preconsult.intensity')}: <span className="font-bold">{preForm.intensity}</span>
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={preForm.intensity}
                onChange={(e) => setPreForm({ ...preForm, intensity: Number(e.target.value) })}
                className="w-full"
                aria-label={t('preconsult.intensity')}
              />
            </div>
          </div>
          <Textarea
            label={t('preconsult.previousTreatment')}
            value={preForm.prev}
            onChange={(e) => setPreForm({ ...preForm, prev: e.target.value })}
            placeholder={t('preconsult.previousTreatmentPh')}
            rows={2}
          />
          <div>
            <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">{t('preconsult.consents')}</p>
            <div className="space-y-2">
              {(
                [
                  { k: 'tele', label: t('preconsult.consentTele') },
                  { k: 'data', label: t('preconsult.consentData') },
                  { k: 'rec', label: t('preconsult.consentRec') },
                ] as const
              ).map(({ k, label }) => (
                <label
                  key={k}
                  className="flex items-center gap-3 p-2 rounded-lg border border-secondary-200 dark:border-secondary-700 cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-800"
                >
                  <button
                    type="button"
                    role="switch"
                    aria-checked={consents[k]}
                    onClick={() => setConsents((c) => ({ ...c, [k]: !c[k] }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${consents[k] ? 'bg-emerald-500' : 'bg-secondary-300 dark:bg-secondary-600'}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${consents[k] ? 'translate-x-5' : ''}`}
                    />
                  </button>
                  <span className="text-sm text-secondary-700 dark:text-secondary-200">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" fullWidth disabled={!preForm.reason || !consents.tele || !consents.data}>
            {t('preconsult.submit')}
          </Button>
          {preSubmitted && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5" /> {t('preconsult.submitted')}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
