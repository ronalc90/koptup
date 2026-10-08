/**
 * Render con los proveedores que la web monta en src/app/layout.tsx:
 * next-intl (mensajes reales) y next-themes.
 */
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { NextIntlClientProvider, IntlErrorCode, type IntlError } from 'next-intl';
import { ThemeProvider } from 'next-themes';
import type { ReactElement, ReactNode } from 'react';
import { getTestMessages, type TestLocale } from './messages';

export interface ProviderOptions {
  locale?: TestLocale;
  /** Recibe cada error de next-intl (por ejemplo, una clave que no existe). */
  onIntlError?: (error: IntlError) => void;
}

export type RenderWithProvidersOptions = ProviderOptions & Omit<RenderOptions, 'wrapper'>;

export function TestProviders({
  children,
  locale = 'es',
  onIntlError,
}: ProviderOptions & { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <NextIntlClientProvider
        locale={locale}
        messages={getTestMessages(locale) as any}
        timeZone="America/Bogota"
        onError={(error) => {
          if (onIntlError) onIntlError(error);
          else if (error.code !== IntlErrorCode.ENVIRONMENT_FALLBACK) throw error;
        }}
      >
        {children}
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  { locale = 'es', onIntlError, ...options }: RenderWithProvidersOptions = {},
): RenderResult {
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders locale={locale} onIntlError={onIntlError}>
        {children}
      </TestProviders>
    ),
    ...options,
  });
}
