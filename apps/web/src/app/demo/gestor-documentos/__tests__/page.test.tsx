/**
 * Demo gestor-documentos: sin sesión carga los datos de ejemplo sin llamar a
 * la API, todas las ventanas usan claves válidas en español y en inglés, y
 * las acciones principales cambian lo que se ve.
 */
import { act, fireEvent, screen, within } from '@testing-library/react';
import { IntlErrorCode, type IntlError } from 'next-intl';
import Page from '../page';
import { api } from '@/lib/api';
import { renderWithProviders } from '@/test-utils/render';
import type { TestLocale } from '@/test-utils/messages';

jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(() => Promise.reject(new Error('no debe llamar a la API sin sesión'))),
    post: jest.fn(() => Promise.reject(new Error('no debe llamar a la API sin sesión'))),
    patch: jest.fn(() => Promise.reject(new Error('no debe llamar a la API sin sesión'))),
    delete: jest.fn(() => Promise.reject(new Error('no debe llamar a la API sin sesión'))),
  },
}));


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

describe('Demo gestor-documentos', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  it.each<TestLocale>(['es', 'en'])('recorre las ventanas sin claves inválidas (%s)', async (locale) => {
    const errors = renderPage(locale);
    const grid = await screen.findByRole('list', { name: locale === 'es' ? 'Lista de documentos' : 'Document list' });
    expect(within(grid).getAllByRole('listitem')).toHaveLength(15);

    // Panel del contrato con sus herramientas.
    click(screen.getByRole('button', { name: 'Contrato de obra Torre B - Estructuras Andinas.pdf' }));
    const panel = screen.getByRole('dialog', { name: /Contrato de obra Torre B/ });
    const tools = within(panel).getAllByRole('button');
    const clauses = tools.find((b) => /Detectar cláusulas|Detect clauses/.test(b.textContent || ''))!;
    click(clauses);
    expect(screen.getByRole('dialog', { name: /Cláusulas detectadas|Detected clauses/ })).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(screen.queryByRole('dialog', { name: /Cláusulas detectadas|Detected clauses/ })).toBeNull();
    expect(screen.getByRole('dialog', { name: /Contrato de obra Torre B/ })).toBeInTheDocument();
    click(within(panel).getAllByRole('button').find((b) => /Comparar versiones|Compare versions/.test(b.textContent || ''))!);
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    click(within(panel).getAllByRole('button').find((b) => /Ver explicación|View explanation/.test(b.textContent || ''))!);
    click(within(panel).getAllByRole('button').find((b) => /Ver con marca de agua|View with watermark/.test(b.textContent || ''))!);
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    // Factura escaneada con lectura OCR.
    click(screen.getByRole('button', { name: 'Factura CV-4417 Concretos Valle (escaneada).pdf' }));
    click(screen.getAllByRole('button').find((b) => /Ver lectura OCR|View OCR reading/.test(b.textContent || ''))!);
    expect(screen.getByRole('dialog', { name: /Lectura OCR|Invoice OCR/ })).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    // Retención, auditoría, nueva carpeta y búsqueda por significado.
    click(screen.getAllByRole('button', { name: /Retención por carpeta|Retention by folder/ })[0]);
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    click(screen.getByRole('button', { name: /Paquete para auditoría|Audit package/ }));
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    click(screen.getAllByRole('button', { name: /Nueva carpeta|New folder/ })[0]);
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'póliza' } });
    click(screen.getByRole('button', { name: /Buscar por significado|Search by meaning/ }));
    expect(screen.getByRole('dialog', { name: /Búsqueda por significado|Search by meaning/ })).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    // Mis documentos sin sesión: invita a iniciar sesión, sin llamar a la API.
    click(screen.getByRole('tab', { name: /Mis documentos|My documents/ }));
    expect(screen.getByText(/Inicia sesión o solicita acceso para subir tus documentos|Sign in or request access to upload your documents/)).toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalled();
    expect(errors.map((e) => `${e.code}: ${e.originalMessage ?? e.message}`)).toEqual([]);
  });

  it('mueve a la papelera con confirmación, restaura y respeta la retención legal', async () => {
    renderPage('es');
    await screen.findByRole('list', { name: 'Lista de documentos' });
    click(screen.getByRole('button', { name: 'Notas de visita de interventoría.txt' }));
    click(screen.getByRole('button', { name: 'Mover a la papelera' }));
    const confirm = screen.getByRole('dialog', { name: '¿Mover a la papelera?' });
    await act(async () => {
      fireEvent.click(within(confirm).getByRole('button', { name: 'Mover a la papelera' }));
    });
    expect(screen.queryByRole('dialog', { name: '¿Mover a la papelera?' })).toBeNull();
    expect(within(screen.getByRole('list', { name: 'Lista de documentos' })).getAllByRole('listitem')).toHaveLength(14);
    click(screen.getByRole('button', { name: /^Papelera/ }));
    click(screen.getByRole('button', { name: 'Restaurar: Notas de visita de interventoría.txt' }));
    expect(within(screen.getByRole('list', { name: 'Lista de documentos' })).getAllByRole('listitem')).toHaveLength(1);
    // Los cambios quedan guardados en el navegador.
    expect(window.localStorage.getItem('koptup.demo.gestorDocumentos.v1')).toContain('s-notas');

    // Retención legal en Contratos: el contrato no se puede mover a la papelera.
    click(screen.getByRole('button', { name: /^Todos los documentos/ }));
    click(screen.getAllByRole('button', { name: 'Retención por carpeta' })[0]);
    click(screen.getByRole('switch', { name: 'Retención legal en Contratos' }));
    click(screen.getByRole('button', { name: 'Listo' }));
    click(screen.getByRole('button', { name: 'Contrato de arrendamiento bodega Rionegro.docx' }));
    expect(screen.getByRole('button', { name: 'Mover a la papelera' })).toBeDisabled();
  });

  it('busca en el texto y crea una carpeta nueva', async () => {
    renderPage('es');
    await screen.findByRole('list', { name: 'Lista de documentos' });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'cláusula penal' } });
    const grid = screen.getByRole('list', { name: 'Lista de documentos' });
    expect(within(grid).getAllByRole('listitem').length).toBeLessThan(15);
    expect(within(grid).getByRole('button', { name: 'Contrato de obra Torre B - Estructuras Andinas.pdf' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } });

    click(screen.getAllByRole('button', { name: 'Nueva carpeta' })[0]);
    fireEvent.change(screen.getByLabelText('Nombre de la carpeta'), { target: { value: 'Contratos' } });
    click(screen.getByRole('button', { name: 'Crear carpeta' }));
    expect(screen.getByText('Ya hay una carpeta con ese nombre.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Nombre de la carpeta'), { target: { value: 'Interventoría' } });
    click(screen.getByRole('button', { name: 'Crear carpeta' }));
    expect(screen.getByText('Esta carpeta está vacía. Mueve documentos a ella desde el panel del documento.')).toBeInTheDocument();
  });
});
