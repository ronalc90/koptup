'use client';

import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Bars3BottomLeftIcon, CalendarDaysIcon, CheckIcon, HashtagIcon, PencilSquareIcon, SparklesIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { SIGNER_COLORS, suggestedFields } from '../../lib/data';
import { acts } from '../../lib/logic';
import { useFirma } from '../../lib/store';
import { FIELD_TYPES, type Field, type FieldType } from '../../lib/types';
import { Paper, SignerDot, focusRing, labelCls, selectCls } from '../ui';

const ICON: Record<FieldType, typeof PencilSquareIcon> = {
  signature: PencilSquareIcon,
  initials: HashtagIcon,
  date: CalendarDaysIcon,
  text: Bars3BottomLeftIcon,
  checkbox: CheckIcon,
};

const clamp = (v: number) => Math.min(96, Math.max(4, Math.round(v * 10) / 10));

export default function StepFields() {
  const t = useTranslations('demoSign');
  const { s, patchDraft, docText } = useFirma();
  const d = s.draft;
  const acting = d.signers.filter(acts);
  const [assignTo, setAssignTo] = useState(acting[0]?.id ?? '');
  const [armed, setArmed] = useState<FieldType | null>(null);
  const [dragType, setDragType] = useState<FieldType | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const page = useRef<HTMLDivElement>(null);
  const moving = useRef<{ id: string; moved: boolean } | null>(null);

  const owner = acting.some((x) => x.id === assignTo) ? assignTo : (acting[0]?.id ?? '');
  const colorOf = (signerId: string) => SIGNER_COLORS[Math.max(0, d.signers.findIndex((x) => x.id === signerId)) % SIGNER_COLORS.length];
  const setFields = (fields: Field[]) => patchDraft({ fields });
  const posFrom = (clientX: number, clientY: number) => {
    const r = page.current?.getBoundingClientRect();
    if (!r) return null;
    return { x: clamp(((clientX - r.left) / r.width) * 100), y: clamp(((clientY - r.top) / r.height) * 100) };
  };
  const place = (type: FieldType, x: number, y: number) => {
    if (!owner) return;
    const id = `f-${Date.now().toString(36)}-${d.fields.length}`;
    setFields([...d.fields, { id, type, x, y, signerId: owner }]);
    setSelected(id);
  };
  const update = (id: string, p: Partial<Field>) => setFields(d.fields.map((f) => (f.id === id ? { ...f, ...p } : f)));
  const remove = (id: string) => {
    setFields(d.fields.filter((f) => f.id !== id));
    setSelected(null);
  };

  const onFieldKey = (e: KeyboardEvent<HTMLButtonElement>, f: Field) => {
    const step = e.shiftKey ? 5 : 1;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) {
      e.preventDefault();
      update(f.id, { x: clamp(f.x + moves[e.key][0]), y: clamp(f.y + moves[e.key][1]) });
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      remove(f.id);
    }
  };

  const onFieldDown = (e: PointerEvent<HTMLButtonElement>, f: Field) => {
    e.stopPropagation();
    setSelected(f.id);
    moving.current = { id: f.id, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onFieldMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!moving.current) return;
    const p = posFrom(e.clientX, e.clientY);
    if (!p) return;
    moving.current.moved = true;
    update(moving.current.id, p);
  };
  const onFieldUp = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    moving.current = null;
  };

  const sel = d.fields.find((f) => f.id === selected) ?? null;
  const text = d.doc?.kind === 'template' ? docText({ doc: d.doc }) : '';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">{t('wizard.fields.title')}</h3>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('wizard.fields.subtitle')}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div>
            <p className={labelCls}>{t('wizard.fields.assignTo')}</p>
            <div className="flex flex-wrap gap-1.5 lg:flex-col">
              {acting.map((x) => {
                const i = d.signers.findIndex((y) => y.id === x.id);
                return (
                  <button
                    key={x.id}
                    type="button"
                    aria-pressed={owner === x.id}
                    onClick={() => setAssignTo(x.id)}
                    className={`flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm ${focusRing} ${
                      owner === x.id ? `${colorOf(x.id).border} ${colorOf(x.id).bg} ${colorOf(x.id).text} font-medium` : 'border-secondary-200 dark:border-secondary-700'
                    }`}
                  >
                    <SignerDot index={i} />
                    <span className="min-w-0 truncate">{x.name || t('wizard.signers.personN', { n: i + 1 })}</span>
                    <span className="ml-auto shrink-0 text-xs opacity-75">{d.fields.filter((f) => f.signerId === x.id).length}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className={labelCls}>{t('wizard.fields.palette')}</p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5 lg:grid-cols-1">
              {FIELD_TYPES.map((type) => {
                const Icon = ICON[type];
                return (
                  <button
                    key={type}
                    type="button"
                    draggable
                    aria-pressed={armed === type}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', type);
                      setDragType(type);
                    }}
                    onDragEnd={() => setDragType(null)}
                    onClick={() => setArmed(armed === type ? null : type)}
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm ${focusRing} ${
                      armed === type ? 'border-lime-600 bg-lime-50 font-medium text-lime-900 dark:bg-lime-950/50 dark:text-lime-200' : 'border-secondary-200 hover:border-lime-400 dark:border-secondary-700'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-lime-700 dark:text-lime-400" />
                    {t(`fieldTypes.${type}`)}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-secondary-500">{armed ? t('wizard.fields.armedHint', { type: t(`fieldTypes.${armed}`) }) : t('wizard.fields.howTo')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setFields(suggestedFields(d.signers, `f${d.fields.length + 1}-`));
                setSelected(null);
              }}
            >
              <SparklesIcon className="mr-1 h-4 w-4" /> {t('wizard.fields.suggest')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={d.fields.length === 0}
              onClick={() => {
                setFields([]);
                setSelected(null);
              }}
            >
              {t('wizard.fields.clear')}
            </Button>
          </div>
        </div>

        <div className="min-w-0">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-secondary-500">
            {t('wizard.fields.page', { n: d.fields.length })}
          </p>
          <Paper className="mx-auto max-w-2xl overflow-hidden">
            <div
              ref={page}
              role="application"
              aria-label={t('wizard.fields.pageLabel')}
              className={`relative aspect-[8.5/11] w-full select-none ${armed ? 'cursor-crosshair' : ''}`}
              onClick={(e) => {
                if (!armed) {
                  setSelected(null);
                  return;
                }
                const p = posFrom(e.clientX, e.clientY);
                if (p) place(armed, p.x, p.y);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const type = (e.dataTransfer.getData('text/plain') || dragType) as FieldType | null;
                const p = posFrom(e.clientX, e.clientY);
                if (type && FIELD_TYPES.includes(type) && p) place(type, p.x, p.y);
                setDragType(null);
              }}
            >
              <div className="pointer-events-none absolute inset-0 overflow-hidden p-[5%] text-secondary-700">
                {text ? (
                  <p className="whitespace-pre-wrap text-[7px] leading-[1.45] sm:text-[9px]">{text}</p>
                ) : (
                  <>
                    <p className="text-[10px] font-semibold sm:text-xs">{d.doc?.fileName}</p>
                    <p className="text-[9px] text-secondary-400">{t('wizard.fields.schematic')}</p>
                    <div className="mt-3 space-y-2">
                      {[88, 95, 70, 92, 84, 60, 90, 76, 94, 66].map((w, i) => (
                        <div key={i} className="h-1.5 rounded bg-secondary-200" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {dragType && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center border-2 border-dashed border-lime-600 bg-lime-500/10 text-sm font-medium text-lime-800">
                  {t('wizard.fields.dropHere')}
                </div>
              )}
              {d.fields.map((f) => {
                const c = colorOf(f.signerId);
                const Icon = ICON[f.type];
                const who = d.signers.find((x) => x.id === f.signerId);
                return (
                  <button
                    key={f.id}
                    type="button"
                    style={{ left: `${f.x}%`, top: `${f.y}%`, touchAction: 'none' }}
                    className={`absolute flex -translate-x-1/2 -translate-y-1/2 cursor-move items-center gap-1 whitespace-nowrap rounded-md border-2 border-dashed px-1.5 py-0.5 text-[10px] font-medium shadow-sm sm:text-xs ${c.bg} ${c.border} ${c.text} ${
                      selected === f.id ? 'ring-2 ring-lime-600 ring-offset-1' : ''
                    } focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-600`}
                    aria-label={t('wizard.fields.fieldLabel', { type: t(`fieldTypes.${f.type}`), name: who?.name ?? '' })}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={() => setSelected(f.id)}
                    onKeyDown={(e) => onFieldKey(e, f)}
                    onPointerDown={(e) => onFieldDown(e, f)}
                    onPointerMove={onFieldMove}
                    onPointerUp={onFieldUp}
                  >
                    <Icon className="h-3 w-3" /> {t(`fieldTypes.${f.type}`)}
                  </button>
                );
              })}
            </div>
          </Paper>

          {sel ? (
            <div className="mx-auto mt-3 flex max-w-2xl flex-wrap items-end gap-2 rounded-lg border border-secondary-200 p-3 dark:border-secondary-700">
              <p className="w-full text-sm font-medium">{t('wizard.fields.selected', { type: t(`fieldTypes.${sel.type}`) })}</p>
              <div className="min-w-[12rem] flex-1">
                <label htmlFor="field-owner" className={labelCls}>
                  {t('wizard.fields.owner')}
                </label>
                <select id="field-owner" className={selectCls} value={sel.signerId} onChange={(e) => update(sel.id, { signerId: e.target.value })}>
                  {acting.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name || x.id}
                    </option>
                  ))}
                </select>
              </div>
              <Button size="sm" variant="danger" onClick={() => remove(sel.id)}>
                <TrashIcon className="mr-1 h-4 w-4" /> {t('wizard.fields.remove')}
              </Button>
              <p className="w-full text-xs text-secondary-500">{t('wizard.fields.keys')}</p>
            </div>
          ) : (
            <p className="mx-auto mt-2 max-w-2xl text-xs text-secondary-500">{t('wizard.fields.selectHint')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
