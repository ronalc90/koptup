/**
 * DemoAccessWatcher vigila el acceso con la demo abierta y recarga la página
 * si se pierde. Las páginas públicas dentro de una demo con acceso (la
 * verificación del certificado del LMS, lo que abre su QR) no se vigilan: sin
 * sesión, el backend responde «sin_sesion» y recargarlas creaba un ciclo de
 * recargas sin fin.
 */
import { render } from '@testing-library/react';
import DemoAccessWatcher from '@/components/demo/DemoAccessWatcher';
import { isPublicDemoSubpath } from '@/lib/demo-access-defaults';

let mockPath = '/demo/lms';
jest.mock('next/navigation', () => ({ usePathname: () => mockPath }));

const mockApiRequest = jest.fn();
jest.mock('@/lib/demo-system', () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
  hasSessionCookie: () => false,
}));

describe('DemoAccessWatcher', () => {
  beforeEach(() => {
    mockApiRequest.mockReset();
    mockApiRequest.mockResolvedValue({ allowed: false, reason: 'sin_sesion' });
  });

  it('no consulta el acceso en la verificación pública del certificado', () => {
    for (const path of ['/demo/lms/verificar', '/demo/lms/verificar/', '/demo/LMS/Verificar']) {
      mockPath = path;
      const { unmount } = render(<DemoAccessWatcher />);
      unmount();
    }
    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  it('sí vigila el resto de la demo', () => {
    mockPath = '/demo/lms';
    const { unmount } = render(<DemoAccessWatcher />);
    expect(mockApiRequest).toHaveBeenCalledTimes(1);
    expect(mockApiRequest.mock.calls[0][0]).toBe('/demo-access/lms?registrar=0');
    unmount();
  });

  it('isPublicDemoSubpath solo acepta la ruta exacta', () => {
    expect(isPublicDemoSubpath('/demo/lms/verificar')).toBe(true);
    expect(isPublicDemoSubpath('/demo/lms/verificar/')).toBe(true);
    expect(isPublicDemoSubpath('/demo/lms')).toBe(false);
    expect(isPublicDemoSubpath('/demo/lms/verificar-otra')).toBe(false);
    expect(isPublicDemoSubpath('/demo/lms/curso/verificar')).toBe(false);
    expect(isPublicDemoSubpath(null)).toBe(false);
  });
});
