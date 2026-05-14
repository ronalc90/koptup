'use client';

import { useTranslations } from 'next-intl';

export interface RetentionPolicy {
  policyKey: 'p3' | 'p7' | 'p10' | 'perm';
  worm: boolean;
  hold: boolean;
  expires: string;
}

/**
 * Devuelve la política asociada a una carpeta. Mock determinista por nombre.
 */
export function getPolicyForFolder(folder: string): RetentionPolicy | null {
  const name = folder.toLowerCase();
  if (name.includes('contrato')) return { policyKey: 'p10', worm: true, hold: false, expires: '2036-01-01' };
  if (name.includes('factura')) return { policyKey: 'p7', worm: true, hold: false, expires: '2033-12-31' };
  if (name.includes('rrhh') || name.includes('hr')) return { policyKey: 'perm', worm: true, hold: true, expires: '—' };
  if (name.includes('market')) return { policyKey: 'p3', worm: false, hold: false, expires: '2029-06-30' };
  return null;
}

interface RetentionBadgesProps {
  folder: string;
  size?: 'sm' | 'xs';
}

/**
 * Pequeños chips por carpeta: política de retención + WORM + Legal Hold.
 * Verde OK · ámbar warning · rojo legal hold.
 */
export default function RetentionBadges({ folder, size = 'xs' }: RetentionBadgesProps) {
  const t = useTranslations('demoDocsPro');
  const policy = getPolicyForFolder(folder);
  if (!policy) return null;

  const baseCls =
    size === 'sm'
      ? 'text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-semibold'
      : 'text-[9px] px-1.5 py-0.5 rounded-full font-semibold';

  return (
    <span className="inline-flex items-center gap-1 flex-wrap" aria-label={t('folderBadges.policyShort')}>
      <span
        className={`${baseCls} bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900`}
        title={`${t('folderBadges.policyShort')}: ${t(`retention.policies.${policy.policyKey}`)}`}
      >
        {t(`retention.policies.${policy.policyKey}`)}
      </span>
      {policy.worm && (
        <span
          className={`${baseCls} bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900`}
          title={t('folderBadges.worm')}
        >
          {t('folderBadges.worm')}
        </span>
      )}
      {policy.hold && (
        <span
          className={`${baseCls} bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900`}
          title={t('folderBadges.hold')}
        >
          {t('folderBadges.hold')}
        </span>
      )}
    </span>
  );
}
