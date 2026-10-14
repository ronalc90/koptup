/**
 * Demo automatizacion: la página carga los datos de ejemplo, usa claves de
 * traducción válidas en español y en inglés, y la paleta, el inspector y las
 * ventanas responden.
 */
import { act, fireEvent, screen, within } from '@testing-library/react';
import { IntlErrorCode, type IntlError } from 'next-intl';
import Page from '../page';
import { smokeRenderPage } from '@/test-utils/smoke';
import { renderWithProviders } from '@/test-utils/render';
import type { TestLocale } from '@/test-utils/messages';

async function renderLoaded(locale: TestLocale) {
  const errors: IntlError[] = [];
  renderWithProviders(<Page />, {
    locale,
    onIntlError: (e) => {
      if (e.code !== IntlErrorCode.ENVIRONMENT_FALLBACK) errors.push(e);
    },
  });
  await screen.findByRole('group', {}, { timeout: 5000 });
  return errors;
}

describe('Demo automatizacion', () => {
  beforeEach(() => window.localStorage.clear());

  it('renderiza sin crashear', () => {
    smokeRenderPage(Page);
  });

  it.each<TestLocale>(['es', 'en'])('carga el flujo de ejemplo y recorre pestañas y ventanas sin claves inválidas (%s)', async (locale) => {
    const errors = await renderLoaded(locale);
    // Seis pasos en el lienzo y el inspector abierto en el segundo.
    expect(screen.getByRole('group').querySelectorAll('[data-step-id]')).toHaveLength(6);
    for (const tab of screen.getAllByRole('tab').filter((x) => x.closest('[role="tabpanel"]') === null && x.parentElement?.getAttribute('role') === 'tablist').slice(0, 4)) {
      act(() => {
        fireEvent.click(tab);
      });
      expect(tab).toHaveAttribute('aria-selected', 'true');
    }
    // Plantillas, casos para revisar y JSON abren y cierran con Escape.
    const openers = [locale === 'es' ? /^Plantillas$/ : /^Templates$/, locale === 'es' ? /Revisar casos/ : /Review cases/, locale === 'es' ? /Definición del flujo/ : /Workflow definition/];
    for (const name of openers) {
      act(() => {
        fireEvent.click(screen.getAllByRole('button', { name })[0]);
      });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      act(() => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    }
    expect(errors.map((e) => e.message)).toEqual([]);
  });

  it('un clic en la paleta agrega el paso después del elegido y se puede deshacer', async () => {
    await renderLoaded('es');
    const canvas = screen.getByRole('group');
    const palette = screen.getAllByRole('complementary')[0];
    act(() => {
      fireEvent.click(within(palette).getByRole('button', { name: /Esperar/ }));
    });
    const nodes = canvas.querySelectorAll('[data-step-id]');
    expect(nodes).toHaveLength(7);
    expect(nodes[2].textContent).toContain('Esperar');
    expect(screen.getAllByText('Cambios sin guardar').length).toBeGreaterThan(0);
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    });
    expect(canvas.querySelectorAll('[data-step-id]')).toHaveLength(6);
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    });
    expect(canvas.querySelectorAll('[data-step-id]')).toHaveLength(7);
  });

  it('el estado se guarda en el navegador', async () => {
    await renderLoaded('es');
    const raw = window.localStorage.getItem('koptup-demo-automatizacion:v1:es');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string).workflows).toHaveLength(3);
  });
});
