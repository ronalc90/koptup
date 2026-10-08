/**
 * Eventos de medición de la demo de chatbot (GA4 vía `track()` de
 * `@/lib/analytics`; solo se envían si el visitante aceptó cookies y la
 * etiqueta está configurada). Los componentes los llaman en el momento
 * correcto:
 *  - `demo_start`: primera pregunta en la demo (documento de ejemplo o propio),
 *    una vez por carga de /demo/chatbot — ver `page.tsx` (markDemoStart).
 *  - `demo_upload`: documento subido con éxito en "Prueba con tu documento" —
 *    ver `upload/UploadDemo.tsx` (handleUploaded).
 */
import { track } from '@/lib/analytics';
import type { DemoDocKind } from './upload/api';

export type DemoEventMode = 'sample' | 'upload';

export interface DemoStartEvent {
  /** `sample`: demo con el documento de ejemplo; `upload`: con documento propio. */
  mode: DemoEventMode;
}

export interface DemoUploadEvent {
  fileType: DemoDocKind;
  pages: number;
}

/** Evento `demo_start` (primera pregunta). */
export function trackDemoStart(event: DemoStartEvent): void {
  track('demo_start', { demo_mode: event.mode });
}

/**
 * Evento `demo_upload` (documento subido). Solo tipo y páginas: nunca el
 * nombre ni el contenido del archivo.
 */
export function trackDemoUpload(event: DemoUploadEvent): void {
  track('demo_upload', { file_type: event.fileType, pages: event.pages });
}
