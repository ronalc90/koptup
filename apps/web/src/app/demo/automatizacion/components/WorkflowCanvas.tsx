'use client';

import { useTranslations } from 'next-intl';
import {
  BoltIcon,
  FunnelIcon,
  GlobeAltIcon,
  SparklesIcon,
  ArrowsRightLeftIcon,
  ChatBubbleLeftEllipsisIcon,
  Squares2X2Icon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import type { NodeKind, NodeStatus, WorkflowNode } from './types';

interface Props {
  nodes: WorkflowNode[];
  selectedId: NodeKind | null;
  onSelect: (id: NodeKind) => void;
  running: boolean;
  activeEdgeIndex: number;
}

const NODE_ICONS: Record<NodeKind, React.ComponentType<{ className?: string }>> = {
  trigger: BoltIcon,
  filter: FunnelIcon,
  http: GlobeAltIcon,
  llm: SparklesIcon,
  transform: ArrowsRightLeftIcon,
  slack: ChatBubbleLeftEllipsisIcon,
  subflow: Squares2X2Icon,
};

const NODE_COLORS: Record<NodeKind, string> = {
  trigger: 'from-amber-500/20 to-amber-600/10 border-amber-500/50 text-amber-300',
  filter: 'from-sky-500/20 to-sky-600/10 border-sky-500/50 text-sky-300',
  http: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/50 text-emerald-300',
  llm: 'from-fuchsia-500/20 to-fuchsia-600/10 border-fuchsia-500/50 text-fuchsia-300',
  transform: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/50 text-indigo-300',
  slack: 'from-rose-500/20 to-rose-600/10 border-rose-500/50 text-rose-300',
  subflow: 'from-teal-500/20 to-teal-600/10 border-teal-500/50 text-teal-300',
};

function StatusDot({ status }: { status: NodeStatus }) {
  if (status === 'success') {
    return <CheckCircleIcon className="h-4 w-4 text-emerald-400" />;
  }
  if (status === 'error') {
    return <ExclamationTriangleIcon className="h-4 w-4 text-rose-400" />;
  }
  if (status === 'running') {
    return <ArrowPathIcon className="h-4 w-4 text-sky-400 animate-spin" />;
  }
  return <span className="h-2 w-2 rounded-full bg-secondary-600 inline-block" />;
}

export default function WorkflowCanvas({
  nodes,
  selectedId,
  onSelect,
  running,
  activeEdgeIndex,
}: Props) {
  const t = useTranslations('demoAutomation');
  const tn = useTranslations('demoAutomation.canvas.nodes');

  const NODE_W = 180;
  const NODE_H = 76;

  // Build curved SVG path between two node centers (right side of A → left side of B)
  const buildPath = (a: WorkflowNode, b: WorkflowNode) => {
    const ax = a.x + NODE_W;
    const ay = a.y + NODE_H / 2;
    const bx = b.x;
    const by = b.y + NODE_H / 2;
    const dx = Math.max(40, (bx - ax) / 2);
    return `M ${ax} ${ay} C ${ax + dx} ${ay}, ${bx - dx} ${by}, ${bx} ${by}`;
  };

  const edges: Array<[WorkflowNode, WorkflowNode]> = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push([nodes[i], nodes[i + 1]]);
  }

  // Compute viewBox bounds
  const maxX = Math.max(...nodes.map((n) => n.x)) + NODE_W + 40;
  const maxY = Math.max(...nodes.map((n) => n.y)) + NODE_H + 40;

  return (
    <div className="relative w-full h-full overflow-auto bg-secondary-950 rounded-xl border border-secondary-800">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(148,163,184,0.18) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative" style={{ minWidth: maxX, minHeight: maxY }}>
        {/* Edges */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={maxX}
          height={maxY}
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
            </marker>
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
            </marker>
          </defs>
          {edges.map(([a, b], idx) => {
            const isActive = running && idx <= activeEdgeIndex;
            return (
              <g key={`${a.id}-${b.id}`}>
                <path
                  d={buildPath(a, b)}
                  stroke={isActive ? '#38bdf8' : '#475569'}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  fill="none"
                  markerEnd={isActive ? 'url(#arrow-active)' : 'url(#arrow)'}
                  className={isActive ? 'drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]' : ''}
                />
                {isActive && (
                  <circle r="4" fill="#38bdf8">
                    <animateMotion
                      dur="1.4s"
                      repeatCount="indefinite"
                      path={buildPath(a, b)}
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => {
          const Icon = NODE_ICONS[node.kind];
          const isSelected = node.id === selectedId;
          const titleKey = node.kind;
          const descKey = `${node.kind}Desc`;
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => onSelect(node.id)}
              style={{
                left: node.x,
                top: node.y,
                width: NODE_W,
                height: NODE_H,
              }}
              className={`absolute group rounded-lg border bg-gradient-to-br backdrop-blur-sm transition-all text-left p-3 hover:scale-[1.03] ${
                NODE_COLORS[node.kind]
              } ${
                isSelected
                  ? 'ring-2 ring-primary-400 shadow-lg shadow-primary-500/30 scale-[1.02]'
                  : 'hover:shadow-md hover:shadow-secondary-900'
              } ${node.status === 'running' ? 'animate-pulse' : ''}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs font-semibold text-white truncate">
                  {tn(titleKey)}
                </span>
                <span className="ml-auto">
                  <StatusDot status={node.status} />
                </span>
              </div>
              <p className="text-[11px] text-secondary-300 font-mono truncate">
                {tn(descKey)}
              </p>
            </button>
          );
        })}

        {/* Hint */}
        {!running && (
          <div className="absolute bottom-3 left-3 text-[11px] text-secondary-500 font-mono pointer-events-none">
            {t('canvas.runHint')}
          </div>
        )}
      </div>
    </div>
  );
}
