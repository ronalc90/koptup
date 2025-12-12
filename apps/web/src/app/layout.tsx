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
    default: 'KopTup - Auditoría Médica con IA | Glosas y Facturación en Salud',
    template: '%s | KopTup',
  },
  description:
    'Plataforma líder en auditoría médica automatizada con IA. Gestión de glosas, facturación hospitalaria, liquidación de cuentas médicas y análisis de tarifas SOAT, ISS y contratos EPS. Soluciones tecnológicas para IPS, hospitales y clínicas en Colombia.',
  keywords: [
    'auditoría médica',
    'glosas médicas',
    'facturación en salud',
    'liquidación cuentas médicas',
    'auditoría con IA',
    'gestión glosas hospitalarias',
    'tarifas SOAT',
    'tarifas ISS',
    'contratos EPS',
    'Nueva EPS',
    'Salud Total',
    'Compensar',
    'facturación hospitalaria',
    'sistema de salud Colombia',
    'IPS Colombia',
    'hospitales Colombia',
    'software médico',
    'automatización salud',
    'auditoría automatizada',
    'ley 100',
    'resolución 3047',
    'CUPS',
    'CIE-10',
    'radicación cuentas médicas',
    'validación facturas médicas',
    'glosas administrativas',
    'glosas técnicas',
    'optimización facturación médica',
    'reducción glosas',
    'inteligencia artificial salud',
    'chatbot médico',
    'asistente virtual salud',
    'gestión documental médica',
    'análisis de procedimientos médicos',
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
    title: 'KopTup - Auditoría Médica con IA | Glosas y Facturación en Salud',
    description:
      'Automatiza la auditoría médica, gestiona glosas y optimiza la facturación en salud con inteligencia artificial. Soluciones para IPS, hospitales y clínicas en Colombia.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'KopTup - Auditoría Médica con IA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KopTup - Auditoría Médica con IA | Glosas y Facturación en Salud',
    description:
      'Automatiza la auditoría médica, gestiona glosas y optimiza la facturación en salud con inteligencia artificial.',
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
  verification: {
    google: 'google-site-verification-code', // Replace with actual code from Google Search Console
  },
  alternates: {
    canonical: 'https://koptup.com',
    languages: {
      'es-CO': 'https://koptup.com',
      'en-US': 'https://koptup.com/en',
    },
  },
};

// Load messages based on locale
async function getMessages(locale: string) {
  try {
    return (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for ${locale}, falling back to es`, error);
    try {
      return (await import('../../messages/es.json')).default;
    } catch (fallbackError) {
      console.error('Failed to load fallback messages', fallbackError);
      return {};
    }
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read locale from cookies (set by Navbar toggleLanguage)
  const cookieStore = cookies();
  const localeCookie = cookieStore.get('locale');
  const locale = localeCookie?.value || 'es'; // Default to Spanish

  const messages = await getMessages(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
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
