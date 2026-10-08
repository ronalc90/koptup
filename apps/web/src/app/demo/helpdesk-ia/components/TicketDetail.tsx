'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUturnLeftIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  LanguageIcon,
  PaperAirplaneIcon,
  ScaleIcon,
  StarIcon,
  TagIcon,
  UserCircleIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {
  AGENTS,
  CATEGORIES,
  KB_ARTICLES,
  PQRS_TYPES,
  PRIORITIES,
  type AgentId,
  type Category,
  type KbArticle,
  type Macro,
  type PqrsType,
  type Priority,
  type Ticket,
} from './data';
import { classify, matchKeywords, normalize } from './engine';
import AiDraftPanel from './AiDraftPanel';
import SlaBadge from './SlaBadge';
import { ChannelBadge, Note, PriorityBadge, sectionTitleCls, smallInputCls } from './ui';
import type { HdText } from './useHelpdeskText';

interface Props {
  hd: HdText;
  ticket: Ticket;
  clock: number;
  customerText: string;
  macros: Macro[];
  draft: string;
  onDraft: (text: string) => void;
  onSend: () => void;
  onCustomerReply: () => void;
  onNote: (text: string) => void;
  onResolve: () => void;
  onReopen: () => void;
  onAssign: (agent: AgentId | null) => void;
  onAutoAssign: () => void;
  onPriority: (p: Priority) => void;
  onCategory: (c: Category) => void;
  onEscalate: () => void;
  onPqrs: (type: PqrsType | null) => void;
  onApplyMacro: (macroId: string) => void;
  onSurvey: () => void;
  hasSurvey: boolean;
  onInsertArticle: (a: KbArticle) => void;
}

