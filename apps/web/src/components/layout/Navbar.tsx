'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname,useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import {
  Bars3Icon,
  XMarkIcon,
  MoonIcon,
  SunIcon,
  GlobeAltIcon,
  UserCircleIcon,
  CreditCardIcon,
  LifebuoyIcon,
  ArrowRightOnRectangleIcon,
  Squares2X2Icon,
  ChevronDownIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { useAutoContrast } from '@/hooks/useAutoContrast';
import { api } from '@/lib/api';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [currentLocale, setCurrentLocale] = useState('es');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Hook para detectar automáticamente el contraste
  const { textColor, isDarkBackground } = useAutoContrast(navRef, {
    lightColor: '#ffffff',
    darkColor: '#1f2937', // gray-800
  });

 useEffect(() => {
  setMounted(true);
  const handleScroll = () => setScrolled(window.scrollY > 20);
  window.addEventListener('scroll', handleScroll);

  // Verificar si hay token válido en cookies
  const hasValidToken = document.cookie
    .split('; ')
    .some(row => row.startsWith('accessToken='));

  // Solo cargar usuario si hay token válido
  if (hasValidToken) {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  } else {
    // Si no hay token, limpiar localStorage y estado de usuario
    localStorage.removeItem('user');
    setUser(null);
  }

  const locale = document.cookie
    .split('; ')
    .find(row => row.startsWith('locale='))
    ?.split('=')[1] || 'es';
  setCurrentLocale(locale);

  return () => window.removeEventListener('scroll', handleScroll);
}, []);

  // Cerrar el menú del usuario al hacer click afuera
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignorar — seguimos limpiando localmente
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('koptup.clientType');
    }
    setUser(null);
    setUserMenuOpen(false);
    router.push('/');
  };


  const navigation = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.services'), href: '/services' },
    { name: t('nav.demos'), href: '/demo' },
    { name: t('nav.about'), href: '/about' },
    { name: t('nav.contact'), href: '/contact' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === href;
    return pathname?.startsWith(href);
  };

const toggleLanguage = () => {
  const current = document.cookie.split('; ').find(r => r.startsWith('locale='))?.split('=')[1] || 'es';
  const next = current === 'es' ? 'en' : 'es';

  // Set cookie
  document.cookie = `locale=${next}; path=/; max-age=31536000; SameSite=Lax`;

  // Log actual
  console.log(`🌐 Cambiando idioma: ${current} → ${next}`);

  // Refrescar UI local
  setCurrentLocale(next);

  // Forzar recarga completa para que el servidor use la cookie
  window.location.replace(window.location.pathname);
};




  return (
    <nav
      ref={navRef}
      className={cn(
        'fixed top-0 left-0 right-0 z-[100] transition-all duration-300',
        scrolled
          ? 'bg-white/98 dark:bg-secondary-900/98 backdrop-blur-lg shadow-lg'
          : 'bg-transparent'
      )}
      style={{
        color: textColor,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span
              className="font-display font-bold text-xl transition-colors"
              style={{ color: textColor }}
            >
              KopTup
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950'
                    : 'hover:text-primary-600 dark:hover:text-primary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                )}
                style={{
                  color: isActive(item.href) ? undefined : textColor
                }}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
              style={{ color: textColor }}
              aria-label="Toggle language"
              title={currentLocale === 'es' ? 'Cambiar a inglés' : 'Switch to Spanish'}
            >
              <GlobeAltIcon className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase">{currentLocale}</span>
            </button>

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
                style={{ color: textColor }}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>
            )}

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  style={{ color: textColor }}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                    {user?.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatar} alt={user.name || 'avatar'} className="w-full h-full object-cover" />
                    ) : (
                      <span>{(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium hidden lg:inline">
                    {user?.name?.split(' ')[0] || 'Mi cuenta'}
                  </span>
                  <ChevronDownIcon className="h-4 w-4" />
                </button>

                {userMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-60 bg-white dark:bg-secondary-900 rounded-xl shadow-xl border border-secondary-200 dark:border-secondary-800 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-secondary-200 dark:border-secondary-800">
                      <p className="text-sm font-semibold text-secondary-900 dark:text-white truncate">
                        {user?.name || 'Cliente'}
                      </p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <div className="py-1">
                      {/* TODO: extract to i18n */}
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                      >
                        <Squares2X2Icon className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                      >
                        <UserCircleIcon className="h-4 w-4" />
                        Mi cuenta
                      </Link>
                      <Link
                        href="/dashboard/billing"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                      >
                        <CreditCardIcon className="h-4 w-4" />
                        Facturas
                      </Link>
                      <Link
                        href="/contact"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                      >
                        <LifebuoyIcon className="h-4 w-4" />
                        Soporte
                      </Link>
                    </div>
                    <div className="border-t border-secondary-200 dark:border-secondary-800 py-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 text-left"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* TODO: extract to i18n */}
                <Button size="sm" variant="ghost" asChild>
                  <Link href="/demo" className="flex items-center gap-1">
                    <PlayCircleIcon className="h-4 w-4" />
                    Probar demos
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/login">{t('nav.login')}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/pricing">Quiero esto</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: textColor }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-secondary-900 border-t border-secondary-200 dark:border-secondary-700 backdrop-blur-lg shadow-lg">
          <div className="px-4 py-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'block px-4 py-2 rounded-lg text-base font-medium transition-colors',
                  isActive(item.href)
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950'
                    : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 space-y-2">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-2 py-2 mb-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm">
                      {(user?.name?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-secondary-900 dark:text-white truncate">
                        {user?.name || 'Cliente'}
                      </p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" fullWidth asChild>
                    <Link href="/dashboard">{t('nav.dashboard')}</Link>
                  </Button>
                  <Button size="sm" fullWidth variant="outline" asChild>
                    <Link href="/dashboard/billing">Facturas</Link>
                  </Button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  {/* TODO: extract to i18n */}
                  <Button size="sm" fullWidth variant="ghost" asChild>
                    <Link href="/demo">Probar demos</Link>
                  </Button>
                  <Button size="sm" fullWidth variant="outline" asChild>
                    <Link href="/login">{t('nav.login')}</Link>
                  </Button>
                  <Button size="sm" fullWidth asChild>
                    <Link href="/pricing">Quiero esto</Link>
                  </Button>
                </>
              )}

              <div className="flex items-center space-x-2">
                <Button size="sm" fullWidth variant="outline" asChild>
                  <Link href="/contact">{t('common.contactUs')}</Link>
                </Button>
                <button
                  onClick={toggleLanguage}
                  className="flex items-center justify-center gap-1 p-2 rounded-lg text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                  title={currentLocale === 'es' ? 'Cambiar a inglés' : 'Switch to Spanish'}
                >
                  <GlobeAltIcon className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase">{currentLocale}</span>
                </button>
                {mounted && (
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 rounded-lg text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                  >
                    {theme === 'dark' ? (
                      <SunIcon className="h-5 w-5" />
                    ) : (
                      <MoonIcon className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
