'use client';

import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import type { Segment } from './data';
import { CashbackConfig, MissionsConfig, PointsConfig, ReferralsConfig, SweepstakesConfig, TiersConfig } from './ConfigProgram';
import { AlliesConfig, CampaignsConfig, ExperimentsConfig, FraudConfig } from './ConfigOps';

export type AdminTab = 'points' | 'tiers' | 'missions' | 'referrals' | 'cashback' | 'sweepstakes' | 'campaigns' | 'allies' | 'fraud' | 'experiments';
export const ADMIN_TABS: AdminTab[] = ['points', 'tiers', 'missions', 'referrals', 'cashback', 'sweepstakes', 'campaigns', 'allies', 'fraud', 'experiments'];

export default function AdminView({
  sub,
  onSub,
  prefillSegment,
  onPrefillUsed,
}: {
  sub: AdminTab;
  onSub: (s: AdminTab) => void;
  prefillSegment: Segment | null;
  onPrefillUsed: () => void;
}) {
  const t = useTranslations('demoLoyalty');
  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-bold text-secondary-900 dark:text-white">{t('config.title')}</h2>
        <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('config.subtitle')}</p>
        <div className="flex flex-wrap gap-2 mt-4" role="tablist" aria-label={t('config.title')}>
          {ADMIN_TABS.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={sub === k}
              onClick={() => onSub(k)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                sub === k ? 'bg-primary-600 text-white' : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
              }`}
            >
              {t(`config.tabs.${k}`)}
            </button>
          ))}
        </div>
      </Card>

      {sub === 'points' && <PointsConfig />}
      {sub === 'tiers' && <TiersConfig />}
      {sub === 'missions' && <MissionsConfig />}
      {sub === 'referrals' && <ReferralsConfig />}
      {sub === 'cashback' && <CashbackConfig />}
      {sub === 'sweepstakes' && <SweepstakesConfig />}
      {sub === 'campaigns' && <CampaignsConfig prefillSegment={prefillSegment} onPrefillUsed={onPrefillUsed} />}
      {sub === 'allies' && <AlliesConfig />}
      {sub === 'fraud' && <FraudConfig />}
      {sub === 'experiments' && <ExperimentsConfig />}
    </div>
  );
}
