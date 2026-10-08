'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Cookies from 'js-cookie';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { FaWhatsapp } from 'react-icons/fa';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import { ApiError, KOPTUP_WHATSAPP_NUMBER, apiRequest, formatDate } from '@/lib/demo-system';
import { cn } from '@/lib/utils';

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;
const KNOWN_ERRORS = ['token_invalid', 'token_used', 'token_replaced', 'token_expired', 'rate_limited', 'network', 'generic'] as const;
type ErrorCode = (typeof KNOWN_ERRORS)[number];

type State =
  | { kind: 'checking' }
  | { kind: 'ready'; nombre: string; email: string; expiresAt: string | null }
  | { kind: 'error'; code: ErrorCode }
  | { kind: 'done' };

function errorCode(err: unknown): ErrorCode {
  if (err instanceof ApiError) {
    if (err.status === 429) return 'rate_limited';
    if (err.status === 0) return 'network';
    if (err.code && (KNOWN_ERRORS as readonly string[]).includes(err.code)) return err.code as ErrorCode;
  }
  return 'generic';
}

interface Session {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string; role: string };
}

export default function ActivateAccount({ token }: { token: string }) {
  const t = useTranslations('activate');
  const locale = useLocale();
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'checking' });
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ nombre: string; emailEnmascarado: string; expiresAt: string }>('/auth/activate/check', {
      method: 'POST',
      auth: false,
      body: { token },
    })
      .then((data) => {
        if (!cancelled) setState({ kind: 'ready', nombre: data.nombre, email: data.emailEnmascarado, expiresAt: data.expiresAt ?? null });
      })
      .catch((err) => {
        if (!cancelled) setState({ kind: 'error', code: errorCode(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError('');
    if (password.length < MIN_PASSWORD) return setFieldError(t('errors.short', { min: MIN_PASSWORD }));
    if (password.length > MAX_PASSWORD) return setFieldError(t('errors.long', { max: MAX_PASSWORD }));
    if (password !== confirm) return setFieldError(t('errors.mismatch'));

    setSubmitting(true);
    try {
      const session = await apiRequest<Session>('/auth/activate', { method: 'POST', auth: false, body: { token, password } });
      // Misma sesión que el login (lib/api.ts): access 15 min, refresh 7 días.
      Cookies.set('accessToken', session.accessToken, { expires: 1 / 96 });
      Cookies.set('refreshToken', session.refreshToken, { expires: 7 });
      localStorage.setItem('user', JSON.stringify(session.user));
      setState({ kind: 'done' });
      router.push('/dashboard/demos?bienvenida=1');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'invalid_password') {
        setFieldError(locale === 'es' ? err.message : t('errors.short', { min: MIN_PASSWORD }));
      } else {
        setState({ kind: 'error', code: errorCode(err) });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappHref = `https://wa.me/${KOPTUP_WHATSAPP_NUMBER}?text=${encodeURIComponent(t('whatsappText'))}`;
  const input =
    'w-full pl-10 pr-10 py-3 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-black dark:to-primary-950 flex items-center justify-center py-12 px-4">
      <Card variant="elevated" className="w-full max-w-md shadow-2xl">
        <CardContent className="p-8">
          {state.kind === 'checking' && (
            <div className="text-center py-8" role="status">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600" />
              <p className="mt-4 text-secondary-600 dark:text-secondary-400">{t('checking')}</p>
            </div>
          )}

          {state.kind === 'ready' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center">
                <KeyIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h1 className="text-2xl font-bold text-center text-secondary-900 dark:text-white mb-2">{t('title', { name: state.nombre })}</h1>
              <p className="text-center text-secondary-600 dark:text-secondary-400 mb-1">{t('subtitle', { email: state.email })}</p>
              {state.expiresAt && (
                <p className="text-center text-xs text-secondary-500 dark:text-secondary-400 mb-6">
                  {t('expires', { date: formatDate(state.expiresAt, locale, true) })}
                </p>
              )}
              <form onSubmit={handleSubmit} noValidate className="space-y-4" data-testid="activate-form">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    {t('password')}
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                    <input
                      id="password"
                      type={show ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={input}
                      aria-describedby="password-help"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-500"
                      aria-label={show ? t('hide') : t('show')}
                    >
                      {show ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  <p id="password-help" className={cn('mt-1 text-xs', password.length >= MIN_PASSWORD ? 'text-green-700 dark:text-green-400' : 'text-secondary-500')}>
                    {t('passwordHelp', { min: MIN_PASSWORD })}
                  </p>
                </div>
                <div>
                  <label htmlFor="confirm" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    {t('confirm')}
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                    <input
                      id="confirm"
                      type={show ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className={input}
                    />
                  </div>
                </div>
                {fieldError && (
                  <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                    {fieldError}
                  </p>
                )}
                <Button type="submit" fullWidth size="lg" isLoading={submitting} disabled={submitting}>
                  {t('submit')}
                </Button>
              </form>
            </>
          )}

          {state.kind === 'done' && (
            <div className="text-center py-6" role="status">
              <CheckCircleIcon className="h-14 w-14 mx-auto text-green-600" />
              <p className="mt-3 font-semibold text-secondary-900 dark:text-white">{t('done')}</p>
            </div>
          )}

          {state.kind === 'error' && (
            <div className="text-center" data-activation-error={state.code}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                <ExclamationTriangleIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h1 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">{t(`errorTitles.${state.code}`)}</h1>
              <p className="text-secondary-600 dark:text-secondary-400 mb-6">{t(`errorBodies.${state.code}`)}</p>
              <div className="space-y-3">
                {state.code === 'token_used' && (
                  <Button fullWidth asChild>
                    <Link href="/login?redirect=%2Fdashboard%2Fdemos">{t('login')}</Link>
                  </Button>
                )}
                {(state.code === 'network' || state.code === 'generic' || state.code === 'rate_limited') && (
                  <Button fullWidth onClick={() => window.location.reload()}>
                    {t('retry')}
                  </Button>
                )}
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border-2 border-green-600 text-green-700 dark:text-green-400 font-semibold hover:bg-green-50 dark:hover:bg-green-950"
                >
                  <FaWhatsapp className="h-5 w-5" />
                  {t('askNewLink')}
                </a>
                <Link href="/" className="block text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                  {t('home')}
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
