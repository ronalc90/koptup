'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PortalError, PortalLoading } from '@/components/dashboard/PortalStates';
import { useErrorText } from '@/hooks/useErrorText';
import { apiRequest } from '@/lib/demo-system';
import { NOTIFICATION_EMAIL_CATEGORIES, type NotificationEmailCategory, type NotificationPrefs } from '@/lib/portal';
import { BellIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

type EmailPrefs = Record<NotificationEmailCategory, boolean>;

const DEFAULT_PREFS: EmailPrefs = { pedidos: true, facturacion: true, proyectos: true, mensajes: true };

function samePrefs(a: EmailPrefs, b: EmailPrefs): boolean {
  return NOTIFICATION_EMAIL_CATEGORIES.every((k) => a[k] === b[k]);
}

/** Avisos por correo: se guardan en la cuenta y el backend los respeta al enviar. */
function EmailPreferences() {
  const t = useTranslations('settingsPage');
  const errorText = useErrorText();
  const [saved, setSaved] = useState<EmailPrefs | null>(null);
  const [draft, setDraft] = useState<EmailPrefs>(DEFAULT_PREFS);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const me = await apiRequest<{ notificationPrefs?: NotificationPrefs }>('/auth/me');
      const prefs = { ...DEFAULT_PREFS, ...(me.notificationPrefs?.email ?? {}) };
      setSaved(prefs);
      setDraft(prefs);
    } catch (err) {
      setLoadError(errorText(err));
    }
  }, [errorText]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiRequest<{ notificationPrefs: NotificationPrefs }>('/auth/me/preferences', { method: 'PATCH', body: { email: draft } });
      const next = { ...DEFAULT_PREFS, ...(res.notificationPrefs?.email ?? draft) };
      setSaved(next);
      setDraft(next);
      toast.success(t('toastSaved'));
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  if (loadError) return <PortalError compact message={loadError} onRetry={() => void load()} />;
  if (!saved) return <PortalLoading />;
  const dirty = !samePrefs(draft, saved);

  return (
    <div className="space-y-4">
      <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('emailIntro')}</p>
      {NOTIFICATION_EMAIL_CATEGORIES.map((key) => (
        <label
          key={key}
          htmlFor={`pref-${key}`}
          className="flex items-center justify-between gap-4 p-4 rounded-lg border border-secondary-200 dark:border-secondary-700 cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-900"
        >
          <span>
            <span className="block font-medium text-secondary-900 dark:text-white">{t(`email.${key}.title`)}</span>
            <span className="block text-sm text-secondary-600 dark:text-secondary-400">{t(`email.${key}.desc`)}</span>
          </span>
          <input
            id={`pref-${key}`}
            type="checkbox"
            checked={draft[key]}
            onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.checked }))}
            className="w-5 h-5 rounded border-secondary-300 text-primary-600 focus:ring-primary-500 flex-shrink-0"
          />
        </label>
      ))}
      <p className="text-xs text-secondary-500">{t('inPortalNote')}</p>
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
        <Button variant="outline" onClick={() => setDraft(saved)} disabled={!dirty || saving}>
          {t('cancel')}
        </Button>
        <Button onClick={() => void save()} disabled={!dirty || saving} isLoading={saving} data-testid="save-preferences">
          {saving ? t('saving') : t('save')}
        </Button>
      </div>
    </div>
  );
}

function SettingsContent() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const t = useTranslations('settingsPage');
  const [language, setLanguage] = useState('es');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLanguage(document.cookie.match(/(?:^|; )locale=([^;]+)/)?.[1] === 'en' ? 'en' : 'es');
    setMounted(true);
  }, []);

  const changeLanguage = (next: string) => {
    setLanguage(next);
    document.cookie = `locale=${next}; path=/; max-age=${31536000}; SameSite=Lax`;
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
      className={`p-4 rounded-lg border-2 transition-all ${currentTheme === value ? 'border-primary-500 bg-primary-50 dark:bg-primary-950' : 'border-secondary-200 dark:border-secondary-700'}`}
    >
      <span className="font-medium text-secondary-900 dark:text-white">{label}</span>
    </button>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">{t('title')}</h1>
        <p className="text-secondary-600 dark:text-secondary-400">{t('subtitle')}</p>
      </div>

      <Card variant="bordered">
        <CardHeader>
          <div className="flex items-center gap-3">
            <BellIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <CardTitle>{t('notifications')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <EmailPreferences />
        </CardContent>
      </Card>

      <Card variant="bordered">
        <CardHeader>
          <div className="flex items-center gap-3">
            <GlobeAltIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <CardTitle>{t('languageAndAppearance')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="portal-language" className="block text-sm font-medium text-secondary-900 dark:text-white mb-2">
              {t('language')}
            </label>
            <select
              id="portal-language"
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
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
          <p className="text-xs text-secondary-500">{t('appliedNow')}</p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Portal › Configuración: avisos por correo por categoría (guardados en la
 * cuenta y respetados por los envíos), idioma y tema (se aplican al momento).
 */
export default function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsContent />
    </DashboardLayout>
  );
}
