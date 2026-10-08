'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon,
  ClipboardDocumentIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { FaWhatsapp } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import { copyText, formatDate, storedUser, whatsappLink, whatsappNumber } from '@/lib/demo-system';
import type { DemoAccessMode } from '@/lib/demo-access-defaults';

// ---------------------------------------------------------------------------
//   Tipos de la API del panel (apps/backend/src/services/demo-*.service.ts)
// ---------------------------------------------------------------------------

export type RequestState = 'pendiente' | 'en_revision' | 'aprobada' | 'rechazada';

export interface AdminDemoRequest {
  id: string;
  codigo: string;
  nombre: string;
  empresa: string;
  cargo: string | null;
  email: string;
  telefono: string | null;
  pais: string;
  tamanoEmpresa: string;
  demos: string[];
  casoDeUso: string;
  consentimiento: { aceptado: boolean; fecha: string | null; versionPolitica: string | null };
  origen: { pagina?: string; referrer?: string; utm?: Record<string, string> } | null;
  estado: RequestState;
  motivoRechazo: string | null;
  notas: Array<{ texto: string; autor: string | null; autorEmail: string | null; fecha: string }>;
  revisadoPor: string | null;
  revisadoEn: string | null;
  decision: { demos: string[]; dias: number | null; grants: string[] } | null;
  user: string | null;
  reenvios: number;
  notificaciones: {
    equipoEmail: boolean | null;
    equipoWhatsapp: boolean | null;
    acuseSolicitante: boolean | null;
    decisionSolicitante: boolean | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminGrant {
  id: string;
  demoSlug: string;
  demoNombre: string;
  demoNombreEn: string | null;
  accessMode: DemoAccessMode | null;
  demoActiva: boolean;
  estado: 'activo' | 'expirado' | 'revocado';
  estadoEfectivo: 'activo' | 'expirado' | 'revocado';
  vigente: boolean;
  expiresAt: string;
  diasRestantes: number;
  ultimoAcceso: string | null;
  accesos: number;
  request: string | null;
  extensiones: Array<{ dias: number; desde: string; hasta: string; por: string | null; fecha: string }>;
  revocadoEn: string | null;
  motivoRevocacion: string | null;
  nota: string | null;
  createdAt: string;
  user: { id: string; email?: string; name?: string; company?: string | null; role?: string; accountStatus?: string } | null;
}

export interface EmailOutcome {
  configurado: boolean;
  enviado: boolean | null;
}

/** Respuesta de aprobar una solicitud o conceder acceso directo. */
export interface GrantResult {
  user: { id: string; email: string; name: string; role: string; accountStatus: string; cuentaNueva?: boolean };
  grants?: AdminGrant[];
  activationUrl: string | null;
  activationExpiresAt: string | null;
  loginUrl?: string;
  email: EmailOutcome;
}

/** Días antes del vencimiento en que un acceso cuenta como "por vencer" (backend: GRANT_REMINDER_DAYS_BEFORE). */
export const SOON_DAYS = 3;

/** Rol guardado al iniciar sesión (solo para mostrar u ocultar botones; el backend decide). */
export function useStaffRole(): string | null {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    setRole(storedUser()?.role ?? null);
  }, []);
  return role;
}

// ---------------------------------------------------------------------------
//   Etiquetas
// ---------------------------------------------------------------------------

const REQUEST_STYLES: Record<RequestState, string> = {
  pendiente: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
  en_revision: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  aprobada: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  rechazada: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
};

export function RequestStatusBadge({ estado }: { estado: RequestState }) {
  const t = useTranslations('adminDemos.requestStatus');
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', REQUEST_STYLES[estado])} data-request-status={estado}>
      {t(estado)}
    </span>
  );
}

export type GrantUiState = 'activo' | 'por_vencer' | 'expirado' | 'revocado';

export function grantUiState(g: Pick<AdminGrant, 'estadoEfectivo' | 'diasRestantes'>): GrantUiState {
  if (g.estadoEfectivo === 'activo' && g.diasRestantes <= SOON_DAYS) return 'por_vencer';
  return g.estadoEfectivo;
}

const GRANT_STYLES: Record<GrantUiState, string> = {
  activo: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  por_vencer: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
  expirado: 'bg-secondary-200 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-100',
  revocado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
};

export function GrantStatusBadge({ grant }: { grant: Pick<AdminGrant, 'estadoEfectivo' | 'diasRestantes'> }) {
  const t = useTranslations('adminDemos.grantStatus');
  const state = grantUiState(grant);
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', GRANT_STYLES[state])} data-grant-status={state}>
      {t(state)}
    </span>
  );
}

