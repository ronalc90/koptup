/**
 * Tipos y utilidades del modo "Configura el tuyo" (Builder).
 *
 * La configuración se guarda en el backend (`/api/chatbot/bots`); aquí solo
 * hay campos que el backend persiste y que el widget real usa: nombre,
 * bienvenida, color, posición, ícono, instrucciones y tono.
 */
import type { BotPosition, RemoteBotConfig } from './api';

export type WidgetCornerPosition = BotPosition;
export type BuilderToneKey = 'professional' | 'friendly' | 'technical' | 'casual';

export interface BuilderWidgetConfig {
  botName: string;
  primaryColor: string;
  position: WidgetCornerPosition;
  avatar: string;
  welcome: string;
  /** Instrucciones de rol y estilo (sin la línea de tono, que se agrega al guardar). */
  instructions: string;
  tone: BuilderToneKey;
}

export const AVATAR_CHOICES: readonly string[] = ['💬', '🤖', '✨', '🎯', '🚀', '🦊'];

export const TONE_CHOICES: readonly BuilderToneKey[] = ['professional', 'friendly', 'technical', 'casual'];

export const POSITIONS: readonly WidgetCornerPosition[] = ['br', 'bl', 'tr', 'tl'];

/** Formatos que la ruta de bots del backend sabe leer (texto plano). */
export const TEXT_EXTENSIONS: readonly string[] = ['.txt', '.md', '.csv'];
export const MAX_TEXT_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 5;

const HEX = /^#[0-9a-f]{6}$/i;
export const isHexColor = (v: string) => HEX.test(v);

/** Prefijos de la línea de tono en ES y EN (para separarla al cargar un bot). */
const TONE_LINE_PATTERN = /\n*\s*(Tono de las respuestas|Tone of the answers):[^\n]*\s*$/i;

/** Instrucciones + línea de tono: así el tono llega de verdad al modelo. */
export function composeSystemPrompt(instructions: string, toneLine: string): string {
  const base = instructions.replace(TONE_LINE_PATTERN, '').trim();
  return base ? `${base}\n\n${toneLine}` : toneLine;
}

export function stripToneLine(systemPrompt: string): string {
  return systemPrompt.replace(TONE_LINE_PATTERN, '').trim();
}

export function toneFrom(value: string | undefined): BuilderToneKey {
  return (TONE_CHOICES as readonly string[]).includes(value ?? '') ? (value as BuilderToneKey) : 'friendly';
}

export function fromRemote(remote: RemoteBotConfig): BuilderWidgetConfig {
  return {
    botName: remote.name,
    primaryColor: isHexColor(remote.color) ? remote.color : '#4F46E5',
    position: (POSITIONS as readonly string[]).includes(remote.position) ? remote.position : 'br',
    avatar: remote.avatar || '💬',
    welcome: remote.welcome,
    instructions: stripToneLine(remote.systemPrompt || ''),
    tone: toneFrom(remote.tone),
  };
}

export function sameConfig(a: BuilderWidgetConfig, b: BuilderWidgetConfig | null): boolean {
  if (!b) return false;
  return (Object.keys(a) as Array<keyof BuilderWidgetConfig>).every((k) => a[k] === b[k]);
}

/** Clases para la vista previa local (antes de guardar). */
export const POSITION_CLASS: Record<WidgetCornerPosition, string> = {
  br: 'bottom-4 right-4 items-end',
  bl: 'bottom-4 left-4 items-start',
  tr: 'top-4 right-4 items-end',
  tl: 'top-4 left-4 items-start',
};

export const PANEL_ORIGIN: Record<WidgetCornerPosition, string> = {
  br: 'bottom-16 right-0',
  bl: 'bottom-16 left-0',
  tr: 'top-16 right-0',
  tl: 'top-16 left-0',
};

/** Escapa un valor para usarlo dentro de un atributo HTML entre comillas dobles. */
export function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
