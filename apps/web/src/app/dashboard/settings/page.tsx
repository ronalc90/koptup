'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  BellIcon,
  GlobeAltIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const t = useTranslations('settingsPage');
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    language: 'es',
    theme: 'light',
  });

  const [saving, setSaving] = useState(false);

  // Load language from cookie and theme on mount
  useEffect(() => {
    const currentLocale = document.cookie.match(/(?:^|; )locale=([^;]+)/)?.[1] || 'es';
    const currentTheme = theme === 'system' ? 'auto' : (theme || 'light');
    setSettings(prev => ({ ...prev, language: currentLocale, theme: currentTheme }));
  }, [theme]);

  const handleLanguageChange = (newLanguage: string) => {
    // Update state
    setSettings({ ...settings, language: newLanguage });

    // Set cookie
    document.cookie = `locale=${newLanguage}; path=/; max-age=${31536000}; SameSite=Lax`;

    // Force reload to apply language change
    setTimeout(() => {
      router.refresh();
      window.location.reload();
    }, 100);
  };

  const handleSave = async () => {
    setSaving(true);

    // Save to localStorage
    localStorage.setItem('settings', JSON.stringify(settings));

    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);

    alert(t('toastSaved'));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
            {t('title')}
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            {t('subtitle')}
          </p>
        </div>

        {/* Notifications */}
        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center gap-3">
              <BellIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <CardTitle>{t('notifications')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-lg border border-secondary-200 dark:border-secondary-700 cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-900">
              <div>
                <p className="font-medium text-secondary-900 dark:text-white">{t('emailNotifications')}</p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  {t('emailDesc')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, email: e.target.checked },
                  })
                }
                className="w-5 h-5 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-lg border border-secondary-200 dark:border-secondary-700 cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-900">
              <div>
                <p className="font-medium text-secondary-900 dark:text-white">{t('pushNotifications')}</p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  {t('pushDesc')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.push}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, push: e.target.checked },
                  })
                }
                className="w-5 h-5 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-lg border border-secondary-200 dark:border-secondary-700 cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-900">
              <div>
                <p className="font-medium text-secondary-900 dark:text-white">{t('smsNotifications')}</p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  {t('smsDesc')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.sms}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, sms: e.target.checked },
                  })
                }
                className="w-5 h-5 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
          </CardContent>
        </Card>

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
                value={settings.language}
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

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline">{t('cancel')}</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t('saving') : t('save')}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
