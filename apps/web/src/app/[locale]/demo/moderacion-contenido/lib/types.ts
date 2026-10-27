/**
 * Tipos de la demo de moderación de contenido. Todo vive en el navegador:
 * no hay servidor de moderación ni modelo de IA detrás de la cola.
 */

export type Lang = 'es' | 'en';
export type Bilingual = { es: string; en: string };

export type ContentType = 'text' | 'image' | 'video' | 'audio';

export const CATEGORIES = [
  'minors',
  'selfHarm',
  'sexual',
  'hate',
  'harassment',
  'scam',
  'impersonation',
  'illegalLending',
  'offPlatform',
  'fakeReview',
  'spam',
] as const;
export type CategoryKey = (typeof CATEGORIES)[number];
/** Resultado de clasificar: una categoría o «sin infracción». */
export type Label = CategoryKey | 'none';

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type Priority = 'critical' | 'high' | 'medium' | 'low';

export const PLATFORMS = ['marketplace', 'media', 'education', 'fintech', 'jobs'] as const;
export type PlatformId = (typeof PLATFORMS)[number];
export type PlatformView = PlatformId | 'all';

export type Reporter = 'auto' | 'user' | 'trusted' | 'you';
export type Channel = 'listing' | 'comments' | 'chat' | 'reviews' | 'profile' | 'forum' | 'jobs' | 'support' | 'test';

export const RULE_ACTIONS = ['autoReject', 'warn', 'limit', 'humanReview', 'escalate', 'autoApprove'] as const;
export type RuleAction = (typeof RULE_ACTIONS)[number];
export type Operator = 'gt' | 'lt' | 'between';

export interface Rule {
  id: string;
  category: CategoryKey | 'any';
  operator: Operator;
  /** Umbral de confianza entre 0 y 1. */
  threshold: number;
  /** Segundo umbral (solo con «entre»). */
  threshold2?: number;
  action: RuleAction;
  active: boolean;
}

export type Measure = 'remove' | 'removeWarn' | 'suspend';
export type Team = 'minors' | 'legal' | 'fraud' | 'lead';

export type CaseStatus = 'pending' | 'approved' | 'rejected' | 'escalated' | 'auto';

export interface Decision {
  kind: 'approve' | 'reject' | 'escalate' | 'auto';
  at: string;
  policy?: Label;
  measure?: Measure;
  team?: Team;
  note?: string;
  /** Acción automática y número de regla (decisiones de las reglas). */
  ruleAction?: RuleAction;
  ruleNo?: number;
  /** Segundos que tardaste en decidir desde que abriste el caso. */
  seconds?: number;
}

export interface CaseItem {
  id: string;
  type: ContentType;
  /** Caso de ejemplo (texto en samples.ts) o texto que escribiste tú. */
  source: 'sample' | 'yours';
  text?: string;
  platforms: PlatformId[];
  user: string;
  channel: Channel;
  reporter: Reporter;
  strikes: number;
  accountAgeDays: number;
  receivedAt: string;
  sensitive: boolean;
  status: CaseStatus;
  /** Categoría corregida por quien modera (reemplaza la del clasificador). */
  override?: Label;
  decision?: Decision;
}

export type AppealOriginal = 'rejected' | 'limited' | 'warned';
export interface Appeal {
  id: string;
  caseRef: string;
  original: AppealOriginal;
  category: CategoryKey;
  reason: Bilingual | string;
  receivedAt: string;
  reviewer: string;
  status: 'open' | 'upheld' | 'reversed';
  resolvedAt?: string;
  note?: string;
}

export type AuditAction =
  | 'approve'
  | 'reject'
  | 'escalate'
  | 'recategorize'
  | 'reopen'
  | 'autoRule'
  | 'appealUphold'
  | 'appealReverse'
  | 'rulesEdit'
  | 'caseCreated';

export const AUDIT_ACTIONS: AuditAction[] = [
  'approve',
  'reject',
  'escalate',
  'recategorize',
  'reopen',
  'autoRule',
  'appealUphold',
  'appealReverse',
  'rulesEdit',
  'caseCreated',
];

export interface AuditActor {
  kind: 'you' | 'person' | 'rule' | 'system';
  name?: string;
  ruleNo?: number;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: AuditActor;
  action: AuditAction;
  target: string;
  policy?: Label;
  measure?: Measure;
  team?: Team;
  from?: Label;
  to?: Label;
  ruleAction?: RuleAction;
  changes?: number;
  note?: Bilingual | string;
}

export interface Checkin {
  at: string;
  mood: number;
  rotate: boolean;
  talk: boolean;
}

export interface Session {
  startedAt: string;
  lastBreakAt: string;
  decisions: number;
  decisionSeconds: number;
  timedDecisions: number;
  reveals: number;
  pauses: number;
  corrections: number;
}

export interface Wellness {
  blurDefault: boolean;
  rotation: boolean;
  checkins: Checkin[];
}

export interface ModState {
  version: number;
  createdAt: string;
  platform: PlatformView;
  cases: CaseItem[];
  rules: Rule[];
  /** Borrador del editor de reglas (null si no hay cambios sin guardar). */
  draft: Rule[] | null;
  appeals: Appeal[];
  audit: AuditEntry[];
  seq: number;
  session: Session;
  wellness: Wellness;
}

export type TabKey = 'dashboard' | 'queue' | 'classifier' | 'rules' | 'appeals' | 'audit' | 'report' | 'metrics' | 'api';
export const TABS: TabKey[] = ['dashboard', 'queue', 'classifier', 'rules', 'appeals', 'audit', 'report', 'metrics', 'api'];
