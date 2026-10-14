/**
 * Humo de demo/control-proyectos: el encabezado (qué es, para quién, por dónde
 * empezar y las salidas) se pinta desde el primer render; los datos de ejemplo
 * se arman después de montar, con la fecha de hoy, sin claves de traducción
 * inexistentes (ES y EN).
 */
import { act, screen, waitFor } from '@testing-library/react';
import { IntlErrorCode, type IntlError } from 'next-intl';
import { renderWithProviders } from '@/test-utils/render';
import Page from '../page';

async function renderPage(locale: 'es' | 'en') {
  const errors: IntlError[] = [];
  await act(async () => {
    renderWithProviders(<Page />, {
      locale,
      onIntlError: (e) => {
        if (e.code !== IntlErrorCode.ENVIRONMENT_FALLBACK) errors.push(e);
      },
    });
  });
  return errors;
}

describe('Demo control-proyectos', () => {
  beforeEach(() => window.localStorage.clear());

  it('en español muestra el encabezado, las salidas y los datos de ejemplo de hoy', async () => {
    const errors = await renderPage('es');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Gestión de proyectos con portal de cliente');
    expect(screen.getByRole('link', { name: /Volver al catálogo de demos/ }).getAttribute('href')).toBe('/demo');
    expect(screen.getByRole('link', { name: /Solicitar demo guiada/ }).getAttribute('href')).toBe('/solicitar-demo?demos=control-proyectos');
    expect(screen.getByRole('link', { name: /Cotizar tu sistema de proyectos/ }).getAttribute('href')).toBe('/contact?service=gestion-proyectos');
    await waitFor(() => expect(screen.getByText(/Constructora Ladera Verde S\.A\.S\. · NIT 901\.452\.318-/)).toBeTruthy());
    expect(screen.getByRole('heading', { level: 2, name: /Prueba esto en 2 minutos/ })).toBeTruthy();
    expect(screen.getByText('0 de 5 hechos')).toBeTruthy();
    expect(errors.map((e) => e.message)).toEqual([]);
  });

  it('en inglés', async () => {
    const errors = await renderPage('en');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Project management with a client portal');
    await waitFor(() => expect(screen.getByText('0 of 5 done')).toBeTruthy());
    expect(screen.getByRole('link', { name: /Back to the demo catalog/ })).toBeTruthy();
    expect(errors.map((e) => e.message)).toEqual([]);
  });
});
