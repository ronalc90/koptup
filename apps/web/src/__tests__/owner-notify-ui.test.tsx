/**
 * Avisos al dueño en el panel: la tarjeta de Admin › Configuración (estado
 * real de cada canal y aviso de prueba) y el estado del aviso por canal de
 * Admin › Contactos, con los mensajes reales en español e inglés.
 */
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test-utils/render';
import { getTestMessages } from '@/test-utils/messages';
import OwnerNotificationsCard from '@/components/admin/OwnerNotificationsCard';
import { ContactNotifyDetail, ContactNotifyPills, hasUndeliveredChannel, type NotifyStatus } from '@/components/admin/owner-notify';

const apiRequest = jest.fn();

jest.mock('@/lib/demo-system', () => {
  const actual = jest.requireActual('@/lib/demo-system');
  return { ...actual, apiRequest: (...args: unknown[]) => apiRequest(...args) };
});

const STATUS: NotifyStatus = {
  email: {
    proveedor: 'resend',
    configurado: true,
    destino: 'ro***@gmail.com',
    remitente: 'KopTup <avisos@koptup.com>',
    ultimoExito: '2026-10-14T15:00:00.000Z',
    ultimoFallo: null,
    ultimoError: null,
    faltan: [],
  },
  whatsapp: {
    proveedor: null,
    configurado: false,
    destino: null,
    plantilla: null,
    webhook: false,
    ultimoExito: null,
    ultimoFallo: null,
    ultimoError: null,
    faltan: ['WHATSAPP_API_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID'],
  },
  latido: { activo: true, cadaDias: 30, ultimo: null, proximo: '2026-10-15T14:00:00.000Z' },
};

function keysOf(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) => keysOf(v, prefix ? `${prefix}.${k}` : k));
}

beforeEach(() => {
  apiRequest.mockReset();
});

describe('mensajes adminNotify', () => {
  it('tienen las mismas claves en español e inglés', () => {
    const es = (getTestMessages('es') as Record<string, unknown>).adminNotify;
    const en = (getTestMessages('en') as Record<string, unknown>).adminNotify;
    expect(es).toBeTruthy();
    expect(keysOf(en).sort()).toEqual(keysOf(es).sort());
  });
});

