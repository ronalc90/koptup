// apps/web/src/app/layout.tsx
import React from 'react';
import { Inter, Poppins } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import getRequestConfig from '@/i18n/request';
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
  title: 'KopTup - Soluciones Tecnológicas a Medida',
  description:
    'Desarrollamos software a medida, e-commerce, chatbots inteligentes, aplicaciones móviles y más. Innovación que impulsa tu negocio.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, messages } = await getRequestConfig();

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
