'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (error) {
      // OAuth failed, redirect to login with error message
      router.push(`/login?error=${error}`);
      return;
    }

    if (accessToken && refreshToken) {
      // Save tokens
      api.handleOAuthCallback(accessToken, refreshToken);

      // Get user data
      api.getCurrentUser()
        .then((user) => {
          // Save user data
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(user));
          }
          // Redirect to dashboard
          router.push('/dashboard');
        })
        .catch((err) => {
          console.error('Failed to get user data:', err);
          router.push('/login?error=auth_failed');
        });
    } else {
      // No tokens, redirect to login
      router.push('/login');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-black dark:to-primary-950">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-secondary-600 dark:text-secondary-400">
          Completing authentication...
        </p>
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
