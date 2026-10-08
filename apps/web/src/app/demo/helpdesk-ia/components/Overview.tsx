'use client';

import { BoltIcon, CheckCircleIcon, ClockIcon, CpuChipIcon, ExclamationTriangleIcon, InboxStackIcon, SparklesIcon, StarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import type { Metrics } from './engine';
import type { IncomingResult } from './useHelpdeskStore';
import type { HdText } from './useHelpdeskText';

export function MetricsRow({ hd, m }: { hd: HdText; m: Metrics }) {
  const { t } = hd;
  const cards = [
    {
      icon: InboxStackIcon,
      label: t('metrics.active'),
      value: String(m.active),
      sub: t('metrics.activeSub', { count: m.unassigned }),
      hint: t('metrics.activeHint'),
    },
    {
      icon: ExclamationTriangleIcon,
      label: t('metrics.breached'),
      value: String(m.breached),
      sub: t('metrics.breachedSub', { count: m.atRisk }),
      hint: t('metrics.breachedHint'),
      alert: m.breached > 0,
    },
    {
      icon: ClockIcon,
      label: t('metrics.frt'),
      value: m.avgFirstResponse === null ? '—' : hd.duration(m.avgFirstResponse),
      sub: t('metrics.frtSub', { count: m.responded }),
      hint: t('metrics.frtHint'),
    },
    {
      icon: StarIcon,
      label: t('metrics.csat'),
      value: m.csat === null ? '—' : `${hd.decimal(m.csat)}/5`,
      sub: m.nps === null ? t('metrics.csatEmpty') : t('metrics.csatSub', { nps: m.nps, count: m.surveys }),
      hint: t('metrics.csatHint'),
    },
    {
      icon: CpuChipIcon,
      label: t('metrics.auto'),
      value: m.autoTotal ? hd.pct(m.autoSent / m.autoTotal) : '—',
      sub: t('metrics.autoSub', { sent: m.autoSent, total: m.autoTotal }),
      hint: t('metrics.autoHint'),
    },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <Card key={i} variant="bordered" padding="sm" className={`min-w-0 ${i === 4 ? 'col-span-2 lg:col-span-1' : ''}`} title={c.hint}>
            <Icon className={`h-5 w-5 mb-1.5 ${c.alert ? 'text-red-600 dark:text-red-400' : 'text-primary-600 dark:text-primary-400'}`} aria-hidden="true" />
            <p className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white truncate">{c.value}</p>
            <p className="text-xs font-medium text-secondary-700 dark:text-secondary-300 mt-0.5">{c.label}</p>
            <p className="text-[11px] text-secondary-500 mt-0.5">{c.sub}</p>
          </Card>
        );
      })}
    </div>
  );
}

function Step({ n, icon, children }: { n: number; icon?: ReactNode; children: ReactNode }) {
  return (
    <p className="text-secondary-700 dark:text-secondary-300 flex items-start gap-1.5">
      <span className="font-medium flex-shrink-0">{n}.</span>
      {icon && <span className="flex-shrink-0 mt-0.5">{icon}</span>}
      <span className="min-w-0">{children}</span>
    </p>
  );
}

export function RoutingBanner({ hd, result, onClose, onOpen }: { hd: HdText; result: IncomingResult; onClose: () => void; onOpen: () => void }) {
  const { t, tx } = hd;
  const c = result.classification;
  const r = result.route;
  return (
    <div className="mb-4" role="status">
      <Card variant="bordered" padding="sm" className="border-primary-300 dark:border-primary-700 bg-primary-50/60 dark:bg-primary-950/30">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5 text-sm">
            <p className="flex items-center gap-2 font-semibold text-primary-700 dark:text-primary-200">
              <SparklesIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {t('routing.incoming', { id: result.ticketId })}
            </p>
            <Step n={1}>
              {t('routing.classified', {
                area: t(`categories.${c.category}`),
                sentiment: t(`sentiments.${c.sentiment}`),
                priority: t(`priorities.${c.priority}`),
                language: t(`languages.${c.language}`),
                confidence: hd.pct(c.confidence),
              })}
            </Step>
            <Step n={2} icon={<BoltIcon className="h-4 w-4" aria-hidden="true" />}>
              {result.macros.length ? t('routing.macros', { names: result.macros.map((n) => tx(n)).join(', ') }) : t('routing.noMacros')}
            </Step>
            <Step n={3} icon={<CpuChipIcon className="h-4 w-4" aria-hidden="true" />}>
              {t(`routing.auto.${result.decision}`)}
            </Step>
            <Step n={4} icon={<CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />}>
              {result.decision === 'sent'
                ? t('routing.autoAnswered')
                : r
                  ? t('routing.assigned', {
                      agent: hd.agentName(r.agent),
                      required: r.required.length ? r.required.map((s) => t(`skills.${s}`)).join(' + ') : t('routing.anySkill'),
                      candidates: r.candidates.map((x) => t('routing.candidate', { name: hd.agentName(x.id), load: x.load })).join(', '),
                    })
                  : t('routing.assignedByMacro', { agent: hd.agentName(result.assignee) })}
              {result.priority !== c.priority && (
                <Badge variant="warning" size="sm" className="ml-1.5">
                  {t('routing.priorityChanged', { priority: t(`priorities.${result.priority}`) })}
                </Badge>
              )}
            </Step>
            <button type="button" onClick={onOpen} className="text-xs font-medium text-primary-700 dark:text-primary-300 hover:underline">
              {t('routing.open')}
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="p-1 rounded-md text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800 flex-shrink-0"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </Card>
    </div>
  );
}
