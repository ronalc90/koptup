/**
 * commerce-settings.service.ts — configuración comercial editable desde
 * Admin › Configuración (persistida en MongoDB, colección AppSetting, clave
 * `commerce`):
 *  - instrucciones de transferencia que ve el cliente al aceptar una
 *    propuesta (si la propuesta no trae las suyas);
 *  - porcentaje de anticipo por defecto de las propuestas nuevas;
 *  - validez por defecto (días) de las propuestas nuevas.
 * Sin registro guardado se usan los valores por defecto (sin instrucciones:
 * el método "transferencia" no se ofrece hasta que el admin las escriba).
 */
import type { Request } from 'express';
import { z } from 'zod';
import AppSetting from '../models/AppSetting';
import { DEFAULT_DEPOSIT_PCT, DEFAULT_PROPOSAL_VALIDITY_DAYS, MAX_PROPOSAL_VALIDITY_DAYS } from '../config/commerce';
import { recordAudit, type AuditActor } from './audit.service';

export const COMMERCE_SETTINGS_KEY = 'commerce';

export interface CommerceSettings {
  instruccionesTransferencia: string;
  anticipoPctPorDefecto: number;
  validezDiasPorDefecto: number;
}

export const COMMERCE_DEFAULTS: CommerceSettings = {
  instruccionesTransferencia: '',
  anticipoPctPorDefecto: DEFAULT_DEPOSIT_PCT,
  validezDiasPorDefecto: DEFAULT_PROPOSAL_VALIDITY_DAYS,
};

export const CommerceSettingsSchema = z
  .object({
    instruccionesTransferencia: z.string().trim().max(4000),
    anticipoPctPorDefecto: z.coerce.number().int().min(0).max(100),
    validezDiasPorDefecto: z.coerce.number().int().min(1).max(MAX_PROPOSAL_VALIDITY_DAYS),
  })
  .partial()
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: 'No hay cambios para guardar.' });

function merge(raw: Record<string, unknown> | null | undefined): CommerceSettings {
  const v = raw ?? {};
  return {
    instruccionesTransferencia: typeof v.instruccionesTransferencia === 'string' ? v.instruccionesTransferencia : COMMERCE_DEFAULTS.instruccionesTransferencia,
    anticipoPctPorDefecto: typeof v.anticipoPctPorDefecto === 'number' ? v.anticipoPctPorDefecto : COMMERCE_DEFAULTS.anticipoPctPorDefecto,
    validezDiasPorDefecto: typeof v.validezDiasPorDefecto === 'number' ? v.validezDiasPorDefecto : COMMERCE_DEFAULTS.validezDiasPorDefecto,
  };
}

export async function getCommerceSettings(): Promise<CommerceSettings & { actualizadoEn: Date | null }> {
  const doc = await AppSetting.findOne({ clave: COMMERCE_SETTINGS_KEY }).lean();
  return { ...merge(doc?.valor), actualizadoEn: doc?.updatedAt ?? null };
}

export async function updateCommerceSettings(changes: Partial<CommerceSettings>, actor: AuditActor & { id: string }, req?: Request) {
  const before = await getCommerceSettings();
  const set: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(changes)) if (v !== undefined) set[`valor.${k}`] = v;
  const doc = await AppSetting.findOneAndUpdate(
    { clave: COMMERCE_SETTINGS_KEY },
    { $set: { ...set, actualizadoPor: actor.id }, $setOnInsert: { clave: COMMERCE_SETTINGS_KEY } },
    { upsert: true, new: true },
  ).lean();
  const after = { ...merge(doc?.valor), actualizadoEn: doc?.updatedAt ?? null };
  const antes: Record<string, unknown> = {};
  const despues: Record<string, unknown> = {};
  for (const k of Object.keys(changes) as Array<keyof CommerceSettings>) {
    antes[k] = before[k];
    despues[k] = after[k];
  }
  await recordAudit({ actor, accion: 'settings.commerce_update', entidad: { tipo: 'AppSetting', id: COMMERCE_SETTINGS_KEY }, detalle: { antes, despues }, req });
  return after;
}
