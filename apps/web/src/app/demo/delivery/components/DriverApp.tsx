'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { CheckCircleIcon, CameraIcon, PencilSquareIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid';
import { PhoneFrame } from './shared';

export default function DriverApp() {
  const t = useTranslations('demoDelivery');
  const [online, setOnline] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [navStep, setNavStep] = useState(0);
  const [podPhoto, setPodPhoto] = useState(false);
  const [podSigned, setPodSigned] = useState(false);
  const [kycStep, setKycStep] = useState(2);

  const navSteps = (t.raw('driver.navigation.steps') as string[]) || [];
  const ratings = (t.raw('driver.ratings.items') as string[]) || [];

  return (
    <PhoneFrame label="Driver">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{t('driver.header')}</h2>
            <p className="text-xs text-secondary-500 dark:text-secondary-400">
              {online ? t('driver.statusOnline') : t('driver.statusOffline')}
            </p>
          </div>
          <button onClick={() => setOnline(!online)} className={`relative h-7 w-14 rounded-full transition ${online ? 'bg-emerald-500' : 'bg-secondary-400'}`}>
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${online ? 'left-7' : 'left-0.5'}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Card padding="sm" variant="bordered">
            <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('driver.earnings.today')}</p>
            <p className="text-xl font-bold">$84.50</p>
            <p className="text-[10px] text-secondary-500 dark:text-secondary-400">
              {t('driver.earnings.trips', { n: 9 })} · {t('driver.earnings.hours', { h: '5.4' })}
            </p>
          </Card>
          <Card padding="sm" variant="bordered">
            <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('driver.earnings.week')}</p>
            <p className="text-xl font-bold">$612.20</p>
            <p className="text-[10px] text-secondary-500 dark:text-secondary-400">{t('driver.earnings.trips', { n: 67 })}</p>
          </Card>
        </div>

        <Card padding="sm" variant="bordered">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">{t('driver.nextPickup.title')}</h3>
            <Badge variant="primary" size="sm">
              <SparklesIcon className="h-3 w-3 mr-1" />{t('driver.batch.badge')}
            </Badge>
          </div>
          <p className="text-sm">{t('driver.nextPickup.store')}</p>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            {t('driver.nextPickup.items', { n: 3 })} · {t('driver.nextPickup.distance', { km: '2.1', min: 8 })}
          </p>
          {!accepted ? (
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" fullWidth>{t('driver.nextPickup.skip')}</Button>
              <Button size="sm" fullWidth onClick={() => setAccepted(true)}>{t('driver.nextPickup.accept')}</Button>
            </div>
          ) : (
            <Badge variant="success" size="sm" className="mt-2">
              <CheckCircleIcon className="h-3 w-3 mr-1" /> OK
            </Badge>
          )}
        </Card>

        <Card padding="sm" variant="bordered">
          <h3 className="text-sm font-semibold mb-2">{t('driver.batch.title')}</h3>
          <ol className="space-y-1 text-xs">
            {(['stop1', 'stop2', 'stop3', 'stop4'] as const).map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i < 2 ? 'bg-emerald-500 text-white' : 'bg-secondary-200 dark:bg-secondary-700'}`}>
                  {i + 1}
                </span>
                <span>{t(`driver.batch.${s}` as any)}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card padding="sm" variant="bordered">
          <h3 className="text-sm font-semibold mb-2">{t('driver.navigation.title')}</h3>
          <div className="space-y-1.5 text-xs">
            {navSteps.map((s, i) => (
              <div key={i} className={`flex items-start gap-2 rounded-lg px-2 py-1.5 ${i === navStep ? 'bg-primary-50 dark:bg-primary-900/30 font-semibold' : ''}`}>
                <span className="text-primary-600 dark:text-primary-400">▸</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" fullWidth className="mt-2" onClick={() => setNavStep((s) => (s + 1) % navSteps.length)}>
            {t('common.next')}
          </Button>
        </Card>

        <Card padding="sm" variant="bordered">
          <h3 className="text-sm font-semibold mb-2">{t('driver.pod.title')}</h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setPodPhoto(true)} className={`rounded-lg border-2 border-dashed p-3 flex flex-col items-center text-xs ${podPhoto ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-secondary-300 dark:border-secondary-600'}`}>
              <CameraIcon className="h-5 w-5 mb-1" />
              {podPhoto ? t('driver.pod.captured') : t('driver.pod.photo')}
            </button>
            <button onClick={() => setPodSigned(true)} className={`rounded-lg border-2 border-dashed p-3 flex flex-col items-center text-xs ${podSigned ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-secondary-300 dark:border-secondary-600'}`}>
              <PencilSquareIcon className="h-5 w-5 mb-1" />
              {podSigned ? t('driver.pod.signed') : t('driver.pod.signature')}
            </button>
          </div>
          <Button size="sm" fullWidth className="mt-2" disabled={!podPhoto || !podSigned}>
            {t('driver.pod.submit')}
          </Button>
        </Card>

        <Card padding="sm" variant="bordered">
          <h3 className="text-sm font-semibold mb-2">{t('driver.ratings.title')}</h3>
          <ul className="text-xs space-y-1 text-secondary-700 dark:text-secondary-300">
            {ratings.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </Card>

        <Card padding="sm" variant="bordered">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">{t('driver.kyc.title')}</h3>
            <Badge variant="success" size="sm">
              <ShieldCheckIcon className="h-3 w-3 mr-1" />{t('driver.kyc.uploadedBadge')}
            </Badge>
          </div>
          <div className="space-y-1.5 text-xs">
            {(['step1', 'step2', 'step3', 'step4'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                {i < kycStep ? <CheckSolid className="h-4 w-4 text-emerald-500" /> : <div className="h-4 w-4 rounded-full border-2 border-secondary-300 dark:border-secondary-600" />}
                <span className={i < kycStep ? 'line-through text-secondary-400' : ''}>{t(`driver.kyc.${s}` as any)}</span>
              </div>
            ))}
          </div>
          {kycStep < 4 && (
            <Button size="sm" variant="outline" fullWidth className="mt-2" onClick={() => setKycStep((s) => s + 1)}>
              {t('common.next')}
            </Button>
          )}
        </Card>
      </div>
    </PhoneFrame>
  );
}
