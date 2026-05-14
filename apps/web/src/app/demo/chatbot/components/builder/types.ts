/**
 * Tipos compartidos del Builder & Embed.
 * Mantienen una sola fuente de verdad para la config del widget.
 */

export type WidgetPosition = 'br' | 'bl';
export type WidgetShape = 'round' | 'square';
export type ToneKey = 'professional' | 'friendly' | 'technical' | 'casual';
export type EmbedTabKey = 'script' | 'iframe' | 'react' | 'webhook';
export type LangCode = 'es' | 'en' | 'pt' | 'fr';

export interface KnowledgeDoc {
  id: string;
  name: string;
  sizeKb: number;
  chunks: number;
}

export interface BuilderConfig {
  botName: string;
  welcome: string;
  placeholder: string;
  systemPrompt: string;
  primaryColor: string;
  accentColor: string;
  position: WidgetPosition;
  shape: WidgetShape;
  avatar: string;
  tone: ToneKey;
  languages: LangCode[];
  openOnLoad: boolean;
  showBranding: boolean;
  docs: KnowledgeDoc[];
  botId: string;
}

export const AVATAR_OPTIONS = ['🤖', '💬', '🚀', '✨', '🧠', '👋', '💡', '🛟'] as const;

export const TONE_OPTIONS: ToneKey[] = ['professional', 'friendly', 'technical', 'casual'];

export const LANG_OPTIONS: { code: LangCode; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
];

export const SAMPLE_DOCS: KnowledgeDoc[] = [
  { id: 'd-pricing', name: 'pricing.pdf', sizeKb: 412, chunks: 28 },
  { id: 'd-policy', name: 'data-retention-policy.docx', sizeKb: 188, chunks: 14 },
  { id: 'd-onboard', name: 'onboarding-guide.md', sizeKb: 76, chunks: 9 },
  { id: 'd-faq', name: 'faq.txt', sizeKb: 32, chunks: 6 },
  { id: 'd-sla', name: 'enterprise-sla.pdf', sizeKb: 540, chunks: 41 },
];

export function makeBotId(): string {
  const seg = () =>
    Math.random().toString(36).slice(2, 8);
  return `kbot_${seg()}${seg()}`;
}

export function defaultConfig(t: (k: string) => string): BuilderConfig {
  return {
    botName: 'Koptup Assistant',
    welcome: t('chat.assistant') + ' · ' + t('chat.subtitle'),
    placeholder: t('chat.placeholder'),
    systemPrompt:
      'You are a helpful enterprise assistant grounded in the uploaded knowledge base. Cite sources when possible.',
    primaryColor: '#4F46E5',
    accentColor: '#9333EA',
    position: 'br',
    shape: 'round',
    avatar: '🤖',
    tone: 'professional',
    languages: ['es', 'en'],
    openOnLoad: false,
    showBranding: true,
    docs: SAMPLE_DOCS.slice(0, 2),
    botId: makeBotId(),
  };
}
