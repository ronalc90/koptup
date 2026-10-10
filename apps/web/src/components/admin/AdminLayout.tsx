'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  InboxArrowDownIcon,
  KeyIcon,
  Squares2X2Icon,
  HomeIcon,
  ShieldCheckIcon,
  FolderIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { api } from '@/lib/api';
import { ADMIN_PANEL_ROLES, DEMO_ADMIN_ROLES, adminRolesFor, hasRole, homePathForRole } from '@/lib/auth-roles';
import { apiRequest } from '@/lib/demo-system';
import { PANEL_COUNTS_EVENT } from '@/lib/portal';
import { loginUrlForCurrentPage, useSessionUser } from '@/hooks/useSessionUser';
import ServiceUnavailable from '@/components/errors/ServiceUnavailable';

type NavItem = { name: string; href: string; icon: typeof HomeIcon; badge?: number };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('adminLayout');
  const { state, reload } = useSessionUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pending, setPending] = useState<number | null>(null);
  const [unreadConversations, setUnreadConversations] = useState<number | null>(null);
  // Usuario vigente según el backend (el rol se actualiza sin volver a iniciar sesión).
  const user = state.status === 'ok' && hasRole(state.user.role, adminRolesFor(pathname ?? '/admin')) ? state.user : null;

  useEffect(() => {
    if (state.status === 'unauthenticated') {
      router.replace(loginUrlForCurrentPage());
      return;
    }
    // Rol sin acceso a esta sección (p. ej. se lo cambiaron): a su página de inicio.
    if (state.status === 'ok' && !hasRole(state.user.role, adminRolesFor(pathname ?? '/admin'))) {
      router.replace(homePathForRole(state.user.role));
    }
  }, [state, router, pathname]);

  // Contadores del menú: solicitudes por atender (pendientes + en revisión,
  // igual que el inicio) y conversaciones con mensajes del cliente sin leer.
  // Se refrescan al navegar, al aprobar o rechazar (evento del panel), al
  // volver a la pestaña y cada minuto.
  const role = user?.role;
  useEffect(() => {
    if (!role) return;
    let cancelled = false;
    const load = () => {
      if (hasRole(role, DEMO_ADMIN_ROLES)) {
        apiRequest<{ conteos: Record<string, number> }>('/admin/demo-requests?limit=1')
          .then((data) => {
            if (!cancelled) setPending((data.conteos?.pendiente ?? 0) + (data.conteos?.en_revision ?? 0));
          })
          .catch(() => undefined);
      }
      if (hasRole(role, ADMIN_PANEL_ROLES)) {
        apiRequest<Array<{ teamUnread?: number }>>('/admin/conversations?status=active')
          .then((rows) => {
            if (!cancelled) setUnreadConversations(Array.isArray(rows) ? rows.filter((r) => (r.teamUnread ?? 0) > 0).length : 0);
          })
          .catch(() => undefined);
      }
    };
    load();
    const timer = window.setInterval(load, 60_000);
    window.addEventListener(PANEL_COUNTS_EVENT, load);
    window.addEventListener('focus', load);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener(PANEL_COUNTS_EVENT, load);
      window.removeEventListener('focus', load);
    };
  }, [role, pathname]);

  const handleLogout = async () => {
    await api.logout();
    localStorage.removeItem('user');
    router.push('/');
  };

  const isOps = hasRole(user?.role, ADMIN_PANEL_ROLES);

  const commercial: NavItem[] = [
    { name: t('demoRequests'), href: '/admin/solicitudes', icon: InboxArrowDownIcon, badge: pending ?? undefined },
    { name: t('demoGrants'), href: '/admin/accesos', icon: KeyIcon },
    { name: t('demoCatalog'), href: '/admin/catalogo-demos', icon: Squares2X2Icon },
  ];

  const operations: NavItem[] = isOps
    ? [
        { name: t('home'), href: '/admin', icon: HomeIcon },
        { name: t('orders'), href: '/admin/orders', icon: ClipboardDocumentListIcon },
        { name: t('projects'), href: '/admin/proyectos', icon: FolderIcon },
        { name: t('deliverables'), href: '/admin/deliverables', icon: DocumentTextIcon },
        { name: t('invoices'), href: '/admin/invoices', icon: BanknotesIcon },
        { name: t('conversations'), href: '/admin/conversations', icon: ChatBubbleLeftRightIcon, badge: unreadConversations ?? undefined },
        { name: t('users'), href: '/admin/users', icon: UserGroupIcon },
        { name: t('contacts'), href: '/admin/contacts', icon: EnvelopeIcon },
        // Derechos del titular (Ley 1581) y bitácora: solo el rol admin.
        ...(user?.role === 'admin'
          ? [
              { name: t('privacy'), href: '/admin/privacidad', icon: ShieldCheckIcon },
              { name: t('auditLog'), href: '/admin/bitacora', icon: ClockIcon },
            ]
          : []),
      ]
    : [];

  const isActive = (href: string) => (href === '/admin' ? pathname === href : pathname === href || pathname?.startsWith(`${href}/`));

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
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
        <span className="flex-1">{item.name}</span>
        {item.badge ? (
          <span
            className="min-w-[1.5rem] px-1.5 py-0.5 rounded-full bg-primary-600 text-white text-xs font-bold text-center"
            data-testid={item.href === '/admin/solicitudes' ? 'pending-requests-badge' : `badge-${item.href.split('/').pop()}`}
            aria-label={t('badgeLabel', { count: item.badge })}
          >
            {item.badge}
          </span>
        ) : null}
      </Link>
    );
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
      <header className="bg-white dark:bg-secondary-950 border-b border-secondary-200 dark:border-secondary-700 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800"
              aria-label={sidebarOpen ? t('closeMenu') : t('openMenu')}
            >
              {sidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
            <Link href={homePathForRole(user?.role)} className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="hidden sm:block font-display font-bold text-xl text-secondary-900 dark:text-white">
                {t('brand')}
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/" className="hidden sm:inline text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:text-primary-600">
                {t('viewSite')}
              </Link>
              <span className="hidden md:inline text-sm text-secondary-500 dark:text-secondary-400">
                {user?.name} · {t(`roles.${['admin', 'manager', 'sales'].includes(user.role) ? user.role : 'other'}`)}
              </span>
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
      </header>

      <div className="flex">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-secondary-950 border-r border-secondary-200 dark:border-secondary-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
          style={{ top: '64px' }}
        >
          <nav className="p-4 space-y-1">
            <p className="px-4 pt-1 pb-2 text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
              {t('groupCommercial')}
            </p>
            {commercial.map(renderItem)}
            {operations.length > 0 && (
              <>
                <p className="px-4 pt-5 pb-2 text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                  {t('groupOperations')}
                </p>
                {operations.map(renderItem)}
              </>
            )}
            {isOps && (
              <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700 space-y-1">
                <Link
                  href="/admin/settings"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                >
                  <Cog6ToothIcon className="h-5 w-5 flex-shrink-0" />
                  <span>{t('settings')}</span>
                </Link>
              </div>
            )}
          </nav>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