// ---------------------------------------------------------------------------
//   Modal
// ---------------------------------------------------------------------------

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  const t = useTranslations('adminDemos');
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn('relative w-full bg-white dark:bg-secondary-950 rounded-xl shadow-2xl border border-secondary-200 dark:border-secondary-800 my-8', wide ? 'max-w-2xl' : 'max-w-lg')}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-secondary-200 dark:border-secondary-800">
          <h2 className="text-lg font-bold text-secondary-900 dark:text-white">{title}</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800" aria-label={t('close')}>
            <XMarkIcon className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//   Vigencia (días)
// ---------------------------------------------------------------------------

const DAY_PRESETS = [7, 14, 21, 30];

export function DaysPicker({ value, onChange, id }: { value: number; onChange: (days: number) => void; id: string }) {
  const t = useTranslations('adminDemos');
  return (
    <div className="flex flex-wrap items-center gap-2">
      {DAY_PRESETS.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          aria-pressed={value === d}
          className={cn(
            'px-3 py-1.5 rounded-full border text-sm font-medium',
            value === d
              ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-200'
              : 'border-secondary-300 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 hover:border-primary-400',
          )}
        >
          {t('daysShort', { days: d })}
        </button>
      ))}
      <label htmlFor={id} className="sr-only">
        {t('customDays')}
      </label>
      <input
        id={id}
        type="number"
        min={1}
        max={365}
        value={value}
        onChange={(e) => onChange(Math.max(1, Math.min(365, Number(e.target.value) || 1)))}
        className="w-24 px-3 py-1.5 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white text-sm"
      />
      <span className="text-sm text-secondary-500">{t('days')}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
//   Enlace de activación: copiar y enviar por WhatsApp
// ---------------------------------------------------------------------------

export function ActivationLinkPanel({
  result,
  phone,
  demoNames,
}: {
  result: Pick<GrantResult, 'activationUrl' | 'activationExpiresAt' | 'loginUrl' | 'email' | 'user'>;
  phone?: string | null;
  demoNames: string[];
}) {
  const t = useTranslations('adminDemos.link');
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const url = result.activationUrl ?? result.loginUrl ?? '';
  const firstName = (result.user?.name ?? '').split(' ')[0] || '';
  const expires = result.activationExpiresAt ? formatDate(result.activationExpiresAt, locale, true) : '';
  const message = result.activationUrl
    ? t('whatsappActivation', { name: firstName, demos: demoNames.join(', '), url, date: expires })
    : t('whatsappLogin', { name: firstName, demos: demoNames.join(', '), url });
  const wa = whatsappLink(phone, message);

  const copy = async () => {
    const ok = await copyText(url);
    if (ok) {
      setCopied(true);
      toast.success(t('copied'));
      setTimeout(() => setCopied(false), 2500);
    } else {
      toast.error(t('copyFailed'));
    }
  };

  if (!url) return null;
  return (
    <div className="rounded-xl border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/40 p-4 space-y-3" data-testid="activation-link-panel">
      <div className="flex items-start gap-2">
        <LinkIcon className="h-5 w-5 text-green-700 dark:text-green-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-secondary-900 dark:text-white">{result.activationUrl ? t('activationTitle') : t('loginTitle')}</p>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            {result.activationUrl ? t('activationHelp', { date: expires }) : t('loginHelp')}
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white text-sm font-mono"
          aria-label={t('linkLabel')}
          data-testid="activation-link"
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold"
        >
          {copied ? <CheckCircleIcon className="h-4 w-4" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
          {copied ? t('copiedShort') : t('copy')}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-green-600 text-green-700 dark:text-green-400 text-sm font-semibold hover:bg-green-100 dark:hover:bg-green-950"
            title={`+${whatsappNumber(phone)}`}
          >
            <FaWhatsapp className="h-4 w-4" />
            {t('whatsapp')}
          </a>
        ) : (
          <span className="text-xs text-secondary-500">{t('noPhone')}</span>
        )}
        <span className="inline-flex items-center gap-1 text-xs text-secondary-600 dark:text-secondary-400">
          {result.email.enviado === true ? (
            <>
              <EnvelopeIcon className="h-4 w-4 text-green-600" /> {t('emailSent')}
            </>
          ) : result.email.configurado ? (
            <>
              <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" /> {result.email.enviado === null ? t('emailPending') : t('emailFailed')}
            </>
          ) : (
            <>
              <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" /> {t('emailNotConfigured')}
            </>
          )}
        </span>
      </div>
    </div>
  );
}

/** Mensaje de error del backend (en español) o uno genérico traducido. */
export function apiErrorMessage(err: unknown, locale: string, fallback: string): string {
  const e = err as { message?: string; status?: number };
  if (locale === 'es' && e?.message && e.status && e.status >= 400 && e.status < 500 && !/^HTTP \d+/.test(e.message)) return e.message;
  return fallback;
}
