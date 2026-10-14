'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  BellAlertIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { FaWhatsapp } from 'react-icons/fa';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { ApiError, apiRequest, formatDate } from '@/lib/demo-system';
import { NOTIFY_CHANNELS, type NotifyChannel, type NotifyStatus, type NotifyTestResult } from './owner-notify';

/** Nombre de variable de entorno (se muestra como código). */
const ENV_NAME = /^[A-Z][A-Z0-9_]*$/;

function errorText(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return err instanceof Error ? err.message : String(err);
}

function Row({ label, children, testId }: { label: string; children: ReactNode; testId?: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[11rem_1fr] gap-x-3 gap-y-0.5 text-sm" data-testid={testId}>
      <dt className="text-secondary-500 dark:text-secondary-400">{label}</dt>
      <dd className="text-secondary-900 dark:text-white break-words">{children}</dd>
    </div>
  );
}

function ChannelHealthCard({ channel, status }: { channel: NotifyChannel; status: NotifyStatus }) {
  const t = useTranslations('adminNotify.card');
  const locale = useLocale();
  const s = status[channel];
  const Icon = channel === 'email' ? EnvelopeIcon : FaWhatsapp;
  const providerKey = s.proveedor ?? null;
  // Un error viejo seguido de un envío exitoso ya no es una falla activa.
  const recovered = !!(s.ultimoExito && s.ultimoFallo && new Date(s.ultimoExito).getTime() > new Date(s.ultimoFallo).getTime());
  return (
    <section
      className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-4 space-y-3"
      data-testid={`notify-channel-${channel}`}
      data-configurado={s.configurado ? 'si' : 'no'}
      aria-labelledby={`notify-channel-${channel}-title`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={`notify-channel-${channel}-title`} className="flex items-center gap-2 font-semibold text-secondary-900 dark:text-white">
          <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
          {t(`channels.${channel}`)}
        </h3>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
            s.configurado
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
          )}
          data-testid={`notify-channel-${channel}-state`}
        >
          {s.configurado ? <CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> : <XCircleIcon className="h-4 w-4" aria-hidden="true" />}
          {s.configurado ? t('configured') : t('notConfigured')}
        </span>
      </div>

      <dl className="space-y-1.5">
        <Row label={t('provider')}>{providerKey ? t(`providers.${providerKey}`) : '—'}</Row>
        <Row label={t('destination')}>{s.destino ?? '—'}</Row>
        {channel === 'email' && <Row label={t('sender')}>{status.email.remitente ?? '—'}</Row>}
        {channel === 'whatsapp' && (
          <>
            <Row label={t('template')}>{status.whatsapp.plantilla ?? '—'}</Row>
            {/* Sin WhatsApp configurado no se envía nada: la fila no aplica. */}
            {s.configurado && (
              <Row label={t('webhook')} testId="notify-webhook">
                {!status.whatsapp.webhook
                  ? t('webhookOff')
                  : status.whatsapp.webhookUltimoEvento
                    ? t('webhookOnLast', { date: formatDate(status.whatsapp.webhookUltimoEvento, locale, true) })
                    : t('webhookOnNoEvents')}
              </Row>
            )}
          </>
        )}
        <Row label={t('lastSuccess')} testId={`notify-channel-${channel}-last-success`}>
          {s.ultimoExito ? formatDate(s.ultimoExito, locale, true) : t('never')}
        </Row>
        <Row label={t('lastFailure')}>{s.ultimoFallo ? formatDate(s.ultimoFallo, locale, true) : t('never')}</Row>
        {s.ultimoError && (
          <Row label={t('lastError')} testId={`notify-channel-${channel}-last-error`}>
            {recovered ? (
              <span className="text-secondary-600 dark:text-secondary-300">{t('lastErrorRecovered', { error: s.ultimoError })}</span>
            ) : (
              <span className="text-red-700 dark:text-red-300">{s.ultimoError}</span>
            )}
          </Row>
        )}
      </dl>

      {channel === 'whatsapp' && status.whatsapp.proveedorNoSoportado && (
        <p className="flex gap-2 rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-900 dark:text-amber-100" data-testid="notify-unsupported-provider">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          {t('unsupportedProvider')}
        </p>
      )}

      {s.faltan.length > 0 && (
        <div className="rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-900 dark:text-amber-100">
          <p className="font-medium">{t('missing')}</p>
          <ul className="mt-1 list-disc pl-5 space-y-0.5">
            {s.faltan.map((item) => (
              <li key={item}>{ENV_NAME.test(item) ? <code className="font-mono text-xs">{item}</code> : item}</li>
            ))}
          </ul>
        </div>
      )}

      {channel === 'email' && status.email.proveedor === 'smtp' && (
        <p className="flex gap-2 rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-900 dark:text-amber-100">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          {t('smtpWarning')}
        </p>
      )}
    </section>
  );
}

