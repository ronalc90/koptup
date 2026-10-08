/**
 * Ganchos de medición de la demo de chatbot.
 *
 * FASE 7: aquí se envían los eventos a GA4 / Google Ads / LinkedIn Insight Tag
 * (solo si el usuario aceptó cookies). Hoy no envían nada; los componentes ya
 * los llaman en el momento correcto:
 *  - `demo_start`: primera pregunta en la demo (documento de ejemplo o propio),
 *    una vez por visita a /demo/chatbot — ver `page.tsx` (markDemoStart).
 *  - `demo_upload`: documento subido en "Prueba con tu documento" — ver
 *    `upload/UploadDemo.tsx` (handleUploaded).
 */
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

/** Evento `demo_start` (primera pregunta). Fase 7: enviarlo a las etiquetas. */
export function trackDemoStart(event: DemoStartEvent): void {
  void event;
}

/** Evento `demo_upload` (documento subido). Fase 7: enviarlo a las etiquetas. */
export function trackDemoUpload(event: DemoUploadEvent): void {
  void event;
}
