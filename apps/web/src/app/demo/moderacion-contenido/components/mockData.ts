// Mock data — Moderación de Contenido con IA
// Solo datos de demostración; no usar en producción.

export type ContentType = 'text' | 'image' | 'video' | 'audio';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type Vertical = 'gaming' | 'dating' | 'kids' | 'finance' | 'social';
export type CategoryKey =
  | 'nsfw'
  | 'violence'
  | 'hate'
  | 'spam'
  | 'fraud'
  | 'childSafety'
  | 'selfHarm'
  | 'harassment';

export interface QueueItem {
  id: string;
  type: ContentType;
  priority: Priority;
  category: CategoryKey;
  confidence: number; // 0..100
  preview: string; // texto literal o caption descriptiva
  user: string;
  channel: string;
  submittedAt: string; // ISO
  reporter: 'user' | 'system' | 'partner';
  previousStrikes: number;
  accountAge: string;
  needsBlur: boolean;
}

export interface AppealItem {
  id: string;
  originalDecision: 'rejected' | 'shadowBanned' | 'warned';
  category: CategoryKey;
  reason: string;
  submittedAt: string;
  slaHoursRemaining: number;
  reviewer: string;
  status: 'open' | 'inReview' | 'resolved' | 'overdue';
}

export interface AuditEntry {
  id: string;
  when: string;
  who: string;
  action:
    | 'approve'
    | 'reject'
    | 'escalate'
    | 'editTag'
    | 'appealUphold'
    | 'appealReverse'
    | 'ruleEdit';
  target: string;
  reason: string;
}

export interface RuleNode {
  id: string;
  category: CategoryKey;
  operator: 'gt' | 'lt' | 'between';
  threshold: number;
  threshold2?: number;
  action:
    | 'autoReject'
    | 'humanReview'
    | 'autoApprove'
    | 'shadowBan'
    | 'warnUser'
    | 'escalateLegal';
  active: boolean;
}

export interface ClassifierStats {
  modality: ContentType;
  model: string;
  version: string;
  languages: number;
  throughput: string;
  latencyP95: string;
  precision: number;
  recall: number;
  categoriesCovered: number;
  lastTrained: string;
  perCategory: Array<{ key: CategoryKey; precision: number; recall: number }>;
}

export const QUEUE_ITEMS: QueueItem[] = [
  {
    id: 'q-1042',
    type: 'image',
    priority: 'critical',
    category: 'nsfw',
    confidence: 97,
    preview: 'Imagen subida en perfil público con detección de desnudez explícita.',
    user: '@lucia_84',
    channel: 'profile-photos',
    submittedAt: '2026-05-14T13:42:00Z',
    reporter: 'system',
    previousStrikes: 2,
    accountAge: '4 meses',
    needsBlur: true,
  },
  {
    id: 'q-1043',
    type: 'text',
    priority: 'high',
    category: 'hate',
    confidence: 89,
    preview: 'Comentario con lenguaje discriminatorio dirigido a grupo religioso minoritario.',
    user: '@throwaway_77',
    channel: 'public-comments',
    submittedAt: '2026-05-14T13:51:00Z',
    reporter: 'user',
    previousStrikes: 0,
    accountAge: '11 días',
    needsBlur: false,
  },
  {
    id: 'q-1044',
    type: 'video',
    priority: 'critical',
    category: 'violence',
    confidence: 94,
    preview: 'Clip de 12s con escena de agresión física y audio explícito.',
    user: '@gamer_x',
    channel: 'live-clips',
    submittedAt: '2026-05-14T13:55:00Z',
    reporter: 'partner',
    previousStrikes: 1,
    accountAge: '2 años',
    needsBlur: true,
  },
  {
    id: 'q-1045',
    type: 'text',
    priority: 'medium',
    category: 'spam',
    confidence: 76,
    preview: 'Mensaje masivo con enlace acortado promocionando inversión sospechosa.',
    user: '@invest_now',
    channel: 'dm',
    submittedAt: '2026-05-14T14:01:00Z',
    reporter: 'system',
    previousStrikes: 3,
    accountAge: '6 días',
    needsBlur: false,
  },
  {
    id: 'q-1046',
    type: 'audio',
    priority: 'high',
    category: 'harassment',
    confidence: 83,
    preview: 'Nota de voz en chat de juego con insultos personales reiterados.',
    user: '@nightbot',
    channel: 'voice-chat',
    submittedAt: '2026-05-14T14:08:00Z',
    reporter: 'user',
    previousStrikes: 1,
    accountAge: '7 meses',
    needsBlur: false,
  },
  {
    id: 'q-1047',
    type: 'image',
    priority: 'critical',
    category: 'childSafety',
    confidence: 99,
    preview: 'Imagen flageada por detector CSAM. Reportada automáticamente a NCMEC.',
    user: '@anonymous_412',
    channel: 'uploads',
    submittedAt: '2026-05-14T14:12:00Z',
    reporter: 'system',
    previousStrikes: 0,
    accountAge: '2 días',
    needsBlur: true,
  },
  {
    id: 'q-1048',
    type: 'text',
    priority: 'medium',
    category: 'fraud',
    confidence: 71,
    preview: 'Oferta sospechosa de duplicación de cripto activos en canal financiero.',
    user: '@cryptolord',
    channel: 'finance-forum',
    submittedAt: '2026-05-14T14:18:00Z',
    reporter: 'user',
    previousStrikes: 4,
    accountAge: '1 año',
    needsBlur: false,
  },
  {
    id: 'q-1049',
    type: 'text',
    priority: 'low',
    category: 'selfHarm',
    confidence: 62,
    preview: 'Post que sugiere ideación pero no acción inmediata — flujo de apoyo activo.',
    user: '@sky.blue',
    channel: 'public-feed',
    submittedAt: '2026-05-14T14:22:00Z',
    reporter: 'system',
    previousStrikes: 0,
    accountAge: '3 años',
    needsBlur: false,
  },
];

