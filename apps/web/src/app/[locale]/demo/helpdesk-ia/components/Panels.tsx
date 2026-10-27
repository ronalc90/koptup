'use client';

import { BoltIcon, CpuChipIcon, PlusIcon, StarIcon, TrashIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { AutoLogEntry, Macro, MacroAction, MacroCondition, Settings, Survey } from './data';
import { csatByAgent, keywordList, wouldAutoReply } from './engine';
import { ChannelBadge, Note, sectionTitleCls } from './ui';
import type { HdText } from './useHelpdeskText';

function Switch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
        checked ? 'bg-primary-600' : 'bg-secondary-300 dark:bg-secondary-700'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Respuesta automática
// ---------------------------------------------------------------------------

const resultVariant: Record<AutoLogEntry['result'], 'success' | 'warning' | 'info' | 'default'> = {
  sent: 'success',
  belowThreshold: 'warning',
  notEligible: 'info',
  off: 'default',
};

export function AutoReplyPanel({
  hd,
  settings,
  log,
  onSettings,
  onOpenTicket,
}: {
  hd: HdText;
  settings: Settings;
  log: AutoLogEntry[];
  onSettings: (s: Partial<Settings>) => void;
  onOpenTicket: (id: string) => void;
}) {
  const { t } = hd;
  const preview = wouldAutoReply(log, settings.threshold);
  return (
    <Card variant="bordered" padding="md" className="min-w-0">
      <CardHeader className="mb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CpuChipIcon className="h-5 w-5 text-primary-600" aria-hidden="true" />
          {t('autoReply.title')}
        </CardTitle>
        <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">{t('autoReply.subtitle')}</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-sm text-secondary-700 dark:text-secondary-300">{t('autoReply.enable')}</span>
          <Switch checked={settings.autoReplyOn} onChange={() => onSettings({ autoReplyOn: !settings.autoReplyOn })} label={t('autoReply.enable')} />
        </div>
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1 text-xs">
            <label htmlFor="hd-threshold" className="text-secondary-700 dark:text-secondary-300">
              {t('autoReply.threshold')}
            </label>
            <span className="font-mono font-semibold text-primary-600 dark:text-primary-400">{hd.pct(settings.threshold)}</span>
          </div>
          <input
            id="hd-threshold"
            type="range"
            min={0.5}
            max={0.99}
            step={0.01}
            value={settings.threshold}
            onChange={(e) => onSettings({ threshold: parseFloat(e.target.value) })}
            className="w-full accent-primary-600"
          />
        </div>
        <p className="text-xs text-secondary-700 dark:text-secondary-300 mb-3" aria-live="polite">
          {t('autoReply.preview', { would: preview.would, eligible: preview.eligible, threshold: hd.pct(settings.threshold) })}
        </p>
        <p className={`${sectionTitleCls} mb-2`}>{t('autoReply.log')}</p>
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {log.length === 0 && <p className="text-xs text-secondary-500 italic">{t('autoReply.empty')}</p>}
          {log.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onOpenTicket(l.ticketId)}
              className="w-full p-2 rounded-md bg-secondary-50 dark:bg-secondary-800/60 text-xs text-left hover:bg-secondary-100 dark:hover:bg-secondary-800"
            >
              <span className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-secondary-500">{l.ticketId}</span>
                <ChannelBadge channel={l.channel} label={t(`channels.${l.channel}`)} />
                <span className="ml-auto font-mono text-secondary-500">{hd.pct(l.confidence)}</span>
              </span>
              <span className="flex items-center gap-2 mt-1">
                <span className="flex-1 min-w-0 truncate text-secondary-700 dark:text-secondary-300">{t(`categories.${l.category}`)}</span>
                <Badge variant={resultVariant[l.result]} size="sm" className="whitespace-nowrap">
                  {t(`autoReply.results.${l.result}`)}
                </Badge>
              </span>
            </button>
          ))}
        </div>
        <Note className="mt-3">{t('autoReply.note')}</Note>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Macros
