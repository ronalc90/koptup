'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  GlobeAltIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import OwnerNotificationsCard from '@/components/admin/OwnerNotificationsCard';
import { useStaffRole } from '@/components/admin/demos/shared';
import { useLocale, useTranslations } from 'next-intl';
import { localizedPath } from '@/lib/i18n-url';

export default function AdminSettingsPage() {
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const t = useTranslations('settingsPage');
  const role = useStaffRole();
  const [settings, setSettings] = useState({
    theme: 'light',
  });

  const [saving, setSaving] = useState(false);

  // Theme on mount
  useEffect(() => {
    const currentTheme = theme === 'system' ? 'auto' : (theme || 'light');
    setSettings(prev => ({ ...prev, theme: currentTheme }));
  }, [theme]);

  // El idioma va en la URL: se carga la misma página en el otro idioma.
  const handleLanguageChange = (newLanguage: string) => {
    const path = window.location.pathname.replace(/^\/en(?=\/|$)/, '') || '/';
    window.location.assign(`${localizedPath(path, newLanguage)}${window.location.search}${window.location.hash}`);
  };

  const handleSave = async () => {
    setSaving(true);

    // Save to localStorage
    localStorage.setItem('adminSettings', JSON.stringify(settings));

    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);

    alert(t('toastSaved'));
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
            {t('title')}
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            {t('subtitle')}
          </p>
        </div>

        {/* Avisos de nuevos contactos: estado real del servidor y aviso de prueba. */}
        <OwnerNotificationsCard role={role} />

        {/* Language & Theme */}
        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center gap-3">
              <GlobeAltIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <CardTitle>{t('languageAndAppearance')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-900 dark:text-white mb-2">
                {t('language')}
              </label>
              <select
                value={locale}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-900 dark:text-white mb-2">
                {t('theme')}
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setTheme('light');
                    setSettings({ ...settings, theme: 'light' });
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.theme === 'light'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                      : 'border-secondary-200 dark:border-secondary-700'
                  }`}
                >
                  <p className="font-medium text-secondary-900 dark:text-white">{t('light')}</p>
                </button>
                <button
                  onClick={() => {
                    setTheme('dark');
                    setSettings({ ...settings, theme: 'dark' });
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.theme === 'dark'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                      : 'border-secondary-200 dark:border-secondary-700'
                  }`}
                >
                  <p className="font-medium text-secondary-900 dark:text-white">{t('dark')}</p>
                </button>
                <button
                  onClick={() => {
                    setTheme('system');
                    setSettings({ ...settings, theme: 'auto' });
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.theme === 'auto' || settings.theme === 'system'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                      : 'border-secondary-200 dark:border-secondary-700'
                  }`}
                >
                  <p className="font-medium text-secondary-900 dark:text-white">{t('auto')}</p>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Info */}
        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <CardTitle>Información del Administrador</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-secondary-50 dark:bg-secondary-900">
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                  Panel de Administración
                </p>
                <p className="font-medium text-secondary-900 dark:text-white">
                  Tienes acceso completo a todas las funcionalidades del sistema
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary-50 dark:bg-secondary-900">
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                  Módulos disponibles
                </p>
                <p className="font-medium text-secondary-900 dark:text-white">
                  Pedidos, Entregables, Facturas, Conversaciones, Usuarios, Contactos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline">{t('cancel')}</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t('saving') : t('save')}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