function TestResultLine({ channel, result, template }: { channel: NotifyChannel; result: NotifyTestResult[NotifyChannel] | undefined; template: string | null }) {
  const t = useTranslations('adminNotify.card.test');
  const tc = useTranslations('adminNotify.card');
  let tone: 'ok' | 'fail' | 'off' = 'off';
  let text = t('notConfigured');
  if (result?.configurado) {
    if (result.enviado) {
      tone = 'ok';
      text = t(`sent.${channel}`, { id: result.id ?? '—' });
    } else {
      tone = 'fail';
      text = t('failed', { error: result.error || t('unknownError') });
    }
  } else if (!result) {
    tone = 'fail';
    text = t('noAnswer');
  }
  return (
    <li
      className="flex items-start gap-2 text-sm"
      data-testid={`notify-test-${channel}`}
      data-resultado={tone === 'ok' ? 'enviado' : tone === 'fail' ? 'fallido' : 'no_configurado'}
    >
      {tone === 'ok' ? (
        <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
      ) : tone === 'fail' ? (
        <XCircleIcon className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
      ) : (
        <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-secondary-500" aria-hidden="true" />
      )}
      <div className="space-y-0.5">
        <p className="text-secondary-900 dark:text-white">
          <span className="font-semibold">{tc(`channels.${channel}`)}:</span> {text}
        </p>
        {result?.enviado && result.respaldo && (
          <p className="text-amber-800 dark:text-amber-200" data-testid={`notify-test-${channel}-fallback`}>
            {channel === 'whatsapp'
              ? t('fallback', { name: result.respaldo, template: template ?? 'koptup_aviso' })
              : t('fallbackEmail', { name: result.respaldo })}
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * Tarjeta "Avisos de nuevos contactos" de Admin › Configuración: estado real
 * de cada canal (correo y WhatsApp) según el servidor, la prueba mensual
 * automática y el botón para enviar un aviso de prueba (solo admin).
 */
export default function OwnerNotificationsCard({ role }: { role: string | null }) {
  const t = useTranslations('adminNotify.card');
  const locale = useLocale();
  const isAdmin = role === 'admin';
  const [status, setStatus] = useState<NotifyStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<NotifyTestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setStatus(await apiRequest<NotifyStatus>('/admin/notifications/status'));
    } catch (err) {
      setLoadError(errorText(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runTest = async () => {
    setTesting(true);
    setTestError(null);
    setTestResult(null);
    try {
      setTestResult(await apiRequest<NotifyTestResult>('/admin/notifications/test', { method: 'POST', body: {} }));
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) setTestError(t('test.rateLimited'));
      else if (err instanceof ApiError && err.status === 403) setTestError(t('test.forbidden'));
      else setTestError(t('test.error', { error: errorText(err) }));
    } finally {
      setTesting(false);
      // Los envíos de la prueba actualizan "Último aviso enviado" y "Último fallo".
      void load();
    }
  };

  return (
    <Card variant="bordered" data-testid="owner-notifications-card">
      <CardHeader>
        <div className="flex items-center gap-3">
          <BellAlertIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
          <CardTitle>{t('title')}</CardTitle>
        </div>
        <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">{t('subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && !status ? (
          <p className="text-sm text-secondary-600 dark:text-secondary-400" role="status">
            {t('loading')}
          </p>
        ) : loadError && !status ? (
          <div role="alert" className="rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300 space-y-2">
            <p>{t('loadError', { error: loadError })}</p>
            <Button size="sm" variant="outline" onClick={() => void load()}>
              {t('retry')}
            </Button>
          </div>
        ) : status ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {NOTIFY_CHANNELS.map((c) => (
                <ChannelHealthCard key={c} channel={c} status={status} />
              ))}
            </div>

            <section className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-4 space-y-2" data-testid="notify-heartbeat">
              <h3 className="font-semibold text-secondary-900 dark:text-white">{t('heartbeat.title')}</h3>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                {status.latido.activo ? t('heartbeat.on', { days: status.latido.cadaDias }) : t('heartbeat.off')}
              </p>
              <dl className="space-y-1.5">
                <Row label={t('heartbeat.last')}>{status.latido.ultimo ? formatDate(status.latido.ultimo, locale, true) : t('never')}</Row>
                {status.latido.activo && (
                  <Row label={t('heartbeat.next')}>{status.latido.proximo ? formatDate(status.latido.proximo, locale, true) : '—'}</Row>
                )}
              </dl>
            </section>
            {loadError && (
              <p role="alert" className="text-sm text-red-700 dark:text-red-300">
                {t('loadError', { error: loadError })}
              </p>
            )}
          </>
        ) : null}

        <section className="pt-4 border-t border-secondary-200 dark:border-secondary-700 space-y-3">
          <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('test.hint')}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void runTest()} disabled={!isAdmin || testing} isLoading={testing} data-testid="notify-test-button">
              {!testing && <PaperAirplaneIcon className="h-4 w-4 mr-2" aria-hidden="true" />}
              {testing ? t('test.sending') : t('test.button')}
            </Button>
            {!isAdmin && role && <p className="text-sm text-secondary-500">{t('test.adminOnly')}</p>}
          </div>
          <div aria-live="polite">
            {testError && (
              <p role="alert" className="rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
                {testError}
              </p>
            )}
            {testResult && (
              <div className="rounded-md border border-secondary-200 dark:border-secondary-700 p-3 space-y-2" data-testid="notify-test-result">
                <p className="text-sm font-semibold text-secondary-900 dark:text-white">{t('test.resultTitle')}</p>
                <ul className="space-y-2">
                  {NOTIFY_CHANNELS.map((c) => (
                    <TestResultLine key={c} channel={c} result={testResult[c]} template={status?.whatsapp.plantilla ?? null} />
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