export const APPEALS: AppealItem[] = [
  {
    id: 'a-501',
    originalDecision: 'rejected',
    category: 'hate',
    reason: 'El usuario alega contexto satírico y referencia cultural.',
    submittedAt: '2026-05-14T08:10:00Z',
    slaHoursRemaining: 6.5,
    reviewer: 'L. Mendoza',
    status: 'inReview',
  },
  {
    id: 'a-502',
    originalDecision: 'shadowBanned',
    category: 'spam',
    reason: 'Cuenta reclama uso legítimo de enlaces de afiliación.',
    submittedAt: '2026-05-13T22:40:00Z',
    slaHoursRemaining: 1.2,
    reviewer: 'D. Pérez',
    status: 'open',
  },
  {
    id: 'a-503',
    originalDecision: 'warned',
    category: 'harassment',
    reason: 'Captura demuestra que la respuesta fue defensiva.',
    submittedAt: '2026-05-12T19:00:00Z',
    slaHoursRemaining: -3.0,
    reviewer: 'M. Suárez',
    status: 'overdue',
  },
  {
    id: 'a-504',
    originalDecision: 'rejected',
    category: 'nsfw',
    reason: 'Material artístico con clasificación educativa.',
    submittedAt: '2026-05-14T11:15:00Z',
    slaHoursRemaining: 14.0,
    reviewer: 'C. Núñez',
    status: 'open',
  },
];

export const AUDIT: AuditEntry[] = [
  {
    id: 'au-9001',
    when: '2026-05-14T14:22:00Z',
    who: 'C. Núñez',
    action: 'reject',
    target: 'q-1042',
    reason: 'Violación de política NSFW — contenido explícito.',
  },
  {
    id: 'au-9002',
    when: '2026-05-14T14:19:00Z',
    who: 'L. Mendoza',
    action: 'escalate',
    target: 'q-1047',
    reason: 'Posible CSAM — escalado a equipo de seguridad infantil.',
  },
  {
    id: 'au-9003',
    when: '2026-05-14T14:11:00Z',
    who: 'sistema',
    action: 'editTag',
    target: 'q-1045',
    reason: 'Reclasificado de "spam" a "fraud" por regla actualizada.',
  },
  {
    id: 'au-9004',
    when: '2026-05-14T13:58:00Z',
    who: 'D. Pérez',
    action: 'appealReverse',
    target: 'a-498',
    reason: 'Evidencia adicional aportada por el usuario.',
  },
  {
    id: 'au-9005',
    when: '2026-05-14T13:50:00Z',
    who: 'M. Suárez',
    action: 'approve',
    target: 'q-1041',
    reason: 'Falso positivo — contenido cumple política.',
  },
  {
    id: 'au-9006',
    when: '2026-05-14T13:31:00Z',
    who: 'admin',
    action: 'ruleEdit',
    target: 'rule-hate-08',
    reason: 'Umbral elevado de 0.78 a 0.82 tras revisión semanal.',
  },
];

export const DEFAULT_RULES: RuleNode[] = [
  { id: 'r-1', category: 'hate', operator: 'gt', threshold: 0.85, action: 'autoReject', active: true },
  { id: 'r-2', category: 'hate', operator: 'between', threshold: 0.5, threshold2: 0.85, action: 'humanReview', active: true },
  { id: 'r-3', category: 'childSafety', operator: 'gt', threshold: 0.7, action: 'escalateLegal', active: true },
  { id: 'r-4', category: 'nsfw', operator: 'gt', threshold: 0.9, action: 'autoReject', active: true },
  { id: 'r-5', category: 'spam', operator: 'gt', threshold: 0.8, action: 'shadowBan', active: true },
  { id: 'r-6', category: 'selfHarm', operator: 'gt', threshold: 0.4, action: 'humanReview', active: true },
  { id: 'r-7', category: 'fraud', operator: 'gt', threshold: 0.75, action: 'warnUser', active: false },
];

