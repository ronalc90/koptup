'use client';

import { useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  BoltIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  PaperAirplaneIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  ActivityEvent,
  Deal,
  REF_DATE,
  isOpen,
  probabilityOf,
  recommendationsFor,
  scoreFactors,
  scoreOf,
  temperatureOf,
  timelineFor,
} from './crm';
import { Note, PlanBadge, SectionHeader, inputCls, labelCls } from './ui';
import { CrmText, useCrmText } from './useCrmText';

type DraftChannel = 'email' | 'whatsapp';
type Objective = 'intro' | 'followUp' | 'proposal' | 'reEngage' | 'closing';
type Tone = 'professional' | 'friendly' | 'direct' | 'consultative';
type QuickId = 'summary' | 'nextStep' | 'objection' | 'callPrep';

const OBJECTIVES: Objective[] = ['intro', 'followUp', 'proposal', 'reEngage', 'closing'];
const TONES: Tone[] = ['professional', 'friendly', 'direct', 'consultative'];
const QUICK: QuickId[] = ['summary', 'nextStep', 'objection', 'callPrep'];

const lowerFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/** Objetivo sugerido según la etapa del negocio. */
function suggestedObjective(d: Deal): Objective {
  if (d.stage === 'prospect') return 'intro';
  if (d.stage === 'proposal') return 'followUp';
  if (d.stage === 'negotiation') return 'closing';
  return 'followUp';
}

interface Draft {
  channel: DraftChannel;
  subject: string;
  body: string;
}

function buildDraft(
  tx: CrmText,
  d: Deal,
  opts: { channel: DraftChannel; objective: Objective; tone: Tone; context: string; variant: number },
): Draft {
  const { t } = tx;
  const seller = t('data.seller');
  const owner = tx.ownerName(d);
  const params = {
    name: d.contactName.split(' ')[0],
    owner,
    seller,
    company: d.company,
    city: d.city,
    title: tx.title(d),
    value: tx.money(d.value),
    nextAction: lowerFirst(tx.nextAction(d) || t('newDeal.defaultNextAction')),
    since: tx.date(d.lastContact),
  };
  const greeting = t(`assistant.tpl.greeting.${opts.tone}`, params);
  const body = t(`assistant.tpl.body.${opts.objective}.${opts.variant % 2 === 0 ? 'a' : 'b'}`, params);
  const ctx = opts.context.trim() ? t('assistant.tpl.context', { context: opts.context.trim() }) : '';
  const cta = t(`assistant.tpl.cta.${opts.objective}`);
  if (opts.channel === 'whatsapp') {
    const text = [greeting, body, ctx, cta].filter(Boolean).join(' ');
    return { channel: 'whatsapp', subject: '', body: `${text}\n\n${t('assistant.tpl.whatsappSign', params)}` };
  }
  const toneLine =
    opts.tone === 'friendly' || opts.tone === 'consultative' ? t(`assistant.tpl.toneLine.${opts.tone}`) : '';
  const parts = [
    greeting,
    [body, ctx].filter(Boolean).join(' '),
    toneLine,
    cta,
    `${t(`assistant.tpl.signoff.${opts.tone}`)}\n${t('assistant.tpl.signature', params)}`,
  ].filter(Boolean);
  return {
    channel: 'email',
    subject: t(`assistant.tpl.subject.${opts.objective}`, params),
    body: parts.join('\n\n'),
  };
}

interface Props {
  deals: Deal[];
  events: ActivityEvent[];
  initialDealId: string | null;
  onSent: (dealId: string, channel: DraftChannel, preview: string) => void;
}

