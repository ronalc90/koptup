'use client';

import { useState } from 'react';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import {
  AGENTS,
  BRANDS,
  CATEGORIES,
  CHANNELS,
  ESCALATION_TARGETS,
  INCOMING_EXAMPLES,
  PRIORITIES,
  type BrandId,
  type Channel,
  type EscalationTarget,
  type MacroAction,
  type MacroCondition,
  type Ticket,
} from './data';
import { keywordList } from './engine';
import type { IncomingInput } from './useHelpdeskStore';
import { Modal, Note, inputCls, labelCls } from './ui';
import type { HdText } from './useHelpdeskText';

// ---------------------------------------------------------------------------
// Simular ticket entrante
// ---------------------------------------------------------------------------

export function NewTicketModal({ hd, onClose, onCreate }: { hd: HdText; onClose: () => void; onCreate: (input: IncomingInput) => void }) {
  const { t } = hd;
  const fromExample = (id: string): IncomingInput & { example: string } => {
    const ex = INCOMING_EXAMPLES.find((e) => e.id === id) ?? INCOMING_EXAMPLES[0];
    return {
      example: ex.id,
      channel: ex.channel,
      brand: ex.brand,
      customer: ex.customer,
      contact: ex.contact,
      city: ex.city,
      text: t(`data.incoming.${ex.id}.text`),
    };
  };
  const [form, setForm] = useState(() => fromExample(INCOMING_EXAMPLES[0].id));
  const [touched, setTouched] = useState(false);
  const customerOk = form.customer.trim().length >= 2;
  const textOk = form.text.trim().length >= 10;

  const submit = () => {
    setTouched(true);
    if (!customerOk || !textOk) return;
    onCreate({
      channel: form.channel,
      brand: form.brand,
      customer: form.customer,
      contact: form.contact,
      city: form.city,
      text: form.text,
    });
  };

  return (
    <Modal
      title={t('newTicket.title')}
      subtitle={t('newTicket.subtitle')}
      onClose={onClose}
      closeLabel={t('common.close')}
      labelId="hd-new-ticket"
      footer={
        <>
          <Button size="sm" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" onClick={submit}>
            {t('newTicket.submit')}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <p className={labelCls}>{t('newTicket.examples')}</p>
          <div className="flex flex-wrap gap-1.5">
            {INCOMING_EXAMPLES.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => setForm(fromExample(ex.id))}
                aria-pressed={form.example === ex.id}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                  form.example === ex.id
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-secondary-300 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 hover:border-primary-400'
                }`}
              >
                {t(`data.incoming.${ex.id}.label`)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className={labelCls}>{t('newTicket.customer')}</span>
            <input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className={inputCls} />
            {touched && !customerOk && <span className="text-xs text-red-600 dark:text-red-400">{t('newTicket.customerError')}</span>}
          </label>
          <label className="block">
            <span className={labelCls}>{t('newTicket.contact')}</span>
            <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>{t('newTicket.channel')}</span>
            <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as Channel })} className={inputCls}>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {t(`channels.${c}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>{t('newTicket.brand')}</span>
            <select value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value as BrandId })} className={inputCls}>
              {BRANDS.map((b) => (
                <option key={b} value={b}>
                  {t(`brands.${b}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className={labelCls}>{t('newTicket.city')}</span>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} />
          </label>
        </div>
        <label className="block">
          <span className={labelCls}>{t('newTicket.message')}</span>
          <textarea
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            rows={5}
            className={`${inputCls} resize-y`}
          />
          {touched && !textOk && <span className="text-xs text-red-600 dark:text-red-400">{t('newTicket.messageError')}</span>}
        </label>
        <Note>{t('newTicket.note')}</Note>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Escalar
// ---------------------------------------------------------------------------

export function EscalateModal({
  hd,
  ticket,
  onClose,
  onConfirm,
}: {
  hd: HdText;
  ticket: Ticket;
  onClose: () => void;
  onConfirm: (target: EscalationTarget, reason: string, raise: boolean) => void;
}) {
  const { t } = hd;
  const [target, setTarget] = useState<EscalationTarget>(ticket.category === 'tech' ? 'level2' : 'supervisor');
  const [reason, setReason] = useState('');
  const [raise, setRaise] = useState(ticket.priority !== 'urgent');
  const [touched, setTouched] = useState(false);
  const ok = reason.trim().length >= 5;

  return (
    <Modal
      title={t('escalate.title', { id: ticket.id })}
      subtitle={t('escalate.subtitle')}
      onClose={onClose}
      closeLabel={t('common.close')}
      labelId="hd-escalate"
      footer={
        <>
          <Button size="sm" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              setTouched(true);
              if (ok) onConfirm(target, reason.trim(), raise);
            }}
          >
            {t('escalate.submit')}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <fieldset>
          <legend className={labelCls}>{t('escalate.target')}</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ESCALATION_TARGETS.map((tg) => (
              <label
                key={tg}
                className={`flex items-start gap-2 p-2 rounded-lg border text-sm cursor-pointer ${
                  target === tg ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'border-secondary-200 dark:border-secondary-700'
                }`}
              >
                <input type="radio" name="hd-target" checked={target === tg} onChange={() => setTarget(tg)} className="mt-0.5 accent-primary-600" />
                <span>
                  <span className="block font-medium text-secondary-900 dark:text-white">{t(`escalate.targets.${tg}`)}</span>
                  <span className="block text-xs text-secondary-500">{t(`escalate.targetHints.${tg}`)}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block">
          <span className={labelCls}>{t('escalate.reason')}</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={t('escalate.reasonPlaceholder')}
            className={`${inputCls} resize-y`}
          />
          {touched && !ok && <span className="text-xs text-red-600 dark:text-red-400">{t('escalate.reasonError')}</span>}
        </label>
        <label className="flex items-center gap-2 text-sm text-secondary-700 dark:text-secondary-300">
          <input type="checkbox" checked={raise} disabled={ticket.priority === 'urgent'} onChange={(e) => setRaise(e.target.checked)} className="accent-primary-600" />
          {ticket.priority === 'urgent' ? t('escalate.alreadyUrgent') : t('escalate.raise')}
        </label>
        <Note>{t('escalate.note')}</Note>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Crear macro
// ---------------------------------------------------------------------------

type CondType = MacroCondition['type'];
type ActType = MacroAction['type'];
const COND_TYPES: CondType[] = ['category', 'channel', 'priorityAtLeast', 'sentiment', 'keyword'];
const ACT_TYPES: ActType[] = ['assign', 'priority', 'tag', 'ack'];

function defaultCondition(type: CondType): MacroCondition {
  switch (type) {
    case 'category':
      return { type, value: 'billing' };
    case 'channel':
      return { type, value: 'whatsapp' };
    case 'priorityAtLeast':
      return { type, value: 'high' };
    case 'sentiment':
      return { type, value: 'negative' };
    case 'keyword':
      return { type, value: '' };
  }
}

function defaultAction(type: ActType): MacroAction {
  switch (type) {
    case 'assign':
      return { type, value: 'maria' };
    case 'priority':
      return { type, value: 'high' };
    case 'tag':
      return { type, value: '' };
    case 'ack':
      return { type };
  }
}

export function MacroBuilderModal({
  hd,
  onClose,
  onSave,
}: {
  hd: HdText;
  onClose: () => void;
  onSave: (name: string, conditions: MacroCondition[], actions: MacroAction[], auto: boolean) => void;
}) {
  const { t } = hd;
  const [name, setName] = useState('');
  const [conditions, setConditions] = useState<MacroCondition[]>([defaultCondition('keyword')]);
  const [actions, setActions] = useState<MacroAction[]>([defaultAction('tag')]);
  const [auto, setAuto] = useState(true);
  const [touched, setTouched] = useState(false);

  const condOk = (c: MacroCondition) => c.type !== 'keyword' || keywordList(c.value).length > 0;
  const actOk = (a: MacroAction) => a.type !== 'tag' || a.value.trim().length > 0;
  const valid = name.trim().length >= 3 && conditions.length > 0 && conditions.every(condOk) && actions.length > 0 && actions.every(actOk);

  const valueOptions = (c: MacroCondition): { value: string; label: string }[] => {
    switch (c.type) {
      case 'category':
        return CATEGORIES.map((v) => ({ value: v, label: t(`categories.${v}`) }));
      case 'channel':
        return CHANNELS.map((v) => ({ value: v, label: t(`channels.${v}`) }));
      case 'priorityAtLeast':
        return PRIORITIES.map((v) => ({ value: v, label: t(`priorities.${v}`) }));
      case 'sentiment':
        return (['negative', 'neutral', 'positive'] as const).map((v) => ({ value: v, label: t(`sentiments.${v}`) }));
      case 'keyword':
        return [];
    }
  };

  return (
    <Modal
      title={t('macros.builder.title')}
      subtitle={t('macros.builder.subtitle')}
      onClose={onClose}
      closeLabel={t('common.close')}
      labelId="hd-macro-builder"
      footer={
        <>
          <Button size="sm" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setTouched(true);
              if (valid) onSave(name.trim(), conditions, actions.map((a) => (a.type === 'tag' ? { ...a, value: a.value.trim().toLowerCase().replace(/\s+/g, '-') } : a)), auto);
            }}
          >
            {t('macros.builder.save')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className={labelCls}>{t('macros.builder.name')}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('macros.builder.namePlaceholder')} className={inputCls} />
        </label>

        <div>
          <p className={labelCls}>{t('macros.builder.conditions')}</p>
          <div className="space-y-2">
            {conditions.map((c, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-2">
                <select
                  value={c.type}
                  aria-label={t('macros.builder.conditionType')}
                  onChange={(e) => setConditions(conditions.map((x, j) => (j === i ? defaultCondition(e.target.value as CondType) : x)))}
                  className={`${inputCls} sm:w-48`}
                >
                  {COND_TYPES.map((ct) => (
                    <option key={ct} value={ct}>
                      {t(`macros.builder.conditionTypes.${ct}`)}
                    </option>
                  ))}
                </select>
                {c.type === 'keyword' ? (
                  <input
                    value={c.value}
                    aria-label={t('macros.builder.keywordPlaceholder')}
                    placeholder={t('macros.builder.keywordPlaceholder')}
                    onChange={(e) => setConditions(conditions.map((x, j) => (j === i ? { type: 'keyword', value: e.target.value } : x)))}
                    className={inputCls}
                  />
                ) : (
                  <select
                    value={c.value}
                    aria-label={t('macros.builder.value')}
                    onChange={(e) => setConditions(conditions.map((x, j) => (j === i ? ({ type: c.type, value: e.target.value } as MacroCondition) : x)))}
                    className={inputCls}
                  >
                    {valueOptions(c).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}
                {conditions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setConditions(conditions.filter((_, j) => j !== i))}
                    aria-label={t('macros.builder.remove')}
                    className="self-start sm:self-center p-2 rounded-lg text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                  >
                    <TrashIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
            {touched && !conditions.every(condOk) && <p className="text-xs text-red-600 dark:text-red-400">{t('macros.builder.keywordError')}</p>}
            {conditions.length < 3 && (
              <button
                type="button"
                onClick={() => setConditions([...conditions, defaultCondition('category')])}
                className="text-xs font-medium text-primary-700 dark:text-primary-300 hover:underline inline-flex items-center gap-1"
              >
                <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {t('macros.builder.addCondition')}
              </button>
            )}
          </div>
        </div>

        <div>
          <p className={labelCls}>{t('macros.builder.actions')}</p>
          <div className="space-y-2">
            {actions.map((a, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-2">
                <select
                  value={a.type}
                  aria-label={t('macros.builder.actionType')}
                  onChange={(e) => setActions(actions.map((x, j) => (j === i ? defaultAction(e.target.value as ActType) : x)))}
                  className={`${inputCls} sm:w-48`}
                >
                  {ACT_TYPES.map((at) => (
                    <option key={at} value={at}>
                      {t(`macros.builder.actionTypes.${at}`)}
                    </option>
                  ))}
                </select>
                {a.type === 'assign' && (
                  <select
                    value={a.value}
                    aria-label={t('macros.builder.value')}
                    onChange={(e) => setActions(actions.map((x, j) => (j === i ? { type: 'assign', value: e.target.value as typeof a.value } : x)))}
                    className={inputCls}
                  >
                    {AGENTS.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name}
                      </option>
                    ))}
                  </select>
                )}
                {a.type === 'priority' && (
                  <select
                    value={a.value}
                    aria-label={t('macros.builder.value')}
                    onChange={(e) => setActions(actions.map((x, j) => (j === i ? { type: 'priority', value: e.target.value as typeof a.value } : x)))}
                    className={inputCls}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {t(`priorities.${p}`)}
                      </option>
                    ))}
                  </select>
                )}
                {a.type === 'tag' && (
                  <input
                    value={a.value}
                    aria-label={t('macros.builder.tagPlaceholder')}
                    placeholder={t('macros.builder.tagPlaceholder')}
                    onChange={(e) => setActions(actions.map((x, j) => (j === i ? { type: 'tag', value: e.target.value } : x)))}
                    className={inputCls}
                  />
                )}
                {a.type === 'ack' && <p className="text-xs text-secondary-500 sm:self-center flex-1">{t('macros.builder.ackHint')}</p>}
                {actions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setActions(actions.filter((_, j) => j !== i))}
                    aria-label={t('macros.builder.remove')}
                    className="self-start sm:self-center p-2 rounded-lg text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                  >
                    <TrashIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
            {touched && !actions.every(actOk) && <p className="text-xs text-red-600 dark:text-red-400">{t('macros.builder.tagError')}</p>}
            {actions.length < 3 && (
              <button
                type="button"
                onClick={() => setActions([...actions, defaultAction('priority')])}
                className="text-xs font-medium text-primary-700 dark:text-primary-300 hover:underline inline-flex items-center gap-1"
              >
                <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {t('macros.builder.addAction')}
              </button>
            )}
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-secondary-700 dark:text-secondary-300">
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="mt-0.5 accent-primary-600" />
          {t('macros.builder.auto')}
        </label>
        {touched && name.trim().length < 3 && <p className="text-xs text-red-600 dark:text-red-400">{t('macros.builder.nameError')}</p>}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Encuesta CSAT / NPS (vista del cliente)
// ---------------------------------------------------------------------------

export function SurveyModal({
  hd,
  ticket,
  onClose,
  onSubmit,
}: {
  hd: HdText;
  ticket: Ticket;
  onClose: () => void;
  onSubmit: (score: number, nps: number, comment: string) => void;
}) {
  const { t } = hd;
  const [score, setScore] = useState(0);
  const [nps, setNps] = useState<number | null>(null);
  const [comment, setComment] = useState('');

  return (
    <Modal
      title={t('csat.modal.title')}
      subtitle={t('csat.modal.subtitle', { id: ticket.id, agent: hd.agentName(ticket.assignee), channel: t(`channels.${ticket.channel}`) })}
      onClose={onClose}
      closeLabel={t('common.close')}
      labelId="hd-survey"
      footer={
        <>
          <Button size="sm" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="sm" disabled={score === 0 || nps === null} onClick={() => nps !== null && onSubmit(score, nps, comment.trim())}>
            {t('csat.modal.submit')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className={labelCls}>{t('csat.modal.scoreLabel')}</p>
          <div className="flex items-center justify-center gap-1 sm:gap-2" role="radiogroup" aria-label={t('csat.modal.scoreLabel')}>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={score === s}
                onClick={() => setScore(s)}
                aria-label={t('csat.modal.stars', { n: s })}
                className="transition-transform hover:scale-110"
              >
                <StarSolid className={`h-9 w-9 ${s <= score ? 'text-yellow-500' : 'text-secondary-300 dark:text-secondary-700'}`} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className={labelCls}>{t('csat.modal.npsLabel')}</p>
          <div className="grid grid-cols-11 gap-1" role="radiogroup" aria-label={t('csat.modal.npsLabel')}>
            {Array.from({ length: 11 }, (_, n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={nps === n}
                onClick={() => setNps(n)}
                className={`py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                  nps === n
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-secondary-300 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 hover:border-primary-400'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-secondary-500 mt-1">
            <span>{t('csat.modal.npsLow')}</span>
            <span>{t('csat.modal.npsHigh')}</span>
          </div>
        </div>
        <label className="block">
          <span className={labelCls}>{t('csat.modal.comment')}</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder={t('csat.modal.commentPlaceholder')}
            className={`${inputCls} resize-y`}
          />
        </label>
        <Note>{t('csat.modal.note')}</Note>
      </div>
    </Modal>
  );
}