export const CLASSIFIER_STATS: ClassifierStats[] = [
  {
    modality: 'text',
    model: 'koptup-text-mod',
    version: 'v3.4.1',
    languages: 18,
    throughput: '12.4k req/s',
    latencyP95: '42ms',
    precision: 96.1,
    recall: 91.8,
    categoriesCovered: 8,
    lastTrained: '2026-05-02',
    perCategory: [
      { key: 'hate', precision: 95.2, recall: 90.4 },
      { key: 'spam', precision: 98.3, recall: 96.1 },
      { key: 'fraud', precision: 92.4, recall: 88.7 },
      { key: 'harassment', precision: 94.0, recall: 89.5 },
      { key: 'selfHarm', precision: 91.6, recall: 87.9 },
    ],
  },
  {
    modality: 'image',
    model: 'koptup-vision-mod',
    version: 'v2.7.0',
    languages: 0,
    throughput: '4.2k img/s',
    latencyP95: '110ms',
    precision: 94.8,
    recall: 92.3,
    categoriesCovered: 6,
    lastTrained: '2026-04-21',
    perCategory: [
      { key: 'nsfw', precision: 97.8, recall: 95.6 },
      { key: 'violence', precision: 93.1, recall: 90.4 },
      { key: 'childSafety', precision: 99.4, recall: 97.2 },
    ],
  },
  {
    modality: 'video',
    model: 'koptup-video-mod',
    version: 'v1.9.3',
    languages: 0,
    throughput: '820 clips/min',
    latencyP95: '1.8s',
    precision: 92.0,
    recall: 88.5,
    categoriesCovered: 5,
    lastTrained: '2026-04-15',
    perCategory: [
      { key: 'nsfw', precision: 94.0, recall: 90.0 },
      { key: 'violence', precision: 92.6, recall: 89.4 },
    ],
  },
  {
    modality: 'audio',
    model: 'koptup-audio-mod',
    version: 'v1.4.0',
    languages: 12,
    throughput: '2.1k min/h',
    latencyP95: '320ms',
    precision: 89.3,
    recall: 85.7,
    categoriesCovered: 4,
    lastTrained: '2026-04-30',
    perCategory: [
      { key: 'hate', precision: 90.2, recall: 86.1 },
      { key: 'harassment', precision: 88.4, recall: 84.9 },
    ],
  },
];

export const TRANSPARENCY_BY_MONTH = [
  { month: 'Feb', takedowns: 18420 },
  { month: 'Mar', takedowns: 21030 },
  { month: 'Abr', takedowns: 22480 },
  { month: 'May', takedowns: 19850 },
];

export const TRANSPARENCY_BY_CATEGORY: Array<{ key: CategoryKey; value: number }> = [
  { key: 'spam', value: 32 },
  { key: 'nsfw', value: 22 },
  { key: 'hate', value: 14 },
  { key: 'harassment', value: 11 },
  { key: 'fraud', value: 9 },
  { key: 'violence', value: 7 },
  { key: 'selfHarm', value: 3 },
  { key: 'childSafety', value: 2 },
];

export const METRICS_BY_CATEGORY: Array<{
  key: CategoryKey;
  precision: number;
  recall: number;
  fpr: number;
  ttm: string;
  volume: number;
}> = [
  { key: 'nsfw', precision: 97.8, recall: 95.6, fpr: 0.9, ttm: '38s', volume: 124000 },
  { key: 'violence', precision: 93.1, recall: 90.4, fpr: 1.8, ttm: '52s', volume: 41000 },
  { key: 'hate', precision: 95.2, recall: 90.4, fpr: 1.5, ttm: '44s', volume: 87000 },
  { key: 'spam', precision: 98.3, recall: 96.1, fpr: 0.6, ttm: '12s', volume: 320000 },
  { key: 'fraud', precision: 92.4, recall: 88.7, fpr: 2.4, ttm: '1m 10s', volume: 56000 },
  { key: 'childSafety', precision: 99.4, recall: 97.2, fpr: 0.2, ttm: '8s', volume: 12000 },
  { key: 'selfHarm', precision: 91.6, recall: 87.9, fpr: 2.1, ttm: '1m 20s', volume: 18000 },
  { key: 'harassment', precision: 94.0, recall: 89.5, fpr: 1.7, ttm: '48s', volume: 73000 },
];

export const CATEGORY_COLORS: Record<CategoryKey, string> = {
  nsfw: 'bg-pink-500/15 text-pink-600 dark:text-pink-300 border border-pink-500/30',
  violence: 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30',
  hate: 'bg-orange-500/15 text-orange-600 dark:text-orange-300 border border-orange-500/30',
  spam: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border border-yellow-500/30',
  fraud: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
  childSafety: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30',
  selfHarm: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300 border border-fuchsia-500/30',
  harassment: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-400 text-yellow-900',
  low: 'bg-secondary-300 text-secondary-900 dark:bg-secondary-700 dark:text-secondary-100',
};

export const VERTICAL_RULES: Record<Vertical, CategoryKey[]> = {
  gaming: ['harassment', 'hate', 'fraud', 'spam'],
  dating: ['nsfw', 'harassment', 'fraud', 'spam'],
  kids: ['childSafety', 'nsfw', 'violence', 'hate', 'selfHarm'],
  finance: ['fraud', 'spam', 'hate'],
  social: ['nsfw', 'violence', 'hate', 'spam', 'harassment', 'selfHarm'],
};
