/**
 * Demo firma-electronica: la página renderiza sin throw, cada pestaña usa
 * claves de traducción válidas en español y en inglés, y un sobre nuevo
 * enviado desde el asistente aparece en la lista.
 */
import { act, fireEvent, screen, within } from '@testing-library/react';
import { IntlErrorCode, type IntlError } from 'next-intl';
import Page from '../page';
import { smokeRenderPage } from '@/test-utils/smoke';
import { renderWithProviders } from '@/test-utils/render';
import type { TestLocale } from '@/test-utils/messages';

function renderPage(locale: TestLocale) {
  const errors: IntlError[] = [];
  renderWithProviders(<Page />, {
    locale,
    onIntlError: (e) => {
      if (e.code !== IntlErrorCode.ENVIRONMENT_FALLBACK) errors.push(e);
    },
  });
  return errors;
}

describe('Demo firma-electronica', () => {
  beforeEach(() => window.localStorage.clear());

  it('renderiza sin crashear', () => {
    smokeRenderPage(Page);
  });

  it.each<TestLocale>(['es', 'en'])('recorre las 7 pestañas sin claves inválidas (%s)', (locale) => {
    const errors = renderPage(locale);
    const tabs = screen.getAllByRole('tab').filter((b) => b.getAttribute('aria-controls') === 'firma-panel');
    expect(tabs).toHaveLength(7);
    for (const tab of tabs) {
      act(() => {
        fireEvent.click(tab);
      });
      expect(tab).toHaveAttribute('aria-selected', 'true');
    }
    expect(errors.map((e) => `${e.code}: ${e.originalMessage ?? e.message}`)).toEqual([]);
  });

  it('un sobre enviado desde una plantilla aparece en Inicio con su evidencia', () => {
    const errors = renderPage('es');
    act(() => {
      fireEvent.click(screen.getByRole('tab', { name: /Plantillas/ }));
    });
    act(() => {
      fireEvent.click(screen.getAllByRole('button', { name: /Usar plantilla/ })[0]);
    });
    const name = screen.getByLabelText('Nombre completo');
    expect(name).toHaveValue('Andrés Felipe Gómez');
    act(() => {
      fireEvent.change(name, { target: { value: 'Mariana Quintero' } });
    });
    for (let i = 0; i < 3; i++) {
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /Siguiente/ }));
      });
    }
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Enviar para firma/ }));
    });
    expect(screen.getByRole('tab', { name: /Inicio/ })).toHaveAttribute('aria-selected', 'true');
    const panel = screen.getByRole('tabpanel');
    expect(within(panel).getByText('Contrato de trabajo a término fijo — Mariana Quintero')).toBeInTheDocument();
    expect(within(panel).getAllByText(/SOB-0009/).length).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });
});
