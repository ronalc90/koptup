'use client';

import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, PauseCircleIcon, ScaleIcon } from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import type { Ticket } from './data';
import { slaInfo } from './engine';
import type { HdText } from './useHelpdeskText';

/** Estado del SLA (minutos corridos) o del término PQRS (días hábiles). */
export default function SlaBadge({ hd, ticket, clock }: { hd: HdText; ticket: Ticket; clock: number }) {
  const { t } = hd;
  const s = slaInfo(ticket, clock);
  const cls = 'whitespace-nowrap gap-1';
  if (s.kind === 'resolved') {
    return (
      <Badge variant="success" size="sm" className={cls}>
        <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
        {t('statuses.resolved')}
      </Badge>
    );
  }
  if (s.kind === 'waiting') {
    return (
      <Badge variant="default" size="sm" className={cls} title={t('sla.waitingHint')}>
        <PauseCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
        {t('sla.waiting')}
      </Badge>
    );
  }
  if (s.kind === 'pqrs') {
    const { daysLeft } = s.info;
    const variant = daysLeft < 0 ? 'danger' : daysLeft <= 3 ? 'warning' : 'info';
    const label =
      daysLeft < 0 ? t('sla.pqrsOverdue', { n: -daysLeft }) : daysLeft === 0 ? t('sla.pqrsToday') : t('sla.pqrsLeft', { n: daysLeft });
    return (
      <Badge variant={variant} size="sm" className={cls} title={t('sla.pqrsHint')}>
        <ScaleIcon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </Badge>
    );
  }
  const { remaining } = s;
  if (remaining <= 0) {
    return (
      <Badge variant="danger" size="sm" className={cls} title={t('sla.policyHint')}>
        <ExclamationTriangleIcon className="h-3.5 w-3.5" aria-hidden="true" />
        {t('sla.breached', { time: hd.duration(-remaining) })}
      </Badge>
    );
  }
  const variant = remaining <= 15 ? 'danger' : remaining <= 60 ? 'warning' : 'info';
  return (
    <Badge variant={variant} size="sm" className={cls} title={t('sla.policyHint')}>
      <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
      {t(s.kind === 'first' ? 'sla.firstIn' : 'sla.resolutionIn', { time: hd.duration(remaining) })}
    </Badge>
  );
}
