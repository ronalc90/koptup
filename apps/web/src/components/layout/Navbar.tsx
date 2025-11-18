'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname,useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { Bars3Icon, XMarkIcon, MoonIcon, SunIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [currentLocale, setCurrentLocale] = useState('es');
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

 useEffect(() => {
  setMounted(true);
  const handleScroll = () => setScrolled(window.scrollY > 20);
  window.addEventListener('scroll', handleScroll);

  const userData = localStorage.getItem('user');
  if (userData) setUser(JSON.parse(userData));

  const locale = document.cookie
    .split('; ')
    .find(row => row.startsWith('locale='))
    ?.split('=')[1] || 'es';
  setCurrentLocale(locale);

  return () => window.removeEventListener('scroll', handleScroll);
}, []);


  const navigation = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.services'), href: '/services' },
    { name: t('nav.pricing'), href: '/pricing' },
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
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/95 dark:bg-secondary-900/95 backdrop-blur-md shadow-md'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="font-display font-bold text-xl text-secondary-900 dark:text-white">
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
                    : 'text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                )}
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
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
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
                className="p-2 rounded-lg text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
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
              <Button size="sm" asChild>
                <Link href="/dashboard">{t('nav.dashboard')}</Link>
              </Button>
            ) : (
              <Button size="sm" variant="outline" asChild>
                <Link href="/login">{t('nav.login')}</Link>
              </Button>
            )}

            <Button size="sm" asChild>
              <Link href="/contact">{t('common.contactUs')}</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-secondary-700 dark:text-secondary-300"
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
        <div className="md:hidden bg-white dark:bg-secondary-900 border-t border-secondary-200 dark:border-secondary-700">
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
                <Button size="sm" fullWidth asChild>
                  <Link href="/dashboard">{t('nav.dashboard')}</Link>
                </Button>
              ) : (
                <Button size="sm" fullWidth variant="outline" asChild>
                  <Link href="/login">{t('nav.login')}</Link>
                </Button>
              )}

              <div className="flex items-center space-x-2">
                <Button size="sm" fullWidth asChild>
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
