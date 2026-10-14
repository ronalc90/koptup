/**
 * Admin › Privacidad es solo para el rol admin: el middleware (servidor) y el
 * layout del panel usan adminRolesFor().
 */
import { adminRolesFor } from '@/lib/auth-roles';

describe('adminRolesFor', () => {
  it('Privacidad: solo admin', () => {
    expect(adminRolesFor('/admin/privacidad')).toEqual(['admin']);
    expect(adminRolesFor('/admin/privacidad/')).toEqual(['admin']);
  });

  it('las demás secciones no cambian', () => {
    expect(adminRolesFor('/admin/contacts')).toEqual(['admin', 'manager']);
    expect(adminRolesFor('/admin/solicitudes')).toEqual(['admin', 'manager', 'sales']);
    expect(adminRolesFor('/admin/privacidad-otra')).toEqual(['admin', 'manager']);
  });
});
