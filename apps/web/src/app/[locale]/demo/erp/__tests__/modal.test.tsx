/**
 * Ventanas de la demo ERP: Tab y Mayús+Tab no salen de la ventana de arriba,
 * Escape cierra solo la de arriba y el foco vuelve al control que la abrió.
 */
import { useState } from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { Modal } from '../components/ui';
import { renderWithProviders } from '@/test-utils/render';

jest.mock('../lib/store', () => ({ useErp: () => ({ locale: 'es', filters: { currency: 'COP' } }) }));

function Harness() {
  const [outer, setOuter] = useState(false);
  const [inner, setInner] = useState(false);
  return (
    <div>
      <button onClick={() => setOuter(true)}>Abrir</button>
      <button>Fuera</button>
      {outer && (
        <Modal title="Externa" onClose={() => setOuter(false)} footer={<button onClick={() => setInner(true)}>Abrir interna</button>}>
          <input aria-label="Campo" />
          {inner && (
            <Modal title="Interna" onClose={() => setInner(false)}>
              <button>Aceptar</button>
            </Modal>
          )}
        </Modal>
      )}
    </div>
  );
}

const tab = (shiftKey = false) => act(() => void fireEvent.keyDown(window, { key: 'Tab', shiftKey }));
const esc = () => act(() => void fireEvent.keyDown(window, { key: 'Escape' }));

describe('Demo ERP · ventanas', () => {
  it('atrapa el foco, Escape cierra solo la de arriba y el foco vuelve al control que la abrió', () => {
    renderWithProviders(<Harness />);
    const opener = screen.getByRole('button', { name: 'Abrir' });
    opener.focus();
    act(() => void fireEvent.click(opener));
    expect(screen.getAllByRole('dialog')).toHaveLength(1);

    // Desde el último control, Tab vuelve al primero (el botón Cerrar); Mayús+Tab desde el primero va al último
    const last = screen.getByRole('button', { name: 'Abrir interna' });
    last.focus();
    tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cerrar' }));
    tab(true);
    expect(document.activeElement).toBe(last);
    // Si el foco quedó fuera de la ventana, Tab lo devuelve adentro
    screen.getByRole('button', { name: 'Fuera' }).focus();
    tab();
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);

    // Ventana anidada: Escape cierra solo la interna
    last.focus();
    act(() => void fireEvent.click(last));
    expect(screen.getAllByRole('dialog')).toHaveLength(2);
    esc();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(document.activeElement).toBe(last);
    esc();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });
});
