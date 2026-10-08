import type { ComponentType, SVGProps } from 'react';
import {
  AcademicCapIcon,
  BoltIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  CommandLineIcon,
  ComputerDesktopIcon,
  CpuChipIcon,
  DocumentCheckIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  HeartIcon,
  LifebuoyIcon,
  MapIcon,
  MegaphoneIcon,
  MicrophoneIcon,
  PencilIcon,
  PencilSquareIcon,
  RectangleStackIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  Squares2X2Icon,
  StarIcon,
  TruckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Tarjeta de una demo: de dónde salen sus textos (`<ns>.<key>.title`,
 * `.description`, `.badge` y `.features.0..3`), su ícono y su color.
 * La usan el hub /demo (en este orden) y la vista previa de /demo-acceso.
 */
export interface DemoCardDef {
  slug: string;
  ns: 'demos' | 'demosExtra';
  key: string;
  icon: Icon;
  color: string;
}

/** Tarjetas del hub /demo, en el orden de DEMO_CATALOG_SLUGS (src/lib/demos.ts). */
export const DEMO_CARDS: readonly DemoCardDef[] = [
  { slug: 'chatbot', ns: 'demos', key: 'chatbot', icon: ChatBubbleLeftRightIcon, color: 'from-primary-600 to-primary-800' },
  { slug: 'ecommerce', ns: 'demos', key: 'ecommerce', icon: ShoppingCartIcon, color: 'from-green-600 to-emerald-800' },
  { slug: 'dashboard-ejecutivo', ns: 'demos', key: 'executive', icon: ChartBarIcon, color: 'from-purple-600 to-purple-800' },
  { slug: 'gestor-documentos', ns: 'demos', key: 'documents', icon: DocumentTextIcon, color: 'from-blue-600 to-blue-800' },
  { slug: 'sistema-reservas', ns: 'demos', key: 'reservations', icon: CalendarIcon, color: 'from-orange-600 to-orange-800' },
  { slug: 'gestor-contenido', ns: 'demos', key: 'contentManager', icon: PencilSquareIcon, color: 'from-pink-600 to-pink-800' },
  { slug: 'control-proyectos', ns: 'demos', key: 'projects', icon: RectangleStackIcon, color: 'from-teal-600 to-teal-800' },
  { slug: 'crm-ia', ns: 'demosExtra', key: 'crm', icon: BriefcaseIcon, color: 'from-indigo-600 to-indigo-800' },
  { slug: 'erp', ns: 'demosExtra', key: 'erp', icon: BuildingOfficeIcon, color: 'from-amber-600 to-amber-800' },
  { slug: 'helpdesk-ia', ns: 'demosExtra', key: 'helpdesk', icon: LifebuoyIcon, color: 'from-rose-600 to-rose-800' },
  { slug: 'lms', ns: 'demosExtra', key: 'lms', icon: AcademicCapIcon, color: 'from-cyan-600 to-cyan-800' },
  { slug: 'telemedicina', ns: 'demosExtra', key: 'telemedicina', icon: HeartIcon, color: 'from-red-600 to-rose-800' },
  { slug: 'facturacion-electronica', ns: 'demosExtra', key: 'billing', icon: DocumentCheckIcon, color: 'from-emerald-600 to-emerald-800' },
  { slug: 'wms-logistica', ns: 'demosExtra', key: 'wms', icon: TruckIcon, color: 'from-stone-600 to-stone-800' },
  { slug: 'pos', ns: 'demosExtra', key: 'pos', icon: ComputerDesktopIcon, color: 'from-fuchsia-600 to-fuchsia-800' },
  { slug: 'hrms', ns: 'demosExtra', key: 'hrms', icon: UserGroupIcon, color: 'from-violet-600 to-violet-800' },
  { slug: 'automatizacion', ns: 'demosExtra', key: 'automation', icon: BoltIcon, color: 'from-yellow-600 to-orange-700' },
  { slug: 'saas-boilerplate', ns: 'demosExtra', key: 'saas', icon: Squares2X2Icon, color: 'from-slate-600 to-slate-800' },
  { slug: 'voice-ai', ns: 'demosExtra', key: 'voice', icon: MicrophoneIcon, color: 'from-sky-600 to-sky-800' },
  { slug: 'firma-electronica', ns: 'demosExtra', key: 'sign', icon: PencilIcon, color: 'from-lime-600 to-lime-800' },
  { slug: 'scraping', ns: 'demosExtra', key: 'scraping', icon: GlobeAltIcon, color: 'from-zinc-600 to-zinc-800' },
  { slug: 'code-review-ia', ns: 'demosExtra', key: 'codeReview', icon: CommandLineIcon, color: 'from-neutral-700 to-neutral-900' },
  { slug: 'moderacion-contenido', ns: 'demosExtra', key: 'moderation', icon: ShieldCheckIcon, color: 'from-red-700 to-red-900' },
  { slug: 'delivery', ns: 'demosExtra', key: 'delivery', icon: MapIcon, color: 'from-orange-500 to-red-600' },
  { slug: 'loyalty', ns: 'demosExtra', key: 'loyalty', icon: StarIcon, color: 'from-yellow-500 to-amber-600' },
  { slug: 'linkedin-ads', ns: 'demos', key: 'linkedin', icon: MegaphoneIcon, color: 'from-blue-600 to-violet-700' },
];

/**
 * Demos que no tienen tarjeta en el hub (se abren por invitación): su vista
 * previa sale de `demoAccess.preview.<key>` (título, descripción y 3 puntos).
 */
export interface ExtraDemoDef {
  slug: string;
  key: string;
  icon: Icon;
  color: string;
}

export const EXTRA_DEMOS: readonly ExtraDemoDef[] = [
  { slug: 'cuentas-medicas', key: 'cuentasMedicas', icon: ClipboardDocumentCheckIcon, color: 'from-blue-600 to-blue-800' },
  { slug: 'sistema-experto', key: 'sistemaExperto', icon: CpuChipIcon, color: 'from-indigo-600 to-indigo-800' },
];

export const DEMO_CARD_BY_SLUG: Readonly<Record<string, DemoCardDef>> = Object.fromEntries(DEMO_CARDS.map((c) => [c.slug, c]));
export const EXTRA_DEMO_BY_SLUG: Readonly<Record<string, ExtraDemoDef>> = Object.fromEntries(EXTRA_DEMOS.map((c) => [c.slug, c]));
