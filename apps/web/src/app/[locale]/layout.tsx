// apps/web/src/app/[locale]/layout.tsx
import React from 'react';
import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import ThemeProvider from '@/components/providers/ThemeProvider';
import ConditionalLayout from '@/components/layout/ConditionalLayout';
import ClientToaster from '@/components/ClientToaster';
import Analytics from '@/components/analytics/Analytics';
import CookieBanner from '@/components/consent/CookieBanner';
import { routing } from '@/i18n/routing';
import { localeAlternates, localizedUrl } from '@/lib/i18n-url';
import { HOME_DESCRIPTION, HOME_DESCRIPTION_EN, HOME_TITLE, HOME_TITLE_EN, SITE_NAME, SITE_URL, TITLE_TEMPLATE } from '@/lib/site';
import '../globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

// Título por defecto de las páginas sin metadata propia (login, dashboard…).
// Ya trae el sufijo porque el `default` del layout raíz no pasa por la
// plantilla. La home lo reemplaza por HOME_TITLE (title.absolute en page.tsx).
const DEFAULT_TITLE = 'IA que responde con los documentos de tu empresa | KopTup';
const DEFAULT_TITLE_EN = 'AI that answers from your company documents | KopTup';

// Un segmento de idioma distinto de es/en responde 404 sin renderizar nada.
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const en = locale === 'en';
  const homeTitle = en ? HOME_TITLE_EN : HOME_TITLE;
  const homeDescription = en ? HOME_DESCRIPTION_EN : HOME_DESCRIPTION;
  return {
    metadataBase: new URL(SITE_URL),
    // Formato final: "<título> | KopTup", ≤ 60 caracteres
    // (verificar con `node scripts/check-titles.mjs`).
    title: {
      default: en ? DEFAULT_TITLE_EN : DEFAULT_TITLE,
      template: TITLE_TEMPLATE,
    },
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'KopTup',
    },
    // Desde Next 15, `capable` emite solo la etiqueta estándar
    // (`mobile-web-app-capable`); la de Apple, que era la única que emitía
    // Next 14, va aparte para que la página siga teniendo las dos.
    other: {
      'apple-mobile-web-app-capable': 'yes',
    },
    // Description, canonical y og/twitter de la home (y valores por defecto del
    // sitio para las páginas que no definen los suyos).
    description: homeDescription,
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
      locale: locale === 'en' ? 'en_US' : 'es_CO',
      url: localizedUrl('/', locale),
      siteName: SITE_NAME,
      title: homeTitle,
      description: homeDescription,
    },
    twitter: {
      card: 'summary_large_image',
      title: homeTitle,
      description: homeDescription,
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
    // Canonical y hreflang de la home en cada idioma. Cada página de contenido
    // define el suyo (vía seo-config), evitando que hereden este valor.
    alternates: localeAlternates('/', locale),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Sin esta llamada, next-intl leería el idioma de las cabeceras y la página
  // dejaría de ser estática.
  setRequestLocale(locale);
  const messages = await getMessages();

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

            {/* Consentimiento de cookies y etiquetas de medición (GA4, Google
                Ads, LinkedIn): solo con variable de entorno y consentimiento. */}
            <CookieBanner />
            <Analytics />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
