/**
 * Demo moderacion-contenido: la página renderiza en español e inglés, cada
 * pestaña usa claves válidas, y las decisiones de la cola, las reglas y la
 * prueba con tu texto dejan rastro en Auditoría.
 */
import { act, fireEvent, screen, within } from '@testing-library/react';
import { IntlErrorCode, type IntlError } from 'next-intl';
import Page from '../page';
import { smokeRenderPageAsync } from '@/test-utils/smoke';
import { renderWithProviders } from '@/test-utils/render';
import type { TestLocale } from '@/test-utils/messages';
import { STORAGE_KEY } from '../lib/data';

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

const click = (el: Element) =>
  act(() => {
    fireEvent.click(el);
  });

const tab = (name: RegExp) => screen.getByRole('tab', { name });

describe('Demo moderacion-contenido', () => {
  beforeEach(() => window.localStorage.clear());

  it.each<TestLocale>(['es', 'en'])('renderiza sin crashear (%s)', async (locale) => {
    await smokeRenderPageAsync(Page, { locale });
  });

  it.each<TestLocale>(['es', 'en'])('recorre las 9 pestañas sin claves inválidas (%s)', (locale) => {
    const errors = renderPage(locale);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(9);
    for (const t of tabs) {
      click(t);
      expect(t).toHaveAttribute('aria-selected', 'true');
    }
    expect(errors.map((e) => `${e.code}: ${e.originalMessage ?? e.message}`)).toEqual([]);
  });

  it('rechazar un caso pide política y medida y queda en Auditoría', () => {
    const errors = renderPage('es');
    click(tab(/Cola de moderación/));
    click(screen.getAllByRole('button', { name: 'Rechazar c-2041' })[0]);
    const dialog = screen.getByRole('dialog', { name: 'Rechazar c-2041' });
    expect(within(dialog).getByLabelText('Política infringida')).toHaveValue('offPlatform');
    click(within(dialog).getByLabelText('Retirar y suspender la cuenta 7 días'));
    click(within(dialog).getByRole('button', { name: 'Rechazar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getAllByText('Rechazado').length).toBeGreaterThan(0);

    click(tab(/Auditoría/));
    const panel = screen.getByRole('tabpanel');
    expect(within(panel).getAllByText(/Medida: Retirar y suspender la cuenta 7 días/).length).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });

  it('aprobar y escalar dejan resultados distintos', () => {
    renderPage('es');
    click(tab(/Cola de moderación/));
    click(screen.getAllByRole('button', { name: 'Aprobar c-2054' })[0]);
    click(screen.getAllByRole('button', { name: 'Escalar c-2050' })[0]);
    const dialog = screen.getByRole('dialog', { name: 'Escalar c-2050' });
    expect(within(dialog).getByLabelText('Equipo')).toHaveValue('fraud');
    click(within(dialog).getByRole('button', { name: 'Escalar' }));
    expect(screen.getAllByText('Aprobado').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Escalado').length).toBeGreaterThan(0);
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    const byId = Object.fromEntries((saved.cases as Array<{ id: string; status: string }>).map((c) => [c.id, c.status]));
    expect(byId['c-2054']).toBe('approved');
    expect(byId['c-2050']).toBe('escalated');
  });

  it('aplicar reglas resuelve los casos automáticos de la vista', () => {
    renderPage('es');
    click(tab(/Cola de moderación/));
    // Marketplace: c-2041 (ocultar y advertir), c-2042 (rechazo), c-2053 (limitar), c-2054 (aprobar).
    click(screen.getByRole('button', { name: /Aplicar reglas a la cola \(4\)/ }));
    expect(screen.getByRole('button', { name: /Aplicar reglas a la cola \(0\)/ })).toBeDisabled();
    click(tab(/Auditoría/));
    expect(within(screen.getByRole('tabpanel')).getAllByText('Regla automática').length).toBeGreaterThanOrEqual(5);
  });

  it('una regla guardada cambia la ruta del caso y queda en Auditoría', () => {
    renderPage('es');
    click(tab(/Reglas/));
    click(screen.getAllByRole('button', { name: 'Pausada' })[0]);
    expect(screen.getByText(/Tienes 1 cambio sin guardar/)).toBeInTheDocument();
    click(screen.getByRole('button', { name: 'Guardar cambios' }));
    click(tab(/Cola de moderación/));
    expect(screen.getAllByText('Regla 8 · Escalar a un equipo').length).toBeGreaterThan(0);
    click(tab(/Auditoría/));
    expect(within(screen.getByRole('tabpanel')).getAllByText('Editó las reglas').length).toBeGreaterThanOrEqual(2);
  });

  it('tu texto se clasifica, entra a la cola y queda registrado', () => {
    renderPage('es');
    click(tab(/Clasificación/));
    act(() => {
      fireEvent.change(screen.getByPlaceholderText(/Te lo dejo más barato/), {
        target: { value: 'Préstamos al instante, sin fiador. Cobro diario en tu negocio.' },
      });
    });
    click(screen.getByRole('button', { name: 'Clasificar' }));
    const panel = screen.getByRole('tabpanel');
    expect(within(panel).getAllByText('Préstamo ilegal').length).toBeGreaterThan(0);
    click(within(panel).getByRole('button', { name: 'Enviar a la cola' }));
    click(tab(/Cola de moderación/));
    expect(screen.getAllByText(/c-3001/).length).toBeGreaterThan(0);
  });

  it('mantener y revertir una apelación cambian su estado', () => {
    renderPage('es');
    click(tab(/Apelaciones/));
    click(screen.getAllByRole('button', { name: 'Revertir decisión' })[0]);
    click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Revertir decisión' }));
    expect(screen.getByText(/Resuelta: se revirtió/)).toBeInTheDocument();
    click(screen.getAllByRole('button', { name: 'Mantener decisión' })[0]);
    click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Mantener decisión' }));
    expect(screen.getByText(/Resuelta: se mantuvo/)).toBeInTheDocument();
  });

  it('la pausa abre una ventana con cuenta regresiva y Escape la cierra', () => {
    renderPage('es');
    click(screen.getByRole('button', { name: /Tomar pausa ahora/ }));
    expect(screen.getByRole('dialog', { name: 'Pausa activa' })).toBeInTheDocument();
    expect(screen.getByText('5:00')).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
