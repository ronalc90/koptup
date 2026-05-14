'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  BoltIcon,
  ClockIcon,
  ArrowPathIcon,
  FolderOpenIcon,
  EnvelopeIcon,
  CircleStackIcon,
  GlobeAltIcon,
  ChatBubbleLeftEllipsisIcon,
  TableCellsIcon,
  CreditCardIcon,
  BuildingOffice2Icon,
  SparklesIcon,
  CpuChipIcon,
  DocumentMagnifyingGlassIcon,
  EyeIcon,
  MicrophoneIcon,
  CommandLineIcon,
  FunnelIcon,
  ArrowsRightLeftIcon,
  ArrowUturnLeftIcon,
  PauseIcon,
  Squares2X2Icon,
  CodeBracketIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

type CategoryKey = 'triggers' | 'actions' | 'ai' | 'logic' | 'code';

interface PaletteItem {
  id: string;
  category: CategoryKey;
  icon: React.ComponentType<{ className?: string }>;
}

const ITEMS: PaletteItem[] = [
  { id: 'webhook', category: 'triggers', icon: BoltIcon },
  { id: 'schedule', category: 'triggers', icon: ClockIcon },
  { id: 'polling', category: 'triggers', icon: ArrowPathIcon },
  { id: 'fileWatch', category: 'triggers', icon: FolderOpenIcon },
  { id: 'emailIn', category: 'triggers', icon: EnvelopeIcon },
  { id: 'dbCdc', category: 'triggers', icon: CircleStackIcon },

  { id: 'http', category: 'actions', icon: GlobeAltIcon },
  { id: 'slack', category: 'actions', icon: ChatBubbleLeftEllipsisIcon },
  { id: 'email', category: 'actions', icon: EnvelopeIcon },
  { id: 'sheets', category: 'actions', icon: TableCellsIcon },
  { id: 'stripe', category: 'actions', icon: CreditCardIcon },
  { id: 'salesforce', category: 'actions', icon: BuildingOffice2Icon },

  { id: 'llm', category: 'ai', icon: SparklesIcon },
  { id: 'embedding', category: 'ai', icon: CpuChipIcon },
  { id: 'rag', category: 'ai', icon: DocumentMagnifyingGlassIcon },
  { id: 'vision', category: 'ai', icon: EyeIcon },
  { id: 'stt', category: 'ai', icon: MicrophoneIcon },
  { id: 'structured', category: 'ai', icon: CommandLineIcon },

  { id: 'filter', category: 'logic', icon: FunnelIcon },
  { id: 'switch', category: 'logic', icon: ArrowsRightLeftIcon },
  { id: 'loop', category: 'logic', icon: ArrowUturnLeftIcon },
  { id: 'merge', category: 'logic', icon: Squares2X2Icon },
  { id: 'wait', category: 'logic', icon: PauseIcon },
  { id: 'subflow', category: 'logic', icon: Squares2X2Icon },

  { id: 'js', category: 'code', icon: CodeBracketIcon },
  { id: 'python', category: 'code', icon: CodeBracketIcon },
  { id: 'transform', category: 'code', icon: ArrowsRightLeftIcon },
];

const CATEGORIES: CategoryKey[] = ['triggers', 'actions', 'ai', 'logic', 'code'];

interface Props {
  onOpenCode: () => void;
}

export default function NodePalette({ onOpenCode }: Props) {
  const t = useTranslations('demoAutomation.palette');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<CategoryKey, boolean>>({
    triggers: true,
    actions: true,
    ai: true,
    logic: false,
    code: false,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ITEMS;
    return ITEMS.filter((i) => t(`items.${i.id}`).toLowerCase().includes(q));
  }, [search, t]);

  const toggle = (c: CategoryKey) =>
    setExpanded((p) => ({ ...p, [c]: !p[c] }));

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-secondary-800">
        <h3 className="text-xs font-semibold text-secondary-300 uppercase tracking-wider mb-2">
          {t('title')}
        </h3>
        <div className="relative">
          <MagnifyingGlassIcon className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-8 pr-2 py-1.5 text-xs bg-secondary-900 border border-secondary-800 rounded-md text-secondary-200 placeholder-secondary-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
        {CATEGORIES.map((cat) => {
          const items = filtered.filter((i) => i.category === cat);
          if (items.length === 0 && search) return null;
          const open = expanded[cat] || !!search;
          return (
            <div key={cat}>
              <button
                onClick={() => toggle(cat)}
                className="w-full flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-secondary-400 hover:text-secondary-200 uppercase tracking-wider"
              >
                {open ? (
                  <ChevronDownIcon className="h-3 w-3" />
                ) : (
                  <ChevronRightIcon className="h-3 w-3" />
                )}
                {t(`categories.${cat}`)}
                <span className="ml-auto text-secondary-600 normal-case">
                  {items.length}
                </span>
              </button>
              {open && (
                <div className="mt-1 space-y-0.5">
                  {items.map((it) => {
                    const Icon = it.icon;
                    const isCode = it.category === 'code';
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={isCode ? onOpenCode : undefined}
                        draggable
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-secondary-300 hover:bg-secondary-800 hover:text-white cursor-grab active:cursor-grabbing transition-colors"
                      >
                        <Icon className="h-3.5 w-3.5 text-secondary-400" />
                        <span className="truncate">{t(`items.${it.id}`)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
