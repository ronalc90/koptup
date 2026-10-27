'use client';

import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, MinusCircleIcon, NoSymbolIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { TYPE_DEFS, isTrigger, typeKey } from '../lib/catalog';
import { BRANCH_H, BRANCH_W, NODE_H, branchPos, computeLayout, dropIndex, edgePath } from '../lib/layout';
import type { Live, NodeVisual } from '../lib/store';
import type { Step, StepType } from '../lib/types';
import { CATEGORY_COLORS, TYPE_ICONS } from './icons';
import { DRAG_NEW } from './NodePalette';
import { SimTag, focusRing } from './ui';

export const DRAG_STEP = 'application/x-koptup-step';

interface Props {
  steps: Step[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  live: Live;
  onDropNew: (type: StepType, index: number) => void;
  onMove: (id: string, index: number) => void;
  onDelete: (id: string) => void;
}

function StatusIcon({ status }: { status: NodeVisual }) {
  const t = useTranslations('demoAutomation.canvas.status');
  const label = t(status);
  switch (status) {
    case 'success':
      return <CheckCircleIcon className="h-4 w-4 text-emerald-400" aria-label={label} />;
    case 'running':
      return <ArrowPathIcon className="h-4 w-4 animate-spin text-sky-400 motion-reduce:animate-none" aria-label={label} />;
    case 'retry':
      return <ArrowPathIcon className="h-4 w-4 text-amber-400" aria-label={label} />;
    case 'failed':
      return <XCircleIcon className="h-4 w-4 text-rose-400" aria-label={label} />;
    case 'review':
      return <ExclamationTriangleIcon className="h-4 w-4 text-amber-400" aria-label={label} />;
    case 'stopped':
      return <MinusCircleIcon className="h-4 w-4 text-secondary-400" aria-label={label} />;
    case 'cancelled':
      return <NoSymbolIcon className="h-4 w-4 text-secondary-400" aria-label={label} />;
    default:
      return <span className="inline-block h-2 w-2 rounded-full bg-secondary-600" aria-label={label} />;
  }
}

export default function WorkflowCanvas({ steps, selectedId, onSelect, live, onDropNew, onMove, onDelete }: Props) {
  const t = useTranslations('demoAutomation');
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [dropAt, setDropAt] = useState<number | null>(null);

  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => computeLayout(steps.length, width || 880), [steps.length, width]);
  const { positions, nodeW } = layout;

