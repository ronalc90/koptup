'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
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
} from '@heroicons/react/24/outline';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('dashboardPage');
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
    // Simular notificaciones
    setNotifications(3);
  }, [router]);

  const handleLogout = async () => {
    await api.logout();
    localStorage.removeItem('user');
    router.push('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Mis Pedidos', href: '/dashboard/orders', icon: ShoppingBagIcon },
    { name: 'Proyectos', href: '/dashboard/projects', icon: FolderIcon },
    { name: 'Entregables', href: '/dashboard/deliverables', icon: DocumentTextIcon },
    { name: 'Facturación', href: '/dashboard/billing', icon: CreditCardIcon },
    { name: 'Mensajes', href: '/dashboard/messages', icon: ChatBubbleLeftRightIcon },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname?.startsWith(href);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
            >
              {sidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>

            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-2">
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
              <Link
                href="/dashboard/notifications"
                className="relative p-2 rounded-lg text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800"
              >
                <BellIcon className="h-6 w-6" />
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </Link>

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
                  title="Cerrar sesión"
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
                <span>Mi Perfil</span>
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
              >
                <Cog6ToothIcon className="h-5 w-5 flex-shrink-0" />
                <span>Configuración</span>
              </Link>
            </div>
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
