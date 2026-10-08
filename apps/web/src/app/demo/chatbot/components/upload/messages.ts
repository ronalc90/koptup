import type { DemoErrorCode, DemoLimits } from './api';

/** Traductor de `demoChatbot.uploadDemo` (subconjunto de la firma de next-intl). */
export type UploadDemoTranslator = (key: string, values?: Record<string, string | number>) => string;

/** Códigos con mensaje propio en `uploadDemo.errors`; el resto usa `generic`. */
const KNOWN_ERRORS: ReadonlySet<DemoErrorCode> = new Set<DemoErrorCode>([
  'invalid_format',
  'file_too_large',
  'too_many_pages',
  'empty_document',
  'unreadable_document',
  'missing_file',
  'invalid_email',
  'consent_required',
  'daily_limit',
  'question_limit',
  'invalid_question',
  'rate_limited',
  'document_not_found',
  'budget_exhausted',
  'demo_disabled',
  'capacity',
  'llm_error',
  'network',
]);

/** Mensaje en el idioma activo para un código de error de la demo. */
export function demoErrorText(t: UploadDemoTranslator, code: DemoErrorCode, limits: DemoLimits): string {
  const key = KNOWN_ERRORS.has(code) ? code : 'generic';
  return t(`errors.${key}`, {
    maxMb: limits.maxFileMb,
    maxPages: limits.maxPages,
    maxDocs: limits.maxDocumentsPerDay,
    maxQuestions: limits.maxQuestionsPerDocument,
    maxChars: limits.maxQuestionChars,
  });
}

/** Errores que significan "la demo no está disponible": se muestra la tarjeta con el CTA a /contact. */
export function unavailableReasonFor(code: DemoErrorCode): 'budget_exhausted' | 'disabled' | null {
  if (code === 'budget_exhausted') return 'budget_exhausted';
  if (code === 'demo_disabled') return 'disabled';
  return null;
}
