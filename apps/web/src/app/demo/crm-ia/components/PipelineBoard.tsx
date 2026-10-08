'use client';

import { useMemo, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  ALL_STAGES,
  Deal,
  OWNERS,
  OWNER_IDS,
  OwnerId,
  StageId,
  isOpen,
  probabilityOf,
  scoreOf,
  temperatureOf,
  weightedValue,
} from './crm';
import { SectionHeader, inputCls } from './ui';
import { useCrmText } from './useCrmText';

const TEMP_DOT = { hot: 'bg-red-500', warm: 'bg-yellow-500', cold: 'bg-blue-400' } as const;

const STAGE_ACCENT: Record<StageId, string> = {
  prospect: 'border-t-secondary-400',
  qualified: 'border-t-blue-500',
  proposal: 'border-t-indigo-500',
  negotiation: 'border-t-amber-500',
  won: 'border-t-green-500',
  lost: 'border-t-red-400',
};

interface Props {
  deals: Deal[];
  onOpen: (id: string) => void;
  onMove: (id: string, stage: StageId) => void;
  onNew: () => void;
}

export default function PipelineBoard({ deals, onOpen, onMove, onNew }: Props) {
  const tx = useCrmText();
  const { t } = tx;
  const [owner, setOwner] = useState<'all' | OwnerId>('all');
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<StageId | null>(null);

  const visible = useMemo(
    () => (owner === 'all' ? deals : deals.filter((d) => d.owner === owner)),
    [deals, owner],
  );

  const byStage = useMemo(() => {
    const map = new Map<StageId, Deal[]>(ALL_STAGES.map((s) => [s, []]));
    for (const d of visible) map.get(d.stage)?.push(d);
    map.forEach((list) => list.sort((a, b) => b.value - a.value));
    return map;
  }, [visible]);

  const drop = (stage: StageId) => {
    if (dragId) onMove(dragId, stage);
    setDragId(null);
    setOverStage(null);
  };

  return (
    <div>
      <SectionHeader
        title={t('pipeline.title')}
        subtitle={t('pipeline.subtitle')}
        aside={
          <>
            <label className="sr-only" htmlFor="crm-owner-filter">
              {t('pipeline.ownerFilter')}
            </label>
            <select
              id="crm-owner-filter"
              value={owner}
              onChange={(e) => setOwner(e.target.value as 'all' | OwnerId)}
              className={`${inputCls} pr-8 sm:w-auto`}
            >
              <option value="all">{t('pipeline.allOwners')}</option>
              {OWNER_IDS.map((id) => (
                <option key={id} value={id}>
                  {OWNERS[id].name}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={onNew} className="gap-1.5 whitespace-nowrap">
              <PlusIcon className="h-4 w-4" aria-hidden="true" />
              {t('pipeline.newDeal')}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {ALL_STAGES.map((stage) => {
          const list = byStage.get(stage) ?? [];
          const total = list.reduce((s, d) => s + d.value, 0);
          const weighted = list.reduce((s, d) => s + weightedValue(d), 0);
          const open = stage !== 'won' && stage !== 'lost';
          return (
            <section
              key={stage}
              aria-label={t(`stages.${stage}`)}
              data-stage={stage}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (overStage !== stage) setOverStage(stage);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOverStage(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                drop(stage);
              }}
              className={`min-w-0 rounded-xl border border-t-4 ${STAGE_ACCENT[stage]} p-2.5 flex flex-col transition-colors ${
                overStage === stage
                  ? 'bg-primary-50 border-primary-300 dark:bg-primary-950/40 dark:border-primary-700'
                  : 'bg-secondary-50 border-secondary-200 dark:bg-secondary-900/60 dark:border-secondary-800'
              }`}
            >
              <div className="mb-2.5 px-0.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-sm leading-tight text-secondary-900 dark:text-white">
                    {t(`stages.${stage}`)}
                  </h3>
                  <Badge variant="outline" size="sm">
                    {list.length}
                  </Badge>
                </div>
                <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-0.5">
                  {tx.moneyShort(total)}
                  {open && list.length > 0 && (
                    <span className="text-secondary-500"> · {t('pipeline.weightedShort', { value: tx.moneyShort(weighted) })}</span>
                  )}
                </p>
              </div>

              <div className="space-y-2 flex-1 min-h-[96px]">
                {list.length === 0 ? (
                  <p className="text-center py-6 text-xs text-secondary-500 italic">
                    {overStage === stage ? t('pipeline.dropHere') : t('pipeline.empty')}
                  </p>
                ) : (
                  list.map((d) => {
                    const score = scoreOf(d);
                    const temp = temperatureOf(score);
                    const prob = probabilityOf(d);
                    return (
                      <article
                        key={d.id}
                        draggable
                        data-deal={d.id}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', d.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setDragId(d.id);
                        }}
                        onDragEnd={() => {
                          setDragId(null);
                          setOverStage(null);
                        }}
                        className={`rounded-lg bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
                          dragId === d.id ? 'opacity-50' : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onOpen(d.id)}
                          className="w-full text-left p-2.5 pb-1.5 rounded-t-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                          aria-label={t('pipeline.openCard', { company: d.company })}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <p className="font-medium text-sm text-secondary-900 dark:text-white line-clamp-2 break-words">
                              {d.company}
                            </p>
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${TEMP_DOT[temp]}`}
                              title={t('pipeline.scoreTitle', { score, temp: t(`temperature.${temp}`) })}
                              aria-hidden="true"
                            />
                          </div>
                          <p className="text-xs text-secondary-600 dark:text-secondary-400 truncate">{d.contactName}</p>
                          <p className="text-xs text-secondary-500 truncate mt-0.5">{tx.title(d)}</p>
                          <div className="flex flex-wrap items-center justify-between gap-x-2 text-xs mt-2">
                            <span className="font-bold text-primary-700 dark:text-primary-300 whitespace-nowrap">{tx.moneyShort(d.value)}</span>
                            {isOpen(d) ? (
                              <span className="text-secondary-600 dark:text-secondary-300 whitespace-nowrap" title={t('pipeline.probabilityHint')}>
                                {tx.pct(prob)}
                              </span>
                            ) : (
                              <span className="text-secondary-500 whitespace-nowrap">{tx.date(d.closeDate)}</span>
                            )}
                          </div>
                          {isOpen(d) && (
                            <div className="mt-1.5 h-1 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                              <div className="h-full bg-primary-600 dark:bg-primary-400 transition-all" style={{ width: `${prob}%` }} />
                            </div>
                          )}
                          {d.stage === 'lost' && d.lostReason && (
                            <p className="text-[11px] text-red-700 dark:text-red-300 mt-1 truncate">
                              {t(`lostReasons.${d.lostReason}`)}
                            </p>
                          )}
                        </button>
                        <div className="px-2.5 pb-2.5">
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) onMove(d.id, e.target.value as StageId);
                            }}
                            aria-label={t('pipeline.moveToLabel', { company: d.company })}
                            className="w-full text-xs px-2 py-1 rounded-md border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">{t('pipeline.moveTo')}</option>
                            {ALL_STAGES.filter((s) => s !== d.stage).map((s) => (
                              <option key={s} value={s}>
                                {t(`stages.${s}`)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
      <p className="text-xs text-secondary-500 mt-3">{t('pipeline.probabilityHint')}</p>
    </div>
  );
}
