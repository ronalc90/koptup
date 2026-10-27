import type { ComponentType } from 'react';
import {
  ArrowsRightLeftIcon,
  BanknotesIcon,
  BookOpenIcon,
  BuildingLibraryIcon,
  ChatBubbleLeftEllipsisIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CodeBracketIcon,
  DocumentMagnifyingGlassIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon,
  FunnelIcon,
  GlobeAltIcon,
  PauseIcon,
  PencilSquareIcon,
  TableCellsIcon,
  TagIcon,
  UserGroupIcon,
  UserPlusIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import type { Category, StepType } from '../lib/types';

export const TYPE_ICONS: Record<StepType, ComponentType<{ className?: string }>> = {
  'trigger.email': EnvelopeOpenIcon,
  'trigger.webhook': BoltIcon,
  'trigger.schedule': ClockIcon,
  'trigger.chat': ChatBubbleLeftRightIcon,
  'ai.extract': DocumentMagnifyingGlassIcon,
  'ai.classify': TagIcon,
  'ai.draft': PencilSquareIcon,
  'ai.rag': BookOpenIcon,
  'app.sheet': TableCellsIcon,
  'app.accounting': BuildingLibraryIcon,
  'app.crm': UserPlusIcon,
  'app.payment': BanknotesIcon,
  'app.http': GlobeAltIcon,
  'notify.chat': ChatBubbleLeftEllipsisIcon,
  'notify.email': EnvelopeIcon,
  'logic.condition': FunnelIcon,
  'logic.wait': PauseIcon,
  'logic.assign': UserGroupIcon,
  'code.js': CodeBracketIcon,
  'code.map': ArrowsRightLeftIcon,
};

/** Colores por categoría (fondo, borde y texto del nodo). */
export const CATEGORY_COLORS: Record<Category, string> = {
  triggers: 'from-amber-500/20 to-amber-600/10 border-amber-500/50 text-amber-300',
  ai: 'from-fuchsia-500/20 to-fuchsia-600/10 border-fuchsia-500/50 text-fuchsia-300',
  apps: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/50 text-emerald-300',
  notify: 'from-rose-500/20 to-rose-600/10 border-rose-500/50 text-rose-300',
  logic: 'from-sky-500/20 to-sky-600/10 border-sky-500/50 text-sky-300',
  code: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/50 text-indigo-300',
};
