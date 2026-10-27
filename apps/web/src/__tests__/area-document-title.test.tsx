/**
 * AreaDocumentTitle pone en el navegador el título de la sección del panel y
 * del portal («Solicitudes de demo · Panel | KopTup»). El HTML trae el del
 * área (metadata del layout) y React puede volver a escribirlo después del
 * efecto (páginas prerenderizadas con el idioma en la URL): el componente lo
 * repone.
 */
import { waitFor } from '@testing-library/react';
import { renderWithProviders as render } from '@/test-utils/render';
import AreaDocumentTitle, { areaTitleKey } from '@/components/seo/AreaDocumentTitle';

let mockPath = '/admin/solicitudes';
jest.mock('@/i18n/navigation', () => ({ usePathname: () => mockPath }));

const AREA_TITLE = 'Panel de administración | KopTup';

describe('AreaDocumentTitle', () => {
  beforeEach(() => {
    document.head.innerHTML = `<title>${AREA_TITLE}</title>`;
  });

  it('pone el título de la sección y lo repone si se vuelve a escribir el del área', async () => {
    mockPath = '/admin/solicitudes';
    const { unmount } = render(<AreaDocumentTitle area="admin" />);
    expect(document.title).toBe('Solicitudes de demo · Panel | KopTup');

    // Lo que hace React al reconciliar el <title> de la metadata del layout.
    document.querySelector('title')!.firstChild!.nodeValue = AREA_TITLE;
    await waitFor(() => expect(document.title).toBe('Solicitudes de demo · Panel | KopTup'));

    // Desmontado, ya no lo toca.
    unmount();
    document.title = AREA_TITLE;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.title).toBe(AREA_TITLE);
  });

  it('en inglés y en el portal usa los textos de su área', () => {
    mockPath = '/dashboard/demos';
    const { unmount } = render(<AreaDocumentTitle area="dashboard" />, { locale: 'en' });
    expect(document.title).toBe('My demos · My portal | KopTup');
    unmount();
  });

  it('una sección sin título propio usa el del área', () => {
    mockPath = '/admin/seccion-sin-titulo';
    const { unmount } = render(<AreaDocumentTitle area="admin" />);
    expect(document.title).toBe(AREA_TITLE);
    unmount();
  });

  it('areaTitleKey toma la sección de la ruta', () => {
    expect(areaTitleKey('admin', '/admin')).toBe('home');
    expect(areaTitleKey('admin', '/admin/accesos')).toBe('accesos');
    expect(areaTitleKey('dashboard', '/dashboard/orders/123')).toBe('orders');
    expect(areaTitleKey('admin', '/otra')).toBe('default');
    expect(areaTitleKey('admin', null)).toBe('default');
  });
});
