'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    privacy: {
      profileVisible: true,
      activityTracking: true,
    },
    language: 'es',
    theme: 'light',
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    alert('Configuración guardada exitosamente');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
            Configuración
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Administra las preferencias de tu cuenta
          </p>
        </div>

        {/* Notifications */}
        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center gap-3">
              <BellIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <CardTitle>Notificaciones</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-lg border border-secondary-200 dark:border-secondary-700 cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-900">
              <div>
                <p className="font-medium text-secondary-900 dark:text-white">Notificaciones por Email</p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Recibir actualizaciones por correo electrónico
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
                <p className="font-medium text-secondary-900 dark:text-white">Notificaciones Push</p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Recibir notificaciones en el navegador
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
                <p className="font-medium text-secondary-900 dark:text-white">Notificaciones SMS</p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Recibir mensajes de texto importantes
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

        {/* Privacy */}
        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <CardTitle>Privacidad y Seguridad</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-lg border border-secondary-200 dark:border-secondary-700 cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-900">
              <div>
                <p className="font-medium text-secondary-900 dark:text-white">Perfil Público</p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Permitir que otros usuarios vean tu perfil
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.privacy.profileVisible}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, profileVisible: e.target.checked },
                  })
                }
                className="w-5 h-5 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-lg border border-secondary-200 dark:border-secondary-700 cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-900">
              <div>
                <p className="font-medium text-secondary-900 dark:text-white">Seguimiento de Actividad</p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Ayudarnos a mejorar tu experiencia
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.privacy.activityTracking}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, activityTracking: e.target.checked },
                  })
                }
                className="w-5 h-5 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
            </label>

            <div className="p-4 rounded-lg border border-secondary-200 dark:border-secondary-700">
              <div className="flex items-center gap-3 mb-3">
                <KeyIcon className="h-5 w-5 text-secondary-400" />
                <p className="font-medium text-secondary-900 dark:text-white">Autenticación de Dos Factores</p>
              </div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
                Agrega una capa extra de seguridad a tu cuenta
              </p>
              <Button variant="outline" size="sm">
                Configurar 2FA
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Language & Theme */}
        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center gap-3">
              <GlobeAltIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <CardTitle>Idioma y Apariencia</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-900 dark:text-white mb-2">
                Idioma
              </label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-900 dark:text-white mb-2">
                Tema
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setSettings({ ...settings, theme: 'light' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.theme === 'light'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                      : 'border-secondary-200 dark:border-secondary-700'
                  }`}
                >
                  <p className="font-medium text-secondary-900 dark:text-white">Claro</p>
                </button>
                <button
                  onClick={() => setSettings({ ...settings, theme: 'dark' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.theme === 'dark'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                      : 'border-secondary-200 dark:border-secondary-700'
                  }`}
                >
                  <p className="font-medium text-secondary-900 dark:text-white">Oscuro</p>
                </button>
                <button
                  onClick={() => setSettings({ ...settings, theme: 'auto' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.theme === 'auto'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                      : 'border-secondary-200 dark:border-secondary-700'
                  }`}
                >
                  <p className="font-medium text-secondary-900 dark:text-white">Auto</p>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline">Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