  const pointFromEvent = (e: DragEvent) => {
    const rect = inner.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const accepts = (e: DragEvent) => e.dataTransfer.types.includes(DRAG_NEW) || e.dataTransfer.types.includes(DRAG_STEP);

  const onDragOver = (e: DragEvent) => {
    if (!accepts(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = e.dataTransfer.types.includes(DRAG_STEP) ? 'move' : 'copy';
    const p = pointFromEvent(e);
    if (p) setDropAt(dropIndex(layout, p.x, p.y));
  };

  const onDrop = (e: DragEvent) => {
    if (!accepts(e)) return;
    e.preventDefault();
    const p = pointFromEvent(e);
    setDropAt(null);
    if (!p) return;
    const index = dropIndex(layout, p.x, p.y);
    const moving = e.dataTransfer.getData(DRAG_STEP);
    if (moving) {
      onMove(moving, index);
      return;
    }
    const type = e.dataTransfer.getData(DRAG_NEW) as StepType;
    if (type && type in TYPE_DEFS) onDropNew(type, index);
  };

  // Marca de inserción mientras se arrastra.
  const marker = (() => {
    if (dropAt === null || !positions.length) return null;
    const prev = positions[dropAt - 1];
    const next = positions[dropAt];
    if (prev && next) {
      if (prev.row === next.row) {
        const x = prev.dir === 1 ? (prev.x + nodeW + next.x) / 2 : (prev.x + next.x + nodeW) / 2;
        return { x, y: prev.y + NODE_H / 2 };
      }
      return { x: prev.x + nodeW / 2, y: (prev.y + NODE_H + next.y) / 2 };
    }
    if (prev) {
      if (layout.cols === 1) return { x: prev.x + nodeW / 2, y: prev.y + NODE_H + 18 };
      return { x: prev.dir === 1 ? prev.x + nodeW + 18 : prev.x - 18, y: prev.y + NODE_H / 2 };
    }
    return null;
  })();

  const activeEdge = live.running ? live.reached - 1 : -1;

  return (
    <div
      ref={outer}
      role="group"
      aria-label={t('canvas.title')}
      onDragOver={onDragOver}
      onDragLeave={(e) => {
        if (!outer.current?.contains(e.relatedTarget as Node)) setDropAt(null);
      }}
      onDrop={onDrop}
      style={{ ['--canvas-h' as string]: `${Math.min(620, Math.max(336, layout.height + 2))}px` }}
      className={`relative w-full overflow-auto rounded-xl border bg-secondary-950 lg:h-[var(--canvas-h)] ${dropAt !== null ? 'border-primary-500/70' : 'border-secondary-800'}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.18) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />
      <div ref={inner} className="relative" style={{ width: Math.max(layout.width, 10), minWidth: '100%', height: layout.height }}>
        <svg className="pointer-events-none absolute left-0 top-0" width={layout.width} height={layout.height} aria-hidden>
          <defs>
            <marker id="auto-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
            </marker>
            <marker id="auto-arrow-lit" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
            </marker>
          </defs>
          {positions.slice(0, -1).map((a, i) => {
            const b = positions[i + 1];
            const lit = i + 1 <= live.reached;
            const d = edgePath(a, b, nodeW);
            return (
              <g key={`e-${steps[i].id}-${steps[i + 1].id}`}>
                <path d={d} stroke={lit ? '#38bdf8' : '#475569'} strokeWidth={lit ? 2.5 : 1.5} fill="none" markerEnd={lit ? 'url(#auto-arrow-lit)' : 'url(#auto-arrow)'} />
                {lit && i === activeEdge && (
                  <circle r="4" fill="#38bdf8">
                    <animateMotion dur="1.2s" repeatCount="indefinite" path={d} />
                  </circle>
                )}
              </g>
            );
          })}
          {steps.map((st, i) => {
            if (st.type !== 'logic.condition') return null;
            const p = positions[i];
            const b = branchPos(p, nodeW);
            const x = b.x + BRANCH_W / 2;
            const lit = live.statuses[st.id] === 'review' || live.statuses[st.id] === 'stopped';
            return <path key={`b-${st.id}`} d={`M ${x} ${p.y + NODE_H} L ${x} ${b.y}`} stroke={lit ? '#fbbf24' : '#64748b'} strokeWidth={1.5} strokeDasharray="4 3" fill="none" />;
          })}
          {marker && <circle cx={marker.x} cy={marker.y} r={7} fill="#3b82f6" stroke="#bfdbfe" strokeWidth={2} />}
        </svg>

        {steps.map((st, i) => {
          if (st.type !== 'logic.condition') return null;
          const b = branchPos(positions[i], nodeW);
          const onFalse = String(st.config.onFalse) === 'stop' ? 'stop' : 'review';
          const lit = live.statuses[st.id] === 'review' || live.statuses[st.id] === 'stopped';
          return (
            <span
              key={`bp-${st.id}`}
              className={`pointer-events-none absolute flex items-center justify-center truncate rounded-full border px-1.5 text-[10px] font-medium ${
                lit ? 'border-amber-400 bg-amber-500/20 text-amber-100' : 'border-secondary-600 bg-secondary-900 text-secondary-300'
              }`}
              style={{ left: b.x, top: b.y, width: BRANCH_W, height: BRANCH_H }}
            >
              {t(onFalse === 'stop' ? 'canvas.branchStop' : 'canvas.branchReview')}
            </span>
          );
        })}

        {steps.map((st, i) => {
          const p = positions[i];
          const def = TYPE_DEFS[st.type];
          const Icon = TYPE_ICONS[st.type];
          const status: NodeVisual = live.statuses[st.id] ?? 'idle';
          const selected = st.id === selectedId;
          const trigger = isTrigger(st.type);
          return (
            <button
              key={st.id}
              type="button"
              data-step-id={st.id}
              onClick={() => onSelect(st.id)}
              onKeyDown={(e) => {
                if ((e.key === 'Delete' || e.key === 'Backspace') && !trigger) {
                  e.preventDefault();
                  onDelete(st.id);
                }
              }}
              draggable={!trigger}
              onDragStart={(e) => {
                e.dataTransfer.setData(DRAG_STEP, st.id);
                e.dataTransfer.setData('text/plain', st.name);
                e.dataTransfer.effectAllowed = 'move';
              }}
              aria-pressed={selected}
              aria-label={t('canvas.nodeLabel', { n: i + 1, name: st.name, type: t(`types.${typeKey(st.type)}.name`), status: t(`canvas.status.${status}`) })}
              style={{ left: p.x, top: p.y, width: nodeW, height: NODE_H }}
              className={`absolute flex flex-col justify-between rounded-lg border bg-gradient-to-br p-2.5 text-left transition-shadow ${CATEGORY_COLORS[def.category]} ${
                selected ? 'shadow-lg shadow-primary-500/30 ring-2 ring-primary-400' : 'hover:shadow-md hover:shadow-secondary-900'
              } ${status === 'running' ? 'animate-pulse motion-reduce:animate-none' : ''} ${focusRing}`}
            >
              <span className="flex w-full items-center gap-1.5">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-white">{st.name}</span>
                <StatusIcon status={status} />
              </span>
              <span className="flex w-full items-center gap-1.5">
                <span className="min-w-0 flex-1 truncate text-[10.5px] text-secondary-300">
                  {i + 1}. {t(`types.${typeKey(st.type)}.name`)}
                </span>
                {def.simulated && <SimTag />}
              </span>
            </button>
          );
        })}

        {!live.running && steps.length <= 1 && (
          <p className="pointer-events-none absolute left-6 text-[11px] text-secondary-500" style={{ top: NODE_H + 44 }}>
            {t('canvas.emptyHint')}
          </p>
        )}
      </div>
    </div>
  );
}