export default function AssistantView({ deals, events, initialDealId, onSent }: Props) {
  const tx = useCrmText();
  const { t } = tx;
  const selectable = useMemo(() => [...deals.filter(isOpen), ...deals.filter((d) => !isOpen(d))], [deals]);
  const firstDeal = selectable.find((d) => d.id === initialDealId) ?? selectable[0];

  const [dealId, setDealId] = useState<string>(firstDeal?.id ?? '');
  const deal = deals.find((d) => d.id === dealId) ?? selectable[0];
  const [channel, setChannel] = useState<DraftChannel>(firstDeal?.channel === 'email' ? 'email' : 'whatsapp');
  const [objective, setObjective] = useState<Objective>(firstDeal ? suggestedObjective(firstDeal) : 'followUp');
  const [tone, setTone] = useState<Tone>('professional');
  const [context, setContext] = useState('');
  const [variant, setVariant] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'error'>('idle');
  const [quick, setQuick] = useState<QuickId | null>(null);

  if (!deal) return null;

  const selectDeal = (id: string) => {
    const d = deals.find((x) => x.id === id);
    setDealId(id);
    setDraft(null);
    setQuick(null);
    if (d) {
      setChannel(d.channel === 'email' ? 'email' : 'whatsapp');
      setObjective(suggestedObjective(d));
    }
  };

  const generate = (nextVariant: number) => {
    setVariant(nextVariant);
    setDraft(buildDraft(tx, deal, { channel, objective, tone, context, variant: nextVariant }));
    setCopyState('idle');
  };

  const copy = async () => {
    if (!draft) return;
    const text = draft.channel === 'email' ? `${t('assistant.subject')}: ${draft.subject}\n\n${draft.body}` : draft.body;
    try {
      await navigator.clipboard.writeText(text);
      setCopyState('ok');
    } catch {
      setCopyState('error');
    }
    setTimeout(() => setCopyState('idle'), 2500);
  };

  const send = () => {
    if (!draft) return;
    const flat = (draft.channel === 'email' ? draft.subject : draft.body).replace(/\s+/g, ' ').trim();
    const preview = flat.length > 70 ? `${flat.slice(0, 70)}…` : flat;
    onSent(deal.id, draft.channel, preview);
  };

  const quickOutput = (): { head: string; lines: string[] } | null => {
    if (!quick) return null;
    const name = deal.contactName.split(' ')[0];
    if (quick === 'summary') {
      const items = timelineFor(deal, events).slice(0, 4);
      return {
        head: t('assistant.quickOut.summaryHead', {
          name: deal.contactName,
          stage: t(`stages.${deal.stage}`),
          value: tx.moneyShort(deal.value),
          prob: probabilityOf(deal),
        }),
        lines: items.map((e) => `${tx.date(e.date)}: ${tx.eventText(e)}`),
      };
    }
    if (quick === 'nextStep') {
      return {
        head: t('assistant.quickOut.nextStepHead', { name }),
        lines: recommendationsFor(deal).map((r) => tx.recText(r)),
      };
    }
    if (quick === 'objection') {
      return {
        head: t('assistant.quickOut.objectionHead', { name, value: tx.moneyShort(deal.value) }),
        lines: [
          t('assistant.quickOut.objection1', { phase: tx.moneyShort(deal.value * 0.4) }),
          t('assistant.quickOut.objection2', { advance: tx.moneyShort(deal.value * 0.3) }),
          t('assistant.quickOut.objection3'),
          t('assistant.quickOut.objection4'),
        ],
      };
    }
    const factors = scoreFactors(deal);
    const strong = [...factors].sort((a, b) => b.points / b.max - a.points / a.max)[0];
    const score = scoreOf(deal);
    const lines = [
      t('assistant.quickOut.prepScore', {
        score,
        temp: t(`temperature.${temperatureOf(score)}`),
        factor: lowerFirst(tx.factorLabel(deal, strong)),
      }),
      t('assistant.quickOut.prepLast', { ago: tx.ago(deal.lastContact), channel: t(`channels.${deal.channel}`) }),
      t('assistant.quickOut.prepPending', { action: tx.nextAction(deal) || t('newDeal.defaultNextAction') }),
    ];
    if (!deal.budgetConfirmed) lines.push(t('assistant.quickOut.askBudget'));
    if (!deal.decisionMaker) lines.push(t('assistant.quickOut.askDecision'));
    return { head: t('assistant.quickOut.prepHead', { name }), lines };
  };
  const out = quickOutput();

  return (
    <div>
      <SectionHeader
        title={t('assistant.title')}
        subtitle={t('assistant.subtitle')}
        aside={<PlanBadge label={t('plans.advanced')} hint={t('plans.advancedAssistantHint')} />}
      />
      <Note>{t('assistant.simulatedNote')}</Note>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-4 sm:p-5 min-w-0">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="crm-as-contact" className={labelCls}>
                {t('assistant.contact')}
              </label>
              <select id="crm-as-contact" value={deal.id} onChange={(e) => selectDeal(e.target.value)} className={inputCls}>
                {selectable.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.contactName} · {d.company} ({t(`stages.${d.stage}`)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="crm-as-channel" className={labelCls}>
                  {t('assistant.channel')}
                </label>
                <select id="crm-as-channel" value={channel} onChange={(e) => setChannel(e.target.value as DraftChannel)} className={inputCls}>
                  <option value="whatsapp">{t('channels.whatsapp')}</option>
                  <option value="email">{t('channels.email')}</option>
                </select>
              </div>
              <div>
                <label htmlFor="crm-as-objective" className={labelCls}>
                  {t('assistant.objective')}
                </label>
                <select id="crm-as-objective" value={objective} onChange={(e) => setObjective(e.target.value as Objective)} className={inputCls}>
                  {OBJECTIVES.map((o) => (
                    <option key={o} value={o}>
                      {t(`assistant.objectives.${o}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="crm-as-tone" className={labelCls}>
                  {t('assistant.tone')}
                </label>
                <select id="crm-as-tone" value={tone} onChange={(e) => setTone(e.target.value as Tone)} className={inputCls}>
                  {TONES.map((tn) => (
                    <option key={tn} value={tn}>
                      {t(`assistant.tones.${tn}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="crm-as-context" className={labelCls}>
                {t('assistant.context')}
              </label>
              <textarea
                id="crm-as-context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={2}
                maxLength={240}
                placeholder={t('assistant.contextPlaceholder')}
                className={`${inputCls} resize-none`}
              />
            </div>

            <Button onClick={() => generate(0)} fullWidth className="gap-2">
              <SparklesIcon className="h-5 w-5" aria-hidden="true" />
              {draft ? t('assistant.generateAgain') : t('assistant.generate')}
            </Button>

            {!draft ? (
              <p className="text-sm text-secondary-500 text-center py-4">{t('assistant.empty')}</p>
            ) : (
              <div className="rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/40 dark:bg-primary-950/30 p-3 sm:p-4" data-testid="crm-draft">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <Badge variant="primary" size="sm">
                    {t('assistant.draftLabel', { channel: t(`channels.${draft.channel}`) })}
                  </Badge>
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="ghost" onClick={copy} className="gap-1.5">
                      {copyState === 'ok' ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" aria-hidden="true" />
                      ) : (
                        <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
                      )}
                      {copyState === 'ok' ? t('assistant.copied') : t('assistant.copy')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => generate(variant + 1)} className="gap-1.5">
                      <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                      {t('assistant.regenerate')}
                    </Button>
                  </div>
                </div>
                {copyState === 'error' && <p className="text-xs text-red-600 mb-2">{t('assistant.copyError')}</p>}
                {draft.channel === 'email' && (
                  <div className="mb-2">
                    <label htmlFor="crm-as-subject" className={labelCls}>
                      {t('assistant.subject')}
                    </label>
                    <input
                      id="crm-as-subject"
                      value={draft.subject}
                      onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                )}
                <label htmlFor="crm-as-body" className={labelCls}>
                  {t('assistant.body')}
                </label>
                <textarea
                  id="crm-as-body"
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  rows={draft.channel === 'email' ? 12 : 6}
                  className={`${inputCls} font-sans leading-relaxed`}
                />
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                  <span className="text-xs text-secondary-500">{t('assistant.chars', { count: draft.body.length })}</span>
                  <Button size="sm" onClick={send} className="gap-1.5">
                    <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
                    {t('assistant.send')}
                  </Button>
                </div>
                <p className="text-xs text-secondary-500 mt-2">
                  {t('assistant.sendHint', { date: tx.date(REF_DATE) })}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-4 sm:p-5 min-w-0">
          <h3 className="font-semibold text-secondary-900 dark:text-white mb-1 flex items-center gap-2">
            <BoltIcon className="h-5 w-5 text-yellow-500" aria-hidden="true" />
            {t('assistant.quickActions')}
          </h3>
          <p className="text-xs text-secondary-500 mb-3">{t('assistant.quickHint', { name: deal.contactName })}</p>
          <div className="space-y-2">
            {QUICK.map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={quick === a}
                onClick={() => setQuick(quick === a ? null : a)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors text-sm ${
                  quick === a
                    ? 'border-primary-500 bg-primary-50 text-primary-800 dark:bg-primary-950/40 dark:text-primary-200'
                    : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 text-secondary-700 dark:text-secondary-300'
                }`}
              >
                {t(`assistant.quick.${a}`)}
              </button>
            ))}
          </div>
          {out && (
            <div className="mt-4 rounded-lg bg-secondary-50 dark:bg-secondary-800/60 p-3" aria-live="polite" data-testid="crm-quick-output">
              <p className="text-sm font-semibold text-secondary-900 dark:text-white mb-2">{out.head}</p>
              <ul className="space-y-1.5">
                {out.lines.map((l, i) => (
                  <li key={i} className="flex gap-2 text-sm text-secondary-700 dark:text-secondary-300">
                    <span className="text-primary-600 dark:text-primary-400" aria-hidden="true">•</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