export default function TicketDetail(props: Props) {
  const { hd, ticket, clock, customerText, macros, draft, onDraft } = props;
  const { t, tx } = hd;
  const [noteDraft, setNoteDraft] = useState('');
  const [macroId, setMacroId] = useState('');
  const conversationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNoteDraft('');
    setMacroId('');
  }, [ticket.id]);

  useEffect(() => {
    const el = conversationRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [ticket.id, ticket.messages.length]);

  const c = useMemo(() => classify(customerText), [customerText]);

  const templates = useMemo(() => {
    const norm = normalize(customerText);
    return KB_ARTICLES.filter((a) => a.category === ticket.category)
      .map((a) => ({ a, score: matchKeywords(norm, a.tags).length }))
      .sort((x, y) => y.score - x.score)
      .slice(0, 2)
      .map((x) => x.a);
  }, [ticket.category, customerText]);

  const resolved = ticket.status === 'resolved';
  const activeMacros = macros.filter((m) => m.active);

  const saveNote = () => {
    if (!noteDraft.trim()) return;
    props.onNote(noteDraft.trim());
    setNoteDraft('');
  };

  const authorLabel = (m: Ticket['messages'][number]) => {
    if (m.from === 'customer') return t('detail.customerRole');
    if (m.from === 'bot') return t(m.kind === 'autoReply' ? 'detail.autoReplyRole' : 'detail.ackRole');
    return hd.agentName(m.author ?? null);
  };

  return (
    <Card variant="bordered" padding="none" className="overflow-hidden">
      {/* Encabezado */}
      <div className="p-4 sm:p-5 border-b border-secondary-200 dark:border-secondary-700 space-y-3">
        <div className="flex flex-col gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              <span className="text-xs font-mono text-secondary-500">{ticket.id}</span>
              <ChannelBadge channel={ticket.channel} label={t(`channels.${ticket.channel}`)} />
              <PriorityBadge priority={ticket.priority} label={t(`priorities.${ticket.priority}`)} />
              <Badge variant={resolved ? 'success' : ticket.status === 'pending' ? 'warning' : 'info'} size="sm">
                {t(`statuses.${ticket.status}`)}
              </Badge>
              <SlaBadge hd={hd} ticket={ticket} clock={clock} />
              {c.language !== hd.lang && (
                <Badge variant="outline" size="sm" className="text-secondary-600 dark:text-secondary-300 gap-1">
                  <LanguageIcon className="h-3 w-3" aria-hidden="true" />
                  {t(`languages.${c.language}`)}
                </Badge>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-secondary-900 dark:text-white break-words">{tx(ticket.subject)}</h2>
            <p className="text-xs text-secondary-500 mt-1 break-words">
              {ticket.customer} · {ticket.contact} · {ticket.city} · {t(`brands.${ticket.brand}`)}
            </p>
            <p className="text-xs text-secondary-500 mt-0.5">
              {t('detail.created', { date: hd.dateTime(ticket.createdAt), ago: hd.ago(ticket.createdAt, clock) })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {resolved ? (
              <>
                <Button size="sm" variant="outline" onClick={props.onReopen}>
                  <ArrowUturnLeftIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                  {t('detail.reopen')}
                </Button>
                <Button size="sm" variant="outline" onClick={props.onSurvey}>
                  <StarIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                  {props.hasSurvey ? t('detail.surveyAgain') : t('detail.survey')}
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={props.onResolve}>
                  <CheckCircleIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                  {t('detail.resolve')}
                </Button>
                <Button size="sm" variant="ghost" onClick={props.onEscalate}>
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                  {t('detail.escalate')}
                </Button>
              </>
            )}
          </div>
        </div>

        {ticket.pqrs && (
          <p className="text-xs flex items-center gap-1.5 text-amber-800 dark:text-amber-200">
            <ScaleIcon className="h-4 w-4" aria-hidden="true" />
            {t('detail.pqrsInfo', {
              type: t(`pqrs.types.${ticket.pqrs.type}`),
              radicado: ticket.pqrs.radicado,
              date: hd.date(ticket.pqrs.filedDay),
            })}
          </p>
        )}
        {ticket.escalation && (
          <p className="text-xs flex items-start gap-1.5 text-red-700 dark:text-red-300">
            <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>
              {t('detail.escalatedInfo', { target: t(`escalate.targets.${ticket.escalation.target}`), ago: hd.ago(ticket.escalation.at, clock) })}
              {ticket.escalation.reason ? ` — ${ticket.escalation.reason}` : ''}
            </span>
          </p>
        )}

        {/* Asignación, prioridad y área (editables) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <label className="text-[11px] text-secondary-600 dark:text-secondary-400">
            {t('detail.assignee')}
            <select
              value={ticket.assignee ?? ''}
              onChange={(e) => props.onAssign((e.target.value || null) as AgentId | null)}
              className={`${smallInputCls} mt-0.5`}
            >
              <option value="">{t('inbox.unassigned')}</option>
              {AGENTS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.skills.map((s) => t(`skills.${s}`)).join(', ')})
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] text-secondary-600 dark:text-secondary-400">
            {t('detail.priority')}
            <select value={ticket.priority} onChange={(e) => props.onPriority(e.target.value as Priority)} className={`${smallInputCls} mt-0.5`}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {t(`priorities.${p}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] text-secondary-600 dark:text-secondary-400">
            {t('detail.area')}
            <select value={ticket.category} onChange={(e) => props.onCategory(e.target.value as Category)} className={`${smallInputCls} mt-0.5`}>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`categories.${cat}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {!ticket.assignee && !resolved && (
          <Button size="sm" variant="outline" onClick={props.onAutoAssign}>
            <UserPlusIcon className="h-4 w-4 mr-1" aria-hidden="true" />
            {t('detail.autoAssign')}
          </Button>
        )}
        {ticket.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {ticket.tags.map((tag) => (
              <Badge key={tag} variant="outline" size="sm" className="text-secondary-600 dark:text-secondary-300 gap-1">
                <TagIcon className="h-3 w-3" aria-hidden="true" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Clasificación automática por reglas */}
        <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-3">
          <p className={`${sectionTitleCls} mb-2`}>
            <CpuChipIcon className="h-4 w-4" aria-hidden="true" />
            {t('classification.title')}
          </p>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1.5 text-xs">
            <div>
              <dt className="text-secondary-500">{t('classification.area')}</dt>
              <dd className="font-medium text-secondary-900 dark:text-white">{t(`categories.${c.category}`)}</dd>
            </div>
            <div>
              <dt className="text-secondary-500">{t('classification.sentiment')}</dt>
              <dd className="font-medium text-secondary-900 dark:text-white">{t(`sentiments.${c.sentiment}`)}</dd>
            </div>
            <div>
              <dt className="text-secondary-500">{t('classification.priority')}</dt>
              <dd className="font-medium text-secondary-900 dark:text-white">
                {t(`priorities.${c.priority}`)}{' '}
                <span className="font-normal text-secondary-500">({t(`classification.reasons.${c.priorityReason}`)})</span>
              </dd>
            </div>
            <div>
              <dt className="text-secondary-500">{t('classification.language')}</dt>
              <dd className="font-medium text-secondary-900 dark:text-white">{t(`languages.${c.language}`)}</dd>
            </div>
            <div>
              <dt className="text-secondary-500">{t('classification.confidence')}</dt>
              <dd className="font-medium text-secondary-900 dark:text-white">{hd.pct(c.confidence)}</dd>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-secondary-500">{t('classification.keywords')}</dt>
              <dd className="text-secondary-800 dark:text-secondary-200 break-words">
                {[...c.keywords, ...c.negative, ...c.positive].length
                  ? [...new Set([...c.keywords, ...c.negative, ...c.positive])].map((k) => k.replace('*', '…')).join(', ')
                  : t('classification.none')}
              </dd>
            </div>
          </dl>
          <Note className="mt-2">{t('classification.hint')}</Note>
        </div>

        {/* Conversación */}
        <div>
          <h3 className={`${sectionTitleCls} mb-2`}>
            <ChatBubbleLeftRightIcon className="h-4 w-4" aria-hidden="true" />
            {t('detail.conversation')}
          </h3>
          <div ref={conversationRef} className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {ticket.messages.map((m) => {
              const mine = m.from !== 'customer';
              return (
                <div key={m.id} className={`flex gap-2 ${mine ? 'justify-end' : ''}`}>
                  {!mine && (
                    <div className="w-7 h-7 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center flex-shrink-0">
                      <UserCircleIcon className="h-4 w-4 text-secondary-600 dark:text-secondary-300" aria-hidden="true" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                      m.from === 'agent'
                        ? 'bg-primary-600 text-white rounded-tr-sm'
                        : m.from === 'bot'
                          ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-950 dark:text-violet-100 rounded-tr-sm'
                          : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white rounded-tl-sm'
                    }`}
                  >
                    <p className="text-[10px] uppercase tracking-wide font-semibold opacity-75 mb-0.5">{authorLabel(m)}</p>
                    <p className="text-sm whitespace-pre-wrap break-words">{tx(m.text)}</p>
                    <p className="text-[10px] opacity-70 mt-1" title={hd.dateTime(m.at)}>
                      {hd.ago(m.at, clock)} · {hd.hhmm(m.at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {ticket.status === 'pending' && (
            <button
              type="button"
              onClick={props.onCustomerReply}
              className="mt-2 text-xs font-medium text-primary-700 dark:text-primary-300 hover:underline"
            >
              {t('detail.simulateCustomer')}
            </button>
          )}
        </div>

        {!resolved && (
          <>
            {/* Plantillas de la base de conocimiento + borrador con IA */}
            <div className="space-y-2">
              <p className={sectionTitleCls}>{t('templates.title')}</p>
              {templates.length === 0 && <p className="text-xs text-secondary-500">{t('templates.none')}</p>}
              {templates.map((a) => (
                <div key={a.id} className="p-2.5 rounded-lg border border-secondary-200 dark:border-secondary-700">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-secondary-900 dark:text-white">{t(`kb.articles.${a.id}.title`)}</span>
                    <button
                      type="button"
                      onClick={() => props.onInsertArticle(a)}
                      className="text-xs font-medium text-primary-700 dark:text-primary-300 hover:underline whitespace-nowrap"
                    >
                      {t('templates.insert')}
                    </button>
                  </div>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 line-clamp-3">
                    {t(`kb.articles.${a.id}.reply`, { name: hd.firstName(ticket.customer) })}
                  </p>
                </div>
              ))}
              <AiDraftPanel hd={hd} ticket={ticket} customerText={customerText} onInsert={(text) => onDraft(draft.trim() ? `${draft.trim()}\n\n${text}` : text)} />
            </div>

            {/* Respuesta */}
            <div className="pt-3 border-t border-secondary-200 dark:border-secondary-700 space-y-2">
              <label htmlFor="hd-reply" className={sectionTitleCls}>
                {t('detail.reply')}
              </label>
              <textarea
                id="hd-reply"
                value={draft}
                onChange={(e) => onDraft(e.target.value)}
                placeholder={t('detail.replyPlaceholder')}
                rows={4}
                className="w-full px-3 py-2 text-sm rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Note>{t('detail.sendNote', { channel: t(`channels.${ticket.channel}`) })}</Note>
                <Button size="sm" onClick={props.onSend} disabled={!draft.trim()}>
                  <PaperAirplaneIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                  {t('detail.send')}
                </Button>
              </div>
            </div>

            {/* Macros y PQRS */}
            <div className="pt-3 border-t border-secondary-200 dark:border-secondary-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="hd-macro" className={`${sectionTitleCls} mb-1`}>
                  <BoltIcon className="h-4 w-4" aria-hidden="true" />
                  {t('detail.macro')}
                </label>
                <div className="flex gap-2">
                  <select id="hd-macro" value={macroId} onChange={(e) => setMacroId(e.target.value)} className={smallInputCls}>
                    <option value="">{t('detail.macroPlaceholder')}</option>
                    {activeMacros.map((m) => (
                      <option key={m.id} value={m.id}>
                        {tx(m.name)}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!macroId}
                    onClick={() => {
                      props.onApplyMacro(macroId);
                      setMacroId('');
                    }}
                  >
                    {t('detail.macroApply')}
                  </Button>
                </div>
              </div>
              <div>
                <label htmlFor="hd-pqrs" className={`${sectionTitleCls} mb-1`}>
                  <ScaleIcon className="h-4 w-4" aria-hidden="true" />
                  {t('detail.pqrsLabel')}
                </label>
                <select
                  id="hd-pqrs"
                  value={ticket.pqrs?.type ?? ''}
                  onChange={(e) => props.onPqrs((e.target.value || null) as PqrsType | null)}
                  className={smallInputCls}
                >
                  <option value="">{t('detail.pqrsNone')}</option>
                  {PQRS_TYPES.map((p) => (
                    <option key={p} value={p}>
                      {t(`pqrs.types.${p}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {/* Notas internas */}
        <div className="pt-3 border-t border-secondary-200 dark:border-secondary-700">
          <p className={`${sectionTitleCls} mb-2`}>{t('detail.internalNotes')}</p>
          <div className="space-y-1.5 mb-2">
            {ticket.notes.length === 0 && <p className="text-xs text-secondary-500 italic">{t('detail.noNotes')}</p>}
            {ticket.notes.map((n) => (
              <div
                key={n.id}
                className={`p-2 rounded-md text-xs border ${
                  n.author === 'system'
                    ? 'bg-secondary-50 dark:bg-secondary-800/60 border-secondary-200 dark:border-secondary-700'
                    : 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900'
                }`}
              >
                <span className="font-semibold text-secondary-800 dark:text-secondary-100">{hd.agentName(n.author)}</span>
                <span className="text-secondary-500 ml-2">{hd.ago(n.at, clock)}</span>
                <p className="text-secondary-700 dark:text-secondary-300 mt-0.5 break-words">{tx(n.text)}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveNote();
              }}
              placeholder={t('detail.addNote')}
              aria-label={t('detail.addNote')}
              className={`${smallInputCls} flex-1`}
            />
            <Button size="sm" variant="outline" onClick={saveNote} disabled={!noteDraft.trim()}>
              {t('detail.addNoteCta')}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
