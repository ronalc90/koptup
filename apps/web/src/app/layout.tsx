// apps/web/src/app/layout.tsx
import React from 'react';
import { cookies } from 'next/headers';
import { Inter, Poppins } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import ThemeProvider from '@/components/providers/ThemeProvider';
import ConditionalLayout from '@/components/layout/ConditionalLayout';
import ClientToaster from '../components/ClientToaster';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL('https://koptup.com'),
  title: {
    default: 'KopTup - Desarrollo de Software a Medida | Demos Interactivas',
    template: '%s | KopTup - Software a Medida',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KopTup',
  },
  description:
    'KopTup - Desarrollo de software a medida para empresas. Aplicaciones web y móviles, e-commerce, chatbots con IA, dashboards, automatización de procesos y transformación digital. Prueba nuestras demos interactivas.',
  keywords: [
    'desarrollo de software a medida',
    'software empresarial Colombia',
    'aplicaciones web a medida',
    'desarrollo aplicaciones móviles',
    'software personalizado',
    'e-commerce desarrollo',
    'chatbot inteligencia artificial',
    'dashboard empresarial',
    'automatización de procesos',
    'transformación digital',
    'desarrollo web Colombia',
    'empresa de software Bogotá',
    'soluciones tecnológicas empresas',
    'sistema de reservas online',
    'gestión documental',
    'control de proyectos software',
    'CMS a medida',
    'integración de sistemas',
    'consultoría tecnológica',
    'desarrollo React Next.js',
    'API desarrollo',
    'software como servicio SaaS',
    'aplicaciones empresariales',
    'diseño UX UI',
    'soporte técnico software',
  ],
  authors: [{ name: 'KopTup' }],
  creator: 'KopTup',
  publisher: 'KopTup',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: 'https://koptup.com',
    siteName: 'KopTup',
    title: 'KopTup - Desarrollo de Software a Medida | Demos Interactivas',
    description:
      'Desarrollo de software personalizado para empresas. E-commerce, chatbots con IA, dashboards, gestión documental y más. Prueba nuestras demos funcionales.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'KopTup - Desarrollo de Software a Medida',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KopTup - Desarrollo de Software a Medida | Demos Interactivas',
    description:
      'Desarrollo de software personalizado para empresas. E-commerce, chatbots con IA, dashboards y más. Prueba nuestras demos funcionales.',
    images: ['/og-image.png'],
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
  alternates: {
    canonical: 'https://koptup.com',
    languages: {
      'es-CO': 'https://koptup.com',
      'en-US': 'https://koptup.com',
      'x-default': 'https://koptup.com',
    },
  },
};

// Load messages based on locale (root + per-demo files in messages/demos/*.{locale}.json)
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

  // Merge per-demo + per-offering messages so client components resolve demoCrm, demosExtra, offering_*, etc.
  // En producción `process.cwd()` puede no apuntar a `apps/web` (monorepo / standalone),
  // por eso probamos varias rutas candidatas antes de rendirnos. Si todas fallan loggeamos
  // un warning explícito que aparece en los logs de Railway/Vercel.
  try {
    const fs = await import('fs');
    const path = await import('path');
    for (const subdir of ['demos', 'offerings']) {
      const candidates = [
        path.join(process.cwd(), 'messages', subdir),
        path.join(process.cwd(), 'apps', 'web', 'messages', subdir),
        path.join(process.cwd(), '..', 'messages', subdir),
        path.join(process.cwd(), '..', '..', 'messages', subdir),
      ];
      const dir = candidates.find((p) => {
        try {
          return fs.existsSync(p);
        } catch {
          return false;
        }
      });
      if (!dir) {
        console.warn(`[layout] messages dir not found for "${subdir}". cwd=${process.cwd()}`);
        continue;
      }
      const files = fs.readdirSync(dir).filter((f) => f.endsWith(`.${locale}.json`));
      for (const file of files) {
        try {
          const raw = fs.readFileSync(path.join(dir, file), 'utf8');
          const json = JSON.parse(raw);
          base = { ...base, ...json };
        } catch (e) {
          console.error(`[layout] failed to load ${subdir} messages: ${file}`, e);
        }
      }
    }
  } catch (e) {
    console.error('[layout] failed to read messages subdirs', e);
  }

  return base;
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