// ---------------------------------------------------------------------------

export function describeCondition(hd: HdText, c: MacroCondition): string {
  const { t } = hd;
  switch (c.type) {
    case 'category':
      return t('macros.describe.category', { value: t(`categories.${c.value}`) });
    case 'channel':
      return t('macros.describe.channel', { value: t(`channels.${c.value}`) });
    case 'priorityAtLeast':
      return t('macros.describe.priorityAtLeast', { value: t(`priorities.${c.value}`) });
    case 'sentiment':
      return t('macros.describe.sentiment', { value: t(`sentiments.${c.value}`) });
    case 'keyword':
      return t('macros.describe.keyword', { value: keywordList(c.value).join(' / ') });
  }
}

export function describeAction(hd: HdText, a: MacroAction): string {
  const { t } = hd;
  switch (a.type) {
    case 'assign':
      return t('macros.describe.assign', { agent: hd.agentName(a.value) });
    case 'priority':
      return t('macros.describe.priority', { value: t(`priorities.${a.value}`) });
    case 'tag':
      return t('macros.describe.tag', { value: a.value });
    case 'ack':
      return t('macros.describe.ack');
  }
}

export function MacrosPanel({
  hd,
  macros,
  onCreate,
  onToggle,
  onDelete,
}: {
  hd: HdText;
  macros: Macro[];
  onCreate: () => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { t, tx } = hd;
  return (
    <Card variant="bordered" padding="md" className="min-w-0">
      <CardHeader className="mb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BoltIcon className="h-5 w-5 text-primary-600" aria-hidden="true" />
          {t('macros.title')}
        </CardTitle>
        <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">{t('macros.subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-2 max-h-[26rem] overflow-y-auto pr-1">
          {macros.length === 0 && <p className="text-xs text-secondary-500 italic">{t('macros.empty')}</p>}
          {macros.map((m) => (
            <div
              key={m.id}
              className={`p-2.5 rounded-lg border text-xs transition-colors ${
                m.active ? 'border-secondary-200 dark:border-secondary-700' : 'border-dashed border-secondary-300 dark:border-secondary-700 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-semibold text-secondary-900 dark:text-white truncate">{tx(m.name)}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Switch checked={m.active} onChange={() => onToggle(m.id)} label={t('macros.toggle', { name: tx(m.name) })} />
                  <button
                    type="button"
                    onClick={() => onDelete(m.id)}
                    aria-label={t('macros.delete', { name: tx(m.name) })}
                    className="p-1 rounded-md text-secondary-500 hover:text-red-600 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                  >
                    <TrashIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="flex items-start gap-2 mb-1">
                <Badge variant="outline" size="sm" className="text-[10px] flex-shrink-0">
                  {t('macros.if')}
                </Badge>
                <span className="text-secondary-700 dark:text-secondary-300">
                  {m.conditions.map((c) => describeCondition(hd, c)).join(` ${t('macros.and')} `)}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="primary" size="sm" className="text-[10px] flex-shrink-0">
                  {t('macros.then')}
                </Badge>
                <span className="text-secondary-700 dark:text-secondary-300">{m.actions.map((a) => describeAction(hd, a)).join(' + ')}</span>
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[10px] text-secondary-500">
                <span>{m.auto ? t('macros.auto') : t('macros.manual')}</span>
                <span>{t('macros.runs', { count: m.runs })}</span>
              </div>
            </div>
          ))}
        </div>
        <Button size="sm" variant="outline" fullWidth onClick={onCreate}>
          <PlusIcon className="h-4 w-4 mr-1" aria-hidden="true" />
          {t('macros.create')}
        </Button>
        <Note>{t('macros.note')}</Note>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// CSAT / NPS
// ---------------------------------------------------------------------------

export function CsatPanel({
  hd,
  surveys,
  surveyTicketId,
  onOpenSurvey,
}: {
  hd: HdText;
  surveys: Survey[];
  /** Ticket resuelto para el que se puede responder la encuesta (o null). */
  surveyTicketId: string | null;
  onOpenSurvey: () => void;
}) {
  const { t, tx } = hd;
  const avg = surveys.length ? surveys.reduce((s, x) => s + x.score, 0) / surveys.length : null;
  const promoters = surveys.filter((s) => s.nps >= 9).length;
  const detractors = surveys.filter((s) => s.nps <= 6).length;
  const nps = surveys.length ? Math.round(((promoters - detractors) / surveys.length) * 100) : null;
  const byAgent = csatByAgent(surveys);
  const comments = surveys.filter((s) => (typeof s.comment === 'string' ? s.comment.trim() : true)).slice(0, 3);

  return (
    <Card variant="bordered" padding="md" className="min-w-0">
      <CardHeader className="mb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <StarIcon className="h-5 w-5 text-primary-600" aria-hidden="true" />
          {t('csat.title')}
        </CardTitle>
        <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">{t('csat.subtitle')}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
          <div className="rounded-lg bg-secondary-50 dark:bg-secondary-800/60 p-2">
            <p className="text-lg font-bold text-secondary-900 dark:text-white">{avg === null ? '—' : hd.decimal(avg)}</p>
            <p className="text-[10px] text-secondary-500">{t('csat.average')}</p>
          </div>
          <div className="rounded-lg bg-secondary-50 dark:bg-secondary-800/60 p-2" title={t('csat.npsHint')}>
            <p className="text-lg font-bold text-secondary-900 dark:text-white">{nps === null ? '—' : nps}</p>
            <p className="text-[10px] text-secondary-500">{t('csat.nps')}</p>
          </div>
          <div className="rounded-lg bg-secondary-50 dark:bg-secondary-800/60 p-2">
            <p className="text-lg font-bold text-secondary-900 dark:text-white">{surveys.length}</p>
            <p className="text-[10px] text-secondary-500">{t('csat.surveys')}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" fullWidth onClick={onOpenSurvey} disabled={!surveyTicketId} className="mb-1">
          <StarIcon className="h-4 w-4 mr-1" aria-hidden="true" />
          {surveyTicketId ? t('csat.open', { id: surveyTicketId }) : t('csat.openDisabled')}
        </Button>
        {!surveyTicketId && <p className="text-[11px] text-secondary-500 mb-2">{t('csat.openHint')}</p>}
        <p className={`${sectionTitleCls} mt-3 mb-2`}>{t('csat.byAgent')}</p>
        <div className="space-y-2">
          {byAgent.map((a) => (
            <div key={a.agent} className="flex items-center gap-2 text-sm">
              <span className="flex-1 min-w-0 text-secondary-700 dark:text-secondary-300 truncate">{hd.agentName(a.agent)}</span>
              <span className="flex items-center gap-0.5" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((s) => (
                  <StarSolid key={s} className={`h-3.5 w-3.5 ${a.count && s <= Math.round(a.avg) ? 'text-yellow-500' : 'text-secondary-300 dark:text-secondary-700'}`} />
                ))}
              </span>
              <span className="font-mono font-semibold text-secondary-900 dark:text-white text-xs w-8 text-right">{a.count ? hd.decimal(a.avg) : '—'}</span>
              <span className="text-[10px] text-secondary-500 w-16 text-right">{t('csat.count', { count: a.count })}</span>
            </div>
          ))}
        </div>
        {comments.length > 0 && (
          <>
            <p className={`${sectionTitleCls} mt-3 mb-1.5`}>{t('csat.comments')}</p>
            <ul className="space-y-1.5">
              {comments.map((s) => (
                <li key={s.id} className="text-xs text-secondary-700 dark:text-secondary-300">
                  <span className="text-yellow-600 dark:text-yellow-400 font-semibold">{s.score}★</span> «{tx(s.comment)}»{' '}
                  <span className="text-secondary-500">— {s.ticketId}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <Note className="mt-3">{t('csat.note')}</Note>
      </CardContent>
    </Card>
  );
}
