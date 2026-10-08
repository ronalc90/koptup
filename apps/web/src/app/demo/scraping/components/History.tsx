'use client';

import { Fragment, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDownIcon, ChevronRightIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { dateTime, num, pct } from '../lib/format';
import { useDemo } from '../lib/store';
import type { SourceId } from '../lib/types';
import { LOG_COLORS, logText } from './RunNotice';
import { Chip, Panel, Section } from './ui';

export default function History({ sourceId }: { sourceId: SourceId }) {
  const t = useTranslations('demoScraping');
  const { loc, fullHistory } = useDemo();
  const [all, setAll] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const list = fullHistory.filter((h) => all || h.sourceId === sourceId);

  return (
    <Section
      title={t('history.title')}
      subtitle={t('history.subtitle')}
      right={
        <div className="flex gap-1" role="group" aria-label={t('history.scopeLabel')}>
          <Chip active={!all} onClick={() => setAll(false)}>{t('history.thisSource')}</Chip>
          <Chip active={all} onClick={() => setAll(true)}>{t('history.allSources')}</Chip>
        </div>
      }
    >
      <div className="overflow-x-auto rounded-xl border border-secondary-800">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-secondary-950 text-[11px] uppercase tracking-wider text-secondary-400">
            <tr>
              <th className="w-8 px-2 py-2" />
              <th className="px-3 py-2 text-left font-medium">{t('history.when')}</th>
              {all && <th className="px-3 py-2 text-left font-medium">{t('history.source')}</th>}
              <th className="px-3 py-2 text-left font-medium">{t('history.trigger')}</th>
              <th className="px-3 py-2 text-left font-medium">{t('history.status')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('history.records')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('history.changes')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('history.quality')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-800 bg-secondary-900">
            {list.map((h) => {
              const expanded = open === h.id;
              return (
                <Fragment key={h.id}>
                  <tr className="hover:bg-secondary-800/30">
                    <td className="px-2 py-2">
                      <button type="button" onClick={() => setOpen(expanded ? null : h.id)} aria-expanded={expanded} aria-label={t('history.toggleLog')} className="rounded p-0.5 text-secondary-400 hover:bg-secondary-800 hover:text-white">
                        {expanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-secondary-200">{dateTime(h.at, loc)}</td>
                    {all && <td className="px-3 py-2 text-xs text-secondary-300">{t(`sources.${h.sourceId}.short`)}</td>}
                    <td className="px-3 py-2 text-xs text-secondary-300">{t(`values.trigger.${h.trigger}`)}</td>
                    <td className="px-3 py-2 text-xs">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${h.status === 'ok' ? 'bg-emerald-500/15 text-emerald-200' : h.status === 'partial' ? 'bg-amber-500/15 text-amber-200' : 'bg-rose-500/15 text-rose-200'}`}>
                        {t(`values.runStatus.${h.status}`)}
                      </span>
                      {h.noteKey && <span className="mt-1 block text-[11px] text-secondary-400">{t(`history.notes.${h.noteKey}`)}</span>}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-secondary-200">{num(h.records, loc)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-secondary-200">{num(h.changes, loc)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-secondary-200">{pct(h.quality, loc, Number.isInteger(h.quality) ? 0 : 1)}</td>
                  </tr>
                  {expanded && (
                    <tr className="bg-black">
                      <td colSpan={all ? 8 : 7} className="px-4 py-3">
                        <ol className="space-y-0.5 font-mono text-[11px] leading-relaxed">
                          {h.log.map((l, i) => (
                            <li key={i} className={LOG_COLORS[l.level]}>
                              <span className="mr-2 text-secondary-600">{String(i + 1).padStart(2, '0')}</span>
                              {logText(t, l, loc)}
                            </li>
                          ))}
                        </ol>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <Panel className="flex items-start gap-3">
        <WrenchScrewdriverIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
        <div>
          <h3 className="text-sm font-semibold text-white">{t('history.repairTitle')}</h3>
          <p className="text-xs text-secondary-400">{t('history.repairText')}</p>
        </div>
      </Panel>
    </Section>
  );
}
