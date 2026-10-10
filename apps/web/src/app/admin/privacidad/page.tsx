'use client';

/**
 * Admin › Privacidad (solo rol admin): derechos del titular (Ley 1581 de 2012).
 *
 * Busca por email todo lo que el sistema guarda de una persona
 * (POST /api/admin/privacy/search), lo exporta en JSON (…/export) y lo
 * suprime de forma irreversible (…/erase), con confirmación escrita del
 * email. La supresión no procede si la persona es del equipo o tiene
 * registros contractuales (el backend lo decide y lo explica).
 */

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Modal, apiErrorMessage } from '@/components/admin/demos/shared';
import { ApiError, apiRequest } from '@/lib/demo-system';
import { authFetch } from '@/lib/auth-token';
import { API_BASE } from '@/lib/backend-url';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  'cuentas',
  'contactos',
  'solicitudesDemo',
  'accesosDemo',
  'enlacesDeUnSoloUso',
  'leads',
  'actividadesLead',
  'propuestas',
  'conversacionesChatbot',
  'notificaciones',
  'documentos',
  'registroActividad',
  'pedidos',
  'proyectos',
  'facturas',
  'entregables',
  'conversacionesPortal',
  'bitacora',
] as const;
type Category = (typeof CATEGORIES)[number];

interface Block {
  motivo: 'team_account' | 'contractual_records';
  detalle: Partial<Record<Category, number>>;
}

interface SearchResult {
  correosBuscados: string[];
  resumen: Record<Category, number>;
  bloqueos: Block[];
  datos: Record<Category, Array<Record<string, unknown>>>;
  plazos: { conservacionMeses: number; conversacionesChatbotDias: number };
}

interface EraseResult {
  referencia: string;
  eliminados: Partial<Record<Category, number>>;
  anonimizados: { bitacora: number };
}

