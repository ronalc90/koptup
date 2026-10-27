'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { homePathForRole } from '@/lib/auth-roles';

/** Ruta interna guardada por el login (?redirect=…), o null. */
function takeRedirect(): string | null {
  if (typeof window === 'undefined') return null;
  const value = sessionStorage.getItem('redirectAfterLogin');
  sessionStorage.removeItem('redirectAfterLogin');
  return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : null;
}

/**
 * Fin del inicio de sesión con Google. El backend redirige aquí con un código
 * de un solo uso en el fragmento (`#code=…`, que no llega al servidor ni al
 * Referer); esta página lo borra de la barra de direcciones y lo canjea por la
 * sesión con POST /api/auth/google/exchange. Los tokens nunca van en la URL.
 */
function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('authCallback');
  // En desarrollo (StrictMode) el efecto corre dos veces: el código sirve una sola.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const error = searchParams.get('error');
    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const code = fragment.get('code');
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    if (!code) {
      router.replace('/login');
      return;
    }

    api
      .exchangeGoogleCode(code)
      .then(({ user }) => {
        localStorage.setItem('user', JSON.stringify(user ?? {}));
        // Vuelve a la ruta pedida (navegación completa: el servidor decide
        // con la sesión nueva) o a la página de inicio de su rol.
        const target = takeRedirect();
        if (target) window.location.assign(target);
        else router.replace(homePathForRole(user?.role));
      })
      .catch(() => {
        router.replace('/login?error=google_auth_failed');
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-black dark:to-primary-950">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-secondary-600 dark:text-secondary-400">{t('completing')}</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
