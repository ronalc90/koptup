'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { FaGoogle } from 'react-icons/fa';
import { homePathForRole } from '@/lib/auth-roles';

/** true si `path` es una ruta interna del sitio (evita redirecciones abiertas). */
function isSafeInternalPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\');
}

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations('loginPage');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState('');

  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);
  // "Continuar con Google" solo si el servidor lo tiene configurado.
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getAuthProviders()
      .then((p) => {
        if (!cancelled) setGoogleEnabled(p.google);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // Check for OAuth errors, session expiration y redirect en URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('error');
    const sessionExpired = params.get('session');
    const redirect = params.get('redirect');

    if (sessionExpired === 'expired') {
      setSessionExpiredMessage(t('sessionExpired'));
    }

    // `google_auth_failed`: el inicio de sesión con Google falló o su código venció.
    if (authError === 'auth_failed' || authError === 'google_auth_failed') {
      setError(t('errorGoogle'));
    } else if (authError === 'google_not_configured') {
      setError(t('errorGoogleNotConfigured'));
    } else if (authError) {
      setError(t('errorGeneric'));
    }

    // Solo rutas internas: '/algo' sí; '//dominio' o '/\\dominio' no (redirección abierta).
    if (redirect && isSafeInternalPath(redirect)) {
      setRedirectTarget(redirect);
      sessionStorage.setItem('redirectAfterLogin', redirect);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSessionExpiredMessage('');
    setIsLoading(true);

    try {
      // Call API login
      const { user } = await api.login(formData.email, formData.password, formData.remember);

      // Save user data
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
      }

      // Vuelve a la ruta pedida (p. ej. una demo con acceso) o a la página de
      // inicio de su rol: panel para el equipo, Mis demos para un prospecto.
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin');
      if (redirectUrl && isSafeInternalPath(redirectUrl)) {
        // Navegación completa: el servidor vuelve a decidir con la sesión
        // nueva (p. ej. una demo que antes mostró "Solicita acceso" y que el
        // enrutador del cliente podría tener en caché).
        window.location.assign(redirectUrl);
      } else {
        router.push(homePathForRole(user?.role));
      }
    } catch (err: any) {
      // Mensajes en el idioma de la página (nunca el texto técnico de axios).
      const status = err.response?.status;
      let friendlyMessage = t('errorFields');
      if (err.code === 'account_not_activated') {
        friendlyMessage = t('errorNotActivated');
      } else if (err.code === 'rate_limited' || status === 429) {
        friendlyMessage = t('errorRateLimited');
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        friendlyMessage = t('errorNetwork');
      } else if (status === 401) {
        friendlyMessage = t('errorCredentials');
      } else if (status >= 500) {
        friendlyMessage = t('errorServer');
      } else if (status === 400) {
        friendlyMessage = t('errorFields');
      }

      setError(friendlyMessage);
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleGoogleLogin = () => {
    // Inicio con Google en el backend (vuelve a /auth/callback con un código de un solo uso).
    window.location.href = api.getGoogleOAuthURL();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-black dark:to-primary-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">K</span>
            </div>
            <span className="font-display font-bold text-2xl text-secondary-900 dark:text-white">
              KopTup
            </span>
          </Link>
          <h1 className="mt-6 text-3xl font-bold text-secondary-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
            {t('subtitle')}
          </p>
        </div>

        {redirectTarget && (
          <div className="p-4 bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800 rounded-lg text-center">
            <p className="text-sm text-primary-700 dark:text-primary-300">
              {t.rich('redirectNotice', {
                target: redirectTarget,
                strong: (chunks) => <span className="font-semibold">{chunks}</span>,
              })}
            </p>
          </div>
        )}

        <Card variant="elevated" className="shadow-xl">
          <CardContent className="p-8">
            {/* Session Expired Message */}
            {sessionExpiredMessage && (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                  {sessionExpiredMessage}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                  {error.includes(t('signUpLink')) && (
                    <>
                      {' '}
                      <Link href="/register" className="font-semibold underline hover:text-red-700 dark:hover:text-red-300">
                        {t('createAccount')}
                      </Link>
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Google: solo si el servidor lo tiene configurado (GET /api/auth/providers). */}
            {googleEnabled && (
              <>
                <div className="space-y-3 mb-6">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-secondary-300 dark:border-secondary-700 rounded-lg text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
                  >
                    <FaGoogle className="h-5 w-5" />
                    <span className="font-medium">{t('socialGoogle')}</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-secondary-300 dark:border-secondary-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-secondary-950 text-secondary-500 dark:text-secondary-500">
                      {t('divider')}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  {t('email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={t('emailPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  {t('password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-3 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    checked={formData.remember}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-secondary-700 dark:text-secondary-300" title={t('rememberHint')}>
                    {t('remember')}
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                    {t('forgotPassword')}
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                fullWidth
                disabled={isLoading}
              >
                {isLoading ? (
                  t('loggingIn')
                ) : (
                  <>
                    {t('loginButton')}
                    <ArrowRightIcon className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-secondary-600 dark:text-secondary-400">
          {t('noAccount')}{' '}
          <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
            {t('signUpLink')}
          </Link>
        </p>

        {/* Continuar como invitado */}
        <div className="text-center">
          <Link
            href="/demo"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            {t('guestLink')}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {/* Back to Home */}
        <p className="text-center">
          <Link href="/" className="text-sm text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white">
            {t('backHome')}
          </Link>
        </p>
      </div>
    </div>
  );
}
