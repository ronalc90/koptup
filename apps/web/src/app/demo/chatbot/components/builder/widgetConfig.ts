/**
 * Tipos y constantes locales del modo Builder.
 * Separan la "fuente de verdad" de la config del widget para que cada
 * sub-componente reciba sólo props serializables.
 */

export type WidgetCornerPosition = 'br' | 'bl' | 'tr' | 'tl';
export type BuilderToneKey = 'professional' | 'friendly' | 'technical' | 'casual';
export type BuilderLangCode = 'es' | 'en' | 'pt' | 'fr';
export type EmbedTabKey = 'script' | 'iframe' | 'react' | 'webhook';

export interface MockKnowledgeDoc {
  id: string;
  name: string;
  sizeKb: number;
  chunks: number;
}

export interface BuilderWidgetConfig {
  botName: string;
  primaryColor: string;
  position: WidgetCornerPosition;
  avatar: string;
  /**
   * Imagen de logo opcional (data URL `data:image/...;base64,...`). Cuando
   * está set, el widget la prioriza por sobre el emoji `avatar`. Mantener
   * ambas posibilidades es coherente con OCP: agregamos comportamiento sin
   * modificar el código que ya consume `avatar`.
   */
  avatarImage?: string;
  welcome: string;
  systemPrompt: string;
  tone: BuilderToneKey;
  languages: BuilderLangCode[];
  docs: MockKnowledgeDoc[];
  botId: string;
}

/** Tamaño máximo aceptado para el logo subido por el usuario (500 KB). */
export const AVATAR_IMAGE_MAX_BYTES = 500 * 1024;
export const AVATAR_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/** Emoji set acotado para el selector de avatar. */
export const AVATAR_CHOICES: readonly string[] = ['🤖', '💬', '✨', '🎯', '🚀', '🦊'];

export const TONE_CHOICES: readonly BuilderToneKey[] = [
  'professional',
  'friendly',
  'technical',
  'casual',
];

export const LANG_CHOICES: readonly { code: BuilderLangCode; label: string }[] = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'pt', label: 'PT' },
  { code: 'fr', label: 'FR' },
];

export const MOCK_DOCS: MockKnowledgeDoc[] = [
  { id: 'd-pricing', name: 'pricing.pdf', sizeKb: 412, chunks: 28 },
  { id: 'd-policy', name: 'data-retention-policy.docx', sizeKb: 188, chunks: 14 },
  { id: 'd-onboard', name: 'onboarding-guide.md', sizeKb: 76, chunks: 9 },
  { id: 'd-faq', name: 'faq.txt', sizeKb: 32, chunks: 6 },
  { id: 'd-sla', name: 'enterprise-sla.pdf', sizeKb: 540, chunks: 41 },
];

export const DEFAULT_BOT_ID = 'kbot_demo_acme';

/** Mapea el código de esquina a clases utilitarias para posicionar absolutamente. */
export const POSITION_CLASS: Record<WidgetCornerPosition, string> = {
  br: 'bottom-4 right-4 items-end',
  bl: 'bottom-4 left-4 items-start',
  tr: 'top-4 right-4 items-end',
  tl: 'top-4 left-4 items-start',
};

/** Origen del panel desplegado (para que abra "hacia el centro"). */
export const PANEL_ORIGIN: Record<WidgetCornerPosition, string> = {
  br: 'bottom-16 right-0',
  bl: 'bottom-16 left-0',
  tr: 'top-16 right-0',
  tl: 'top-16 left-0',
};