describe('OwnerNotificationsCard', () => {
  it('muestra el estado real de cada canal, lo que falta y la prueba mensual', async () => {
    apiRequest.mockResolvedValueOnce(STATUS);
    renderWithProviders(<OwnerNotificationsCard role="admin" />);
    expect(apiRequest).toHaveBeenCalledWith('/admin/notifications/status');

    const email = await screen.findByTestId('notify-channel-email');
    expect(email).toHaveAttribute('data-configurado', 'si');
    expect(email).toHaveTextContent('Configurado');
    expect(email).toHaveTextContent('Resend (API HTTPS)');
    expect(email).toHaveTextContent('ro***@gmail.com');

    const wa = screen.getByTestId('notify-channel-whatsapp');
    expect(wa).toHaveAttribute('data-configurado', 'no');
    expect(wa).toHaveTextContent('No configurado');
    expect(wa).toHaveTextContent('WHATSAPP_API_TOKEN');
    expect(wa).toHaveTextContent('Ninguno todavía');

    expect(screen.getByTestId('notify-heartbeat')).toHaveTextContent('Cada 30 días');
  });

  it('el admin envía la prueba y ve el resultado real de cada canal', async () => {
    apiRequest
      .mockResolvedValueOnce(STATUS)
      .mockResolvedValueOnce({
        email: { configurado: true, enviado: true, id: 'mock-email-1' },
        whatsapp: { configurado: false, enviado: false },
      })
      .mockResolvedValueOnce(STATUS);
    renderWithProviders(<OwnerNotificationsCard role="admin" />);
    await screen.findByTestId('notify-channel-email');

    fireEvent.click(screen.getByTestId('notify-test-button'));
    const result = await screen.findByTestId('notify-test-result');
    expect(apiRequest).toHaveBeenCalledWith('/admin/notifications/test', { method: 'POST', body: {} });
    expect(screen.getByTestId('notify-test-email')).toHaveAttribute('data-resultado', 'enviado');
    expect(screen.getByTestId('notify-test-email')).toHaveTextContent('mock-email-1');
    expect(screen.getByTestId('notify-test-whatsapp')).toHaveAttribute('data-resultado', 'no_configurado');
    expect(result).toHaveTextContent('No se intentó: el canal no está configurado.');
    // Después de la prueba vuelve a pedir el estado (último aviso enviado).
    await waitFor(() => expect(apiRequest).toHaveBeenCalledTimes(3));
  });

  it('muestra el fallo de la prueba y el respaldo hello_world', async () => {
    apiRequest
      .mockResolvedValueOnce({ ...STATUS, whatsapp: { ...STATUS.whatsapp, configurado: true, proveedor: 'meta', plantilla: 'koptup_aviso', faltan: [] } })
      .mockResolvedValueOnce({
        email: { configurado: true, enviado: false, error: 'Resend 403: domain not verified' },
        whatsapp: { configurado: true, enviado: true, id: 'wamid.X', respaldo: 'hello_world' },
      })
      .mockResolvedValue(STATUS);
    renderWithProviders(<OwnerNotificationsCard role="admin" />);
    await screen.findByTestId('notify-channel-email');
    fireEvent.click(screen.getByTestId('notify-test-button'));
    await screen.findByTestId('notify-test-result');
    expect(screen.getByTestId('notify-test-email')).toHaveAttribute('data-resultado', 'fallido');
    expect(screen.getByTestId('notify-test-email')).toHaveTextContent('Falló: Resend 403: domain not verified');
    expect(screen.getByTestId('notify-test-whatsapp')).toHaveTextContent('hello_world');
    expect(screen.getByTestId('notify-test-whatsapp')).toHaveTextContent('koptup_aviso');
  });

  it('respaldo del correo (dominio sin verificar): lo dice en la prueba, no solo «Enviado»', async () => {
    apiRequest
      .mockResolvedValueOnce(STATUS)
      .mockResolvedValueOnce({
        email: { configurado: true, enviado: true, id: 're_1', respaldo: 'onboarding@resend.dev' },
        whatsapp: { configurado: false, enviado: false },
      })
      .mockResolvedValue(STATUS);
    renderWithProviders(<OwnerNotificationsCard role="admin" />);
    await screen.findByTestId('notify-channel-email');
    fireEvent.click(screen.getByTestId('notify-test-button'));
    await screen.findByTestId('notify-test-result');
    const fallback = screen.getByTestId('notify-test-email-fallback');
    expect(fallback).toHaveTextContent('onboarding@resend.dev');
    expect(fallback).toHaveTextContent('verifica el dominio en Resend');
    expect(fallback).not.toHaveTextContent('plantilla');
  });

  it('confirmación de entrega: sin eventos aún o con la fecha del último; oculta si WhatsApp no está configurado', async () => {
    const waOn = { ...STATUS.whatsapp, configurado: true, proveedor: 'meta' as const, plantilla: 'koptup_aviso', faltan: [], webhook: true, webhookUltimoEvento: null };
    apiRequest.mockResolvedValueOnce({ ...STATUS, whatsapp: waOn });
    const { unmount } = renderWithProviders(<OwnerNotificationsCard role="admin" />);
    expect(await screen.findByTestId('notify-webhook')).toHaveTextContent('Configurada, sin eventos aún');
    expect(screen.getByTestId('notify-webhook')).toHaveTextContent('modo Live');
    unmount();

    apiRequest.mockResolvedValueOnce({ ...STATUS, whatsapp: { ...waOn, webhookUltimoEvento: '2026-10-14T15:00:00.000Z' } });
    const second = renderWithProviders(<OwnerNotificationsCard role="admin" />);
    expect(await screen.findByTestId('notify-webhook')).toHaveTextContent('Último evento recibido');
    second.unmount();

    apiRequest.mockResolvedValueOnce(STATUS);
    renderWithProviders(<OwnerNotificationsCard role="admin" />);
    await screen.findByTestId('notify-channel-whatsapp');
    expect(screen.queryByTestId('notify-webhook')).not.toBeInTheDocument();
    expect(screen.getByTestId('notify-channel-whatsapp')).not.toHaveTextContent('Meta aceptó');
  });

  it('un error viejo seguido de un envío exitoso se muestra como recuperado; el proveedor retirado se explica', async () => {
    apiRequest.mockResolvedValueOnce({
      ...STATUS,
      email: { ...STATUS.email, ultimoFallo: '2026-10-14T14:00:00.000Z', ultimoError: 'Resend sin conexión: no se pudo conectar con el proveedor (fetch failed)' },
      whatsapp: { ...STATUS.whatsapp, proveedorNoSoportado: true, faltan: ['WHATSAPP_PROVIDER', 'WHATSAPP_API_TOKEN'] },
    });
    renderWithProviders(<OwnerNotificationsCard role="admin" />);
    expect(await screen.findByTestId('notify-channel-email-last-error')).toHaveTextContent('ya se recuperó');
    expect(screen.getByTestId('notify-unsupported-provider')).toHaveTextContent('cámbiala a meta');
  });

  it('un manager ve el botón deshabilitado con la explicación', async () => {
    apiRequest.mockResolvedValueOnce(STATUS);
    renderWithProviders(<OwnerNotificationsCard role="manager" />);
    await screen.findByTestId('notify-channel-email');
    expect(screen.getByTestId('notify-test-button')).toBeDisabled();
    expect(screen.getByText('Solo un admin puede enviar el aviso de prueba.')).toBeInTheDocument();
  });

  it('si no puede consultar el estado lo dice y deja reintentar', async () => {
    apiRequest.mockRejectedValueOnce(new Error('HTTP 500')).mockResolvedValueOnce(STATUS);
    renderWithProviders(<OwnerNotificationsCard role="admin" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos consultar el estado de los avisos: HTTP 500');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByTestId('notify-channel-email')).toBeInTheDocument();
  });

  it('se traduce al inglés', async () => {
    apiRequest.mockResolvedValueOnce(STATUS);
    renderWithProviders(<OwnerNotificationsCard role="admin" />, { locale: 'en' });
    expect(await screen.findByText('New contact notifications')).toBeInTheDocument();
    expect(screen.getByTestId('notify-channel-whatsapp')).toHaveTextContent('Not configured');
    expect(screen.getByTestId('notify-test-button')).toHaveTextContent('Send test notification');
  });
});

describe('Estado del aviso de un contacto', () => {
  it('pinta un estado por canal y el motivo del fallo', () => {
    const notificaciones = {
      email: { estado: 'enviado' as const, intentos: 1, idProveedor: 'mock-email-1' },
      whatsapp: { estado: 'fallido' as const, intentos: 2, error: '131047: fuera de la ventana', proximoIntento: '2026-10-14T16:00:00.000Z' },
    };
    renderWithProviders(<ContactNotifyPills notificaciones={notificaciones} />);
    expect(screen.getByTestId('notify-email')).toHaveTextContent('Correo: Enviado');
    expect(screen.getByTestId('notify-email')).toHaveAttribute('data-estado', 'enviado');
    expect(screen.getByTestId('notify-whatsapp')).toHaveTextContent('WhatsApp: Falló');
    expect(screen.getByTestId('notify-whatsapp')).toHaveAttribute('title', '131047: fuera de la ventana');
    expect(hasUndeliveredChannel(notificaciones)).toBe(true);
  });

  it('el detalle muestra intentos, motivo y el próximo reintento', () => {
    renderWithProviders(
      <ContactNotifyDetail
        notificaciones={{
          email: { estado: 'no_configurado', intentos: 0 },
          whatsapp: { estado: 'fallido', intentos: 2, error: '131047: fuera de la ventana', proximoIntento: '2026-10-14T16:00:00.000Z' },
        }}
      />,
    );
    expect(screen.getByTestId('notify-detail-email')).toHaveTextContent('El canal no estaba configurado en el servidor');
    const wa = screen.getByTestId('notify-detail-whatsapp');
    expect(wa).toHaveTextContent('Motivo: 131047: fuera de la ventana');
    expect(wa).toHaveTextContent('2 intentos');
    expect(wa).toHaveTextContent('Próximo reintento automático');
  });

  it('el respaldo se explica según el canal (correo: remitente; WhatsApp: plantilla)', () => {
    renderWithProviders(
      <ContactNotifyDetail
        notificaciones={{
          email: { estado: 'enviado', intentos: 1, respaldo: 'onboarding@resend.dev' },
          whatsapp: { estado: 'enviado', intentos: 1, respaldo: 'hello_world' },
        }}
      />,
    );
    expect(screen.getByTestId('notify-detail-email')).toHaveTextContent('remitente de respaldo onboarding@resend.dev');
    expect(screen.getByTestId('notify-detail-email')).not.toHaveTextContent('plantilla');
    expect(screen.getByTestId('notify-detail-whatsapp')).toHaveTextContent('plantilla de respaldo «hello_world»');
  });

  it('un contacto anterior a los avisos dice que no hay registro', () => {
    renderWithProviders(<ContactNotifyDetail notificaciones={undefined} />);
    expect(screen.getByTestId('notify-email')).toHaveAttribute('data-estado', 'sin_registro');
    expect(screen.getByText(/llegó antes de que el panel guardara/)).toBeInTheDocument();
  });

  it('con los dos canales enviados no queda nada pendiente', () => {
    expect(hasUndeliveredChannel({ email: { estado: 'enviado' }, whatsapp: { estado: 'leido' } })).toBe(false);
    expect(hasUndeliveredChannel({ email: { estado: 'enviado' }, whatsapp: { estado: 'pendiente' } })).toBe(true);
  });
});
