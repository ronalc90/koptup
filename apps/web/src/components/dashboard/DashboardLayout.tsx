'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  HomeIcon,
  ShoppingBagIcon,
  FolderIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { prospectCanAccess } from '@/lib/auth-roles';
import { PANEL_COUNTS_EVENT } from '@/lib/portal';
import { loginUrlForCurrentPage, useSessionUser, type SessionUserInfo } from '@/hooks/useSessionUser';
import ServiceUnavailable from '@/components/errors/ServiceUnavailable';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Usuario vigente del portal (según GET /api/auth/me). Las secciones lo leen
 * con `usePortalUser()` desde componentes hijos del marco, que solo se pintan
 * cuando la sesión ya se confirmó.
 */
const PortalUserContext = createContext<{ user: SessionUserInfo | null; reload: () => void }>({ user: null, reload: () => undefined });

export function usePortalUser() {
  return useContext(PortalUserContext);
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('dashboardLayout');
  const { state, reload } = useSessionUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);
  // Usuario vigente según el backend: si el equipo le cambia el rol (p. ej. de
  // prospecto a cliente), el menú cambia sin volver a iniciar sesión.
  const blockedProspect = state.status === 'ok' && state.user.role === 'prospect' && !prospectCanAccess(pathname ?? '/dashboard');
  const user = state.status === 'ok' && !blockedProspect ? state.user : null;

  useEffect(() => {
    // Sin sesión válida: al login, conservando la página para volver.
    if (state.status === 'unauthenticated') router.replace(loginUrlForCurrentPage());
    else if (blockedProspect) router.replace('/dashboard/demos');
  }, [state.status, blockedProspect, router]);

  // Notificaciones sin leer (reales). Se refrescan al cambiar de sección, al
  // marcarlas como leídas (evento del portal) y cada minuto.
  const role = user?.role;
  useEffect(() => {
    if (!role || role === 'prospect') return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await api.getUnreadNotificationsCount();
        if (!cancelled) setNotifications(Number(data?.count ?? 0));
      } catch {
        if (!cancelled) setNotifications(0);
      }
    };
    void load();
    const timer = window.setInterval(load, 60_000);
    window.addEventListener(PANEL_COUNTS_EVENT, load);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener(PANEL_COUNTS_EVENT, load);
    };
  }, [role, pathname]);

  const handleLogout = async () => {
    await api.logout();
    localStorage.removeItem('user');
    router.push('/');
  };

  // Un prospecto (cuenta creada al aprobar una demo) solo tiene Mis demos y
  // su perfil; el middleware también lo limita en el servidor.
  const isProspect = user?.role === 'prospect';
  const navigation = isProspect
    ? [{ name: t('myDemos'), href: '/dashboard/demos', icon: KeyIcon }]
    : [
    { name: t('dashboard'), href: '/dashboard', icon: HomeIcon },
    { name: t('myDemos'), href: '/dashboard/demos', icon: KeyIcon },
    { name: t('myOrders'), href: '/dashboard/orders', icon: ShoppingBagIcon },
    { name: t('projects'), href: '/dashboard/projects', icon: FolderIcon },
    { name: t('deliverables'), href: '/dashboard/deliverables', icon: DocumentTextIcon },
    { name: t('billing'), href: '/dashboard/billing', icon: CreditCardIcon },
    { name: t('messages'), href: '/dashboard/messages', icon: ChatBubbleLeftRightIcon },
      ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname?.startsWith(href);
  };

  if (state.status === 'unavailable') return <ServiceUnavailable onRetry={reload} />;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" aria-busy="true">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-black">
      {/* Top Header */}
      <header className="bg-white dark:bg-secondary-950 border-b border-secondary-200 dark:border-secondary-700 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800"
              aria-label={sidebarOpen ? t('closeMenu') : t('openMenu')}
            >
              {sidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>

            {/* Logo */}
            <Link href={isProspect ? '/dashboard/demos' : '/dashboard'} className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="hidden sm:block font-display font-bold text-xl text-secondary-900 dark:text-white">
                KopTup
              </span>
            </Link>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              {!isProspect && (
                <Link
                  href="/dashboard/notifications"
                  className="relative p-2 rounded-lg text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                  aria-label={t('notificationsLabel', { count: notifications })}
                  data-testid="notifications-bell"
                >
                  <BellIcon className="h-6 w-6" />
                  {notifications > 0 && (
                    <span className="absolute top-1 right-1 min-w-[1rem] h-4 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications > 99 ? '99+' : notifications}
                    </span>
                  )}
                </Link>
              )}

              {/* User menu */}
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/profile"
                  className="hidden md:flex items-center gap-3 p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-950">
                    {user?.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
                        {user?.name?.[0] || 'U'}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-secondary-900 dark:text-white">
                    {user?.name?.split(' ')[0]}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                  title={t('logout')}
                  aria-label={t('logout')}
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-secondary-950 border-r border-secondary-200 dark:border-secondary-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
          style={{ top: '64px' }}
        >
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400'
                      : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700 space-y-1">
              <Link
                href="/dashboard/profile"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
              >
                <UserCircleIcon className="h-5 w-5 flex-shrink-0" />
                <span>{t('myProfile')}</span>
              </Link>
              {!isProspect && (
                <Link
                  href="/dashboard/settings"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                >
                  <Cog6ToothIcon className="h-5 w-5 flex-shrink-0" />
                  <span>{t('settings')}</span>
                </Link>
              )}
              <Link
                href="/"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
              >
                <HomeIcon className="h-5 w-5 flex-shrink-0" />
                <span>{t('backToSite')}</span>
              </Link>
            </div>
            {isProspect && (
              <div className="mt-6 p-4 rounded-lg bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800">
                <p className="text-xs font-semibold text-secondary-800 dark:text-secondary-200">{t('prospectTitle')}</p>
                <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">{t('prospectBody')}</p>
              </div>
            )}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <PortalUserContext.Provider value={{ user, reload }}>{children}</PortalUserContext.Provider>
        </main>
      </div>
    </div>
  );
}
