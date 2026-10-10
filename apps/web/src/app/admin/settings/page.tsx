'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { BellIcon, GlobeAltIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { useSessionUser } from '@/hooks/useSessionUser';

/**
 * Configuración del panel. El idioma y el tema se aplican al momento (no hay
 * nada que guardar). Los avisos al equipo (correo y WhatsApp) se configuran en
 * el servidor, no por persona: la página lo dice en vez de mostrar casillas
 * que no cambiaban ningún envío.
 */
export default function AdminSettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const t = useTranslations('settingsPage');
  const ta = useTranslations('adminSettings');
  const { state } = useSessionUser();
  const role = state.status === 'ok' ? state.user.role : null;
  const [language, setLanguage] = useState('es');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLanguage(document.cookie.match(/(?:^|; )locale=([^;]+)/)?.[1] === 'en' ? 'en' : 'es');
    setMounted(true);
  }, []);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    document.cookie = `locale=${newLanguage}; path=/; max-age=${31536000}; SameSite=Lax`;
    setTimeout(() => {
      router.refresh();
      window.location.reload();
    }, 100);
  };

  const currentTheme = !mounted ? null : theme === 'system' ? 'system' : theme ?? 'light';
  const themeButton = (value: 'light' | 'dark' | 'system', label: string) => (
    <button
      type="button"
      onClick={() => setTheme(value)}
      aria-pressed={currentTheme === value}
      className={`p-4 rounded-lg border-2 transition-all ${
        currentTheme === value ? 'border-primary-500 bg-primary-50 dark:bg-primary-950' : 'border-secondary-200 dark:border-secondary-700'
      }`}
    >
      <p className="font-medium text-secondary-900 dark:text-white">{label}</p>
    </button>
  );

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">{t('title')}</h1>
          <p className="text-secondary-600 dark:text-secondary-400">{ta('subtitle')}</p>
        </div>

        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center gap-3">
              <GlobeAltIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <CardTitle>{t('languageAndAppearance')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="admin-language" className="block text-sm font-medium text-secondary-900 dark:text-white mb-2">
                {t('language')}
              </label>
              <select
                id="admin-language"
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <p className="block text-sm font-medium text-secondary-900 dark:text-white mb-2">{t('theme')}</p>
              <div className="grid grid-cols-3 gap-3">
                {themeButton('light', t('light'))}
                {themeButton('dark', t('dark'))}
                {themeButton('system', t('auto'))}
              </div>
            </div>
            <p className="text-xs text-secondary-500">{ta('appliedNow')}</p>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center gap-3">
              <BellIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <CardTitle>{ta('teamNoticesTitle')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-secondary-700 dark:text-secondary-300">{ta('teamNoticesBody')}</p>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <CardTitle>{ta('accessTitle')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-secondary-50 dark:bg-secondary-900">
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">{role ? ta(`roleName.${role === 'admin' ? 'admin' : 'manager'}`) : '—'}</p>
              <p className="font-medium text-secondary-900 dark:text-white">{role === 'admin' ? ta('accessAdmin') : ta('accessManager')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
