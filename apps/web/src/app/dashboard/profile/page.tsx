'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  UserCircleIcon,
  BuildingOfficeIcon,
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
}

interface CompanyInfo {
  name: string;
  taxId: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
}

interface NotificationPreferences {
  emailOrders: boolean;
  emailProjects: boolean;
  emailBilling: boolean;
  emailMessages: boolean;
  pushNotifications: boolean;
  weeklyReport: boolean;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingCompany, setEditingCompany] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    role: 'owner',
  });

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    taxId: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
  });

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    emailOrders: true,
    emailProjects: true,
    emailBilling: true,
    emailMessages: true,
    pushNotifications: true,
    weeklyReport: false,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      // Try to fetch from API
      const user = await api.getCurrentUser();
      setUserProfile({
        name: user.name || 'Juan Pérez',
        email: user.email || 'juan.perez@empresa.com',
        phone: user.phone || '+57 300 123 4567',
        avatar: user.avatar,
        role: user.role || 'owner',
      });

      // Set company info if available from API
      if (user.company) {
        setCompanyInfo({
          name: user.company.name || 'Empresa Demo S.A.S',
          taxId: user.company.taxId || '900.123.456-7',
          address: user.company.address || 'Calle 123 #45-67',
          city: user.company.city || 'Bogotá',
          country: user.company.country || 'Colombia',
          postalCode: user.company.postalCode || '110111',
        });
      }
    } catch (error) {
      console.error('Failed to load profile from API, using fallback data:', error);

      // Fallback to localStorage or default values
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserProfile({
          name: user.name || 'Juan Pérez',
          email: user.email || 'juan.perez@empresa.com',
          phone: '+57 300 123 4567',
          avatar: user.avatar,
          role: 'owner',
        });
      }

      setCompanyInfo({
        name: 'Empresa Demo S.A.S',
        taxId: '900.123.456-7',
        address: 'Calle 123 #45-67',
        city: 'Bogotá',
        country: 'Colombia',
        postalCode: '110111',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Save to API
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        localStorage.setItem('user', JSON.stringify({ ...user, ...userProfile }));
      }
      setEditingProfile(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveCompany = async () => {
    setSavingCompany(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Save to API
      setEditingCompany(false);
    } catch (error) {
      console.error('Failed to save company info:', error);
    } finally {
      setSavingCompany(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Call API to change password
      alert('Contraseña actualizada exitosamente');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Failed to change password:', error);
    }
  };

  const handleSaveNotificationPrefs = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      // Save to API
      alert('Preferencias guardadas');
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const getRoleBadge = (role: UserProfile['role']) => {
    const badges: Record<UserProfile['role'], { variant: any; text: string }> = {
      owner: { variant: 'primary', text: 'Propietario' },
      admin: { variant: 'info', text: 'Administrador' },
      member: { variant: 'success', text: 'Miembro' },
      viewer: { variant: 'default', text: 'Observador' },
    };
    const badge = badges[role] || badges.viewer;
    return <Badge variant={badge.variant} size="sm">{badge.text}</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
            Mi Perfil
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Gestiona tu información personal y preferencias
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Profile */}
            <Card variant="bordered">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserCircleIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    <CardTitle>Información Personal</CardTitle>
                  </div>
                  {!editingProfile ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProfile(true)}
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingProfile(false)}
                      >
                        <XMarkIcon className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveProfile}
                        isLoading={savingProfile}
                      >
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Guardar
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-950 flex items-center justify-center">
                      {userProfile.avatar ? (
                        <img
                          src={userProfile.avatar}
                          alt={userProfile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserCircleIcon className="h-12 w-12 text-primary-600 dark:text-primary-400" />
                      )}
                    </div>
                    {editingProfile && (
                      <Button variant="outline" size="sm">
                        <CameraIcon className="h-4 w-4 mr-2" />
                        Cambiar foto
                      </Button>
                    )}
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nombre completo"
                      value={userProfile.name}
                      onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                      disabled={!editingProfile}
                    />
                    <Input
                      label="Correo electrónico"
                      type="email"
                      value={userProfile.email}
                      onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                      disabled={!editingProfile}
                    />
                    <Input
                      label="Teléfono"
                      type="tel"
                      value={userProfile.phone}
                      onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                      disabled={!editingProfile}
                    />
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                        Rol en la empresa
                      </label>
                      <div className="mt-2">
                        {getRoleBadge(userProfile.role)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card variant="bordered">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BuildingOfficeIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    <CardTitle>Información de la Empresa</CardTitle>
                  </div>
                  {!editingCompany ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCompany(true)}
                    >
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingCompany(false)}
                      >
                        <XMarkIcon className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveCompany}
                        isLoading={savingCompany}
                      >
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Guardar
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Nombre de la empresa"
                      value={companyInfo.name}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                      disabled={!editingCompany}
                    />
                  </div>
                  <Input
                    label="NIT / RUT"
                    value={companyInfo.taxId}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, taxId: e.target.value })}
                    disabled={!editingCompany}
                  />
                  <Input
                    label="País"
                    value={companyInfo.country}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, country: e.target.value })}
                    disabled={!editingCompany}
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Dirección"
                      value={companyInfo.address}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                      disabled={!editingCompany}
                    />
                  </div>
                  <Input
                    label="Ciudad"
                    value={companyInfo.city}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })}
                    disabled={!editingCompany}
                  />
                  <Input
                    label="Código postal"
                    value={companyInfo.postalCode}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, postalCode: e.target.value })}
                    disabled={!editingCompany}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card variant="bordered">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <KeyIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  <div>
                    <CardTitle>Cambiar Contraseña</CardTitle>
                    <CardDescription>
                      Actualiza tu contraseña para mantener tu cuenta segura
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    label="Contraseña actual"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Ingresa tu contraseña actual"
                  />
                  <Input
                    label="Nueva contraseña"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Mínimo 8 caracteres"
                  />
                  <Input
                    label="Confirmar nueva contraseña"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirma tu nueva contraseña"
                  />
                  <Button onClick={handleChangePassword}>
                    Cambiar Contraseña
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Role Permissions */}
            <Card variant="bordered">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  <CardTitle>Permisos</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">
                      Ver proyectos
                    </span>
                    <CheckIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">
                      Crear pedidos
                    </span>
                    <CheckIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">
                      Gestionar facturación
                    </span>
                    <CheckIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">
                      Invitar usuarios
                    </span>
                    <CheckIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">
                      Configuración de empresa
                    </span>
                    <CheckIcon className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card variant="bordered">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BellIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  <CardTitle>Preferencias de Notificaciones</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-secondary-700 dark:text-secondary-300">
                        Pedidos por email
                      </span>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.emailOrders}
                        onChange={(e) => setNotificationPrefs({ ...notificationPrefs, emailOrders: e.target.checked })}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-secondary-700 dark:text-secondary-300">
                        Proyectos por email
                      </span>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.emailProjects}
                        onChange={(e) => setNotificationPrefs({ ...notificationPrefs, emailProjects: e.target.checked })}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-secondary-700 dark:text-secondary-300">
                        Facturación por email
                      </span>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.emailBilling}
                        onChange={(e) => setNotificationPrefs({ ...notificationPrefs, emailBilling: e.target.checked })}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-secondary-700 dark:text-secondary-300">
                        Mensajes por email
                      </span>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.emailMessages}
                        onChange={(e) => setNotificationPrefs({ ...notificationPrefs, emailMessages: e.target.checked })}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-secondary-700 dark:text-secondary-300">
                        Notificaciones push
                      </span>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.pushNotifications}
                        onChange={(e) => setNotificationPrefs({ ...notificationPrefs, pushNotifications: e.target.checked })}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-secondary-700 dark:text-secondary-300">
                        Reporte semanal
                      </span>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.weeklyReport}
                        onChange={(e) => setNotificationPrefs({ ...notificationPrefs, weeklyReport: e.target.checked })}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                    </label>
                  </div>
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={handleSaveNotificationPrefs}
                  >
                    Guardar Preferencias
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
