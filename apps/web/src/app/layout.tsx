// apps/web/src/app/layout.tsx
import React from 'react';
import { cookies } from 'next/headers';
import { Inter, Poppins } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import ThemeProvider from '@/components/providers/ThemeProvider';
import ConditionalLayout from '@/components/layout/ConditionalLayout';
import ClientToaster from '../components/ClientToaster';
import { HOME_DESCRIPTION, HOME_TITLE, SITE_NAME, SITE_URL, TITLE_TEMPLATE } from '@/lib/site';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

// Título por defecto de las páginas sin metadata propia (login, dashboard…).
// Ya trae el sufijo porque el `default` del layout raíz no pasa por la
// plantilla. La home lo reemplaza por HOME_TITLE (title.absolute en app/page.tsx).
const DEFAULT_TITLE = 'IA que responde con los documentos de tu empresa | KopTup';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  // Formato final: "<título> | KopTup", ≤ 60 caracteres
  // (verificar con `node scripts/check-titles.mjs`).
  title: {
    default: DEFAULT_TITLE,
    template: TITLE_TEMPLATE,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KopTup',
  },
  // Description, canonical y og/twitter de la home (y valores por defecto del
  // sitio para las páginas que no definen los suyos).
  description: HOME_DESCRIPTION,
  authors: [{ name: 'KopTup' }],
  creator: 'KopTup',
  publisher: 'KopTup',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // Sin `images`: la imagen og la genera src/app/opengraph-image.tsx (archivo
  // de metadata de Next) y twitter:image la hereda de og:image. Las páginas de
  // contenido declaran sus propias imágenes vía seo-config.
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    creator: '@koptup',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: { google: ['3ec311666f8be2b7', 'M4CeqSjLCXpbpvE0trc5A-KAyWYoW-8lgDv1v4jNG9M'] },
  // Canonical de la home. Cada página de contenido define el suyo propio
  // (vía su layout + seo-config), evitando que hereden este valor.
  // No declaramos hreflang porque el idioma es por cookie y no hay rutas /es /en
  // distintas; un hreflang que apunta a la misma URL no aporta nada.
  alternates: {
    canonical: SITE_URL,
  },
};

async function loadAggregate(locale: string, name: 'demos' | 'offerings'): Promise<Record<string, any>> {
  try {
    const mod = await import(`../../messages/_${name}.${locale}.json`);
    return (mod as any).default ?? mod;
  } catch (err) {
    console.warn(`[layout] no aggregate for ${name}.${locale} — ejecuta "npm run merge-messages"`, err);
    return {};
  }
}

async function getMessages(locale: string) {
  let base: Record<string, any>;
  try {
    base = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for ${locale}, falling back to es`, error);
    try {
      base = (await import('../../messages/es.json')).default;
    } catch (fallbackError) {
      console.error('Failed to load fallback messages', fallbackError);
      base = {};
    }
  }

  const [demoMessages, offeringMessages] = await Promise.all([
    loadAggregate(locale, 'demos'),
    loadAggregate(locale, 'offerings'),
  ]);
  return { ...base, ...demoMessages, ...offeringMessages };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read locale from cookies (set by Navbar toggleLanguage)
  const cookieStore = cookies();
  const localeCookie = cookieStore.get('locale');
  const locale = localeCookie?.value || 'es'; // Default to Spanish

  const messages = await getMessages(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.google.com" />
        <link rel="dns-prefetch" href="https://koptup-uploads.s3.amazonaws.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function (regs) {
                  for (var i = 0; i < regs.length; i++) regs[i].unregister();
                }).catch(function () {});
                if (window.caches && caches.keys) {
                  caches.keys().then(function (names) {
                    for (var i = 0; i < names.length; i++) {
                      if (names[i].indexOf('next') !== -1 || names[i].indexOf('workbox') !== -1) {
                        caches.delete(names[i]);
                      }
                    }
                  }).catch(function () {});
                }
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ConditionalLayout>{children}</ConditionalLayout>

            {/* Client-only toaster */}
            <ClientToaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
