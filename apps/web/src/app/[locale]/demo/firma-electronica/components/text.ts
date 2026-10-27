/** Textos derivados de los datos (eventos, actores, canales) a partir de las traducciones. */
import type { useTranslations } from 'next-intl';
import { COMPANY } from '../lib/data';
import { SYSTEM, YOU, type EvEvent } from '../lib/types';

export type T = ReturnType<typeof useTranslations>;

export function actorLabel(t: T, actor: string): string {
  if (actor === YOU) return t('actors.you', { company: COMPANY.short });
  if (actor === SYSTEM) return t('actors.system');
  return actor;
}

/** Descripción de un evento de la evidencia. */
export function eventText(t: T, e: EvEvent): string {
  const d = e.detail;
  const params: Record<string, string> = {
    to: d.to ?? '',
    channel: d.channel ? t(`channels.${d.channel}`) : '',
    method: d.method ? t(`auth.${d.method}.name`) : '',
    kind: d.kind ? t(`signer.kinds.${d.kind}`) : '',
    sigType: d.sigType ? t(`sigTypes.${d.sigType}.name`) : '',
    accepted: d.accepted ?? '0',
    rejected: d.rejected ?? '0',
    signers: d.signers ?? '0',
  };
  return t(`evidence.events.${e.type}`, params);
}

/** "IP 198.51.100.23 · Chrome · Android · Bogotá" (vacío si es la plataforma). */
export function whereLabel(e: EvEvent): string {
  return [e.ip ? `IP ${e.ip}` : '', e.device, e.geo].filter(Boolean).join(' · ');
}

/** Quién y desde dónde: "Luis Mejía · IP 198.51.100.30 · Chrome · Android". */
export function actorWhere(t: T, e: EvEvent): string {
  const where = whereLabel(e);
  return where ? `${actorLabel(t, e.actor)} · ${where}` : actorLabel(t, e.actor);
}