function PrivacyInner() {
  const t = useTranslations('adminPrivacy');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [searched, setSearched] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [erasing, setErasing] = useState(false);
  const [eraseError, setEraseError] = useState('');
  const [erased, setErased] = useState<EraseResult | null>(null);

  // Desde Contactos («Buscar o suprimir sus datos») llega con ?email=: se
  // prellena el campo (la búsqueda la lanza el admin).
  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get('email');
    if (fromQuery) setEmail(fromQuery.slice(0, 254));
  }, []);

  const total = result ? Object.values(result.resumen).reduce((a, b) => a + b, 0) : 0;
  const blocked = (result?.bloqueos.length ?? 0) > 0;
  const confirmMatches = confirmation.trim().toLowerCase() === searched.trim().toLowerCase() && searched.trim() !== '';

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const value = email.trim();
    if (!value) return;
    setLoading(true);
    setError('');
    setErased(null);
    try {
      const data = await apiRequest<SearchResult>('/admin/privacy/search', { method: 'POST', body: { email: value } });
      setResult(data);
      setSearched(value);
    } catch (err) {
      setResult(null);
      setError(err instanceof ApiError && err.status === 0 ? t('errors.network') : apiErrorMessage(err, locale, t('errors.search')));
    } finally {
      setLoading(false);
    }
  };

  const exportJson = async () => {
    setExporting(true);
    setError('');
    try {
      const res = await authFetch(`${API_BASE}/admin/privacy/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: searched }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      // Mismo nombre que propone el servidor (la web no puede leer esa cabecera entre orígenes).
      const name = `datos-titular-${new Date().toISOString().slice(0, 10)}.json`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(t('errors.export'));
    } finally {
      setExporting(false);
    }
  };

  const erase = async () => {
    setErasing(true);
    setEraseError('');
    try {
      const data = await apiRequest<EraseResult>('/admin/privacy/erase', { method: 'POST', body: { email: searched, confirmacion: confirmation } });
      setErased(data);
      setResult(null);
      setConfirmOpen(false);
      setConfirmation('');
    } catch (err) {
      setEraseError(apiErrorMessage(err, locale, t('errors.erase')));
    } finally {
      setErasing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
          <ShieldCheckIcon className="h-8 w-8 text-primary-600" aria-hidden="true" />
          {t('title')}
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400 mt-1 max-w-3xl">{t('subtitle')}</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-3">
          <ul className="list-disc pl-5 space-y-1 text-sm text-secondary-700 dark:text-secondary-300">
            <li>{t('rules.deadlines')}</li>
            <li>{t('rules.identity')}</li>
            <li>{t('rules.retention')}</li>
          </ul>
          <form onSubmit={search} className="flex flex-col sm:flex-row gap-3 pt-2" role="search">
            <label htmlFor="privacy-email" className="sr-only">
              {t('emailLabel')}
            </label>
            <input
              id="privacy-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              autoComplete="off"
              className="flex-1 px-4 py-2.5 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button type="submit" disabled={loading} data-testid="privacy-search">
              <MagnifyingGlassIcon className="h-4 w-4 mr-1" aria-hidden="true" />
              {loading ? t('searching') : t('search')}
            </Button>
          </form>
          {error && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {erased && (
        <Card className="border-green-300 dark:border-green-800" data-testid="privacy-erased">
          <CardContent className="p-6 space-y-2">
            <p className="flex items-center gap-2 font-semibold text-green-800 dark:text-green-300">
              <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
              {t('erased.title')}
            </p>
            <p className="text-sm text-secondary-700 dark:text-secondary-300">{t('erased.reference', { ref: erased.referencia })}</p>
            <p className="text-sm text-secondary-700 dark:text-secondary-300">
              {t('erased.counts', {
                deleted: Object.values(erased.eliminados).reduce((a, b) => a + (b ?? 0), 0),
                anonymized: erased.anonimizados.bitacora,
              })}
            </p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card data-testid="privacy-result">
          <CardContent className="p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-secondary-900 dark:text-white break-all">{t('result.title', { email: searched })}</h2>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  {total === 0 ? t('result.empty') : t('result.total', { count: total })}
                </p>
                <p className="text-xs text-secondary-500 dark:text-secondary-500 mt-1 break-all">{t('result.searchedAs', { emails: result.correosBuscados.join(', ') })}</p>
              </div>
              {total > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={exportJson} disabled={exporting} data-testid="privacy-export">
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                    {exporting ? t('exporting') : t('export')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setConfirmation('');
                      setEraseError('');
                      setConfirmOpen(true);
                    }}
                    disabled={blocked}
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    data-testid="privacy-erase"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                    {t('erase')}
                  </Button>
                </div>
              )}
            </div>

            {blocked && (
              <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" role="status">
                <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                <div className="space-y-1">
                  {result.bloqueos.map((b) => (
                    <p key={b.motivo}>
                      {t(`blocks.${b.motivo}`)}{' '}
                      {Object.entries(b.detalle)
                        .map(([c, n]) => `${t(`categories.${c}`)}: ${n}`)
                        .join(' · ')}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {total > 0 && (
              <div className="space-y-2">
                {CATEGORIES.filter((c) => result.resumen[c] > 0).map((c) => (
                  <details key={c} className="rounded-lg border border-secondary-200 dark:border-secondary-800" data-category={c}>
                    <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-secondary-900 dark:text-white flex items-center justify-between gap-3">
                      <span>{t(`categories.${c}`)}</span>
                      <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700 dark:bg-primary-900 dark:text-primary-200">
                        {result.resumen[c]}
                      </span>
                    </summary>
                    <pre className="max-h-96 overflow-auto border-t border-secondary-200 dark:border-secondary-800 bg-secondary-50 dark:bg-secondary-900 p-4 text-xs text-secondary-800 dark:text-secondary-200 whitespace-pre-wrap break-words">
                      {JSON.stringify(result.datos[c], null, 2)}
                    </pre>
                  </details>
                ))}
              </div>
            )}
            <p className="text-xs text-secondary-500 dark:text-secondary-500">
              {t('result.retention', { months: result.plazos.conservacionMeses, days: result.plazos.conversacionesChatbotDias })}
            </p>
            <p className={cn('text-xs text-secondary-500 dark:text-secondary-500', total === 0 && 'hidden')}>{t('result.note')}</p>
          </CardContent>
        </Card>
      )}

      {confirmOpen && (
        <Modal title={t('confirm.title')} onClose={() => setConfirmOpen(false)}>
          <div className="space-y-4 text-sm text-secondary-700 dark:text-secondary-300">
            <p>{t('confirm.body')}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t('confirm.deletes')}</li>
              <li>{t('confirm.audit')}</li>
              <li>{t('confirm.irreversible')}</li>
            </ul>
            <div>
              <label htmlFor="privacy-confirm" className="block font-medium text-secondary-900 dark:text-white mb-1 break-all">
                {t('confirm.label', { email: searched })}
              </label>
              <input
                id="privacy-confirm"
                type="email"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoComplete="off"
                className="w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            {eraseError && (
              <p role="alert" className="text-red-700 dark:text-red-400">
                {eraseError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                {t('confirm.cancel')}
              </Button>
              <Button onClick={erase} disabled={!confirmMatches || erasing} className="bg-red-600 hover:bg-red-700 focus:ring-red-500" data-testid="privacy-erase-confirm">
                {erasing ? t('confirm.erasing') : t('confirm.submit')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function AdminPrivacyPage() {
  return (
    <AdminLayout>
      <PrivacyInner />
    </AdminLayout>
  );
}
