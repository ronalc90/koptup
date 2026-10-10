import { request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import { adminSession, API_URL, clientSession, HAS_API, NEEDS_API, staffSession, visitorIp, type Session } from './support/backend';
import { actAsVisitor, expect, test } from './support/fixtures';

/**
 * Portal del cliente y panel de operación con datos reales (wiki 16, P1 1.1–1.8
 * y P2 2.1–2.21):
 *  - pedido nuevo desde el portal (API de la web) → conversación automática,
 *    respuesta del equipo desde el panel, aviso al cliente y cancelación con
 *    confirmación;
 *  - el equipo aprueba el pedido y emite la factura; el cliente descarga el PDF;
 *  - el equipo crea el proyecto del cliente y comparte un entregable; el
 *    cliente lo aprueba;
 *  - usuarios (roles traducidos, enlace de contraseña) y bitácora;
 *  - sin datos inventados cuando la API falla, y "Servicio no disponible" en
 *    vez del login cuando el backend no responde.
 */

async function api(): Promise<APIRequestContext> {
  return playwrightRequest.newContext({ baseURL: `${API_URL}/`, extraHTTPHeaders: { 'X-Forwarded-For': visitorIp(), Accept: 'application/json' } });
}

/** Pedido del cliente creado por la API (multipart, como el formulario). */
async function createOrder(session: Session, name: string): Promise<string> {
  const ctx = await api();
  try {
    const res = await ctx.post('api/orders', {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      multipart: { name, currency: 'COP', items: JSON.stringify([{ name: 'Landing', quantity: 1, price: 2500000 }]) },
    });
    expect(res.status()).toBe(201);
    return (await res.json()).data.id as string;
  } finally {
    await ctx.dispose();
  }
}

test.describe('Portal del cliente y panel', () => {
  test.skip(!HAS_API, NEEDS_API);

  test('pedido desde el portal: conversación automática, respuesta del equipo y cancelación con confirmación', async ({ newActor }, testInfo) => {
    const client = await clientSession(`cliente-pedido-${testInfo.project.name}`);
    const { page, errors } = await newActor({ session: client });

    // Nuevo pedido dentro del marco del portal (campana de notificaciones visible).
    await page.goto('/dashboard/orders/new');
    await expect(page.getByRole('heading', { name: 'Nuevo pedido' })).toBeVisible();
    await expect(page.getByTestId('notifications-bell')).toBeVisible();
    const orderName = `Sitio corporativo ${testInfo.project.name}`;
    await page.fill('#order-name', orderName);
    await page.fill('#item-desc-0', 'Diseño de la página de inicio');
    await page.fill('#item-price-0', '1500000');
    await page.getByRole('button', { name: 'Crear pedido' }).click();
    await expect(page).toHaveURL(/\/dashboard\/orders\/ORD-\d{4,}$/);
    const orderId = decodeURIComponent(page.url().split('/').pop() ?? '');
    await expect(page.getByTestId('order-status')).toHaveText('Pendiente');

    // La conversación del pedido ya existe con el resumen automático.
    await page.getByRole('link', { name: 'Abrir conversación' }).click();
    await expect(page).toHaveURL(/\/dashboard\/messages\?c=CONV-\d{4,}/);
    await expect(page.getByTestId('message-thread')).toContainText('Diseño de la página de inicio');
    const conversationId = new URL(page.url()).searchParams.get('c') ?? '';

    // El equipo responde desde el panel.
    const admin = await newActor({ session: await adminSession(), device: 'desktop' });
    await admin.page.goto(`/admin/conversations/${conversationId}`);
    await expect(admin.page.getByRole('heading', { name: new RegExp(orderId) })).toBeVisible();
    const reply = `Hola, revisamos tu pedido ${orderId}.`;
    await admin.page.fill('#admin-reply', reply);
    await admin.page.getByRole('button', { name: 'Enviar' }).click();
    await expect(admin.page.locator('[data-message-role="admin"]').last()).toContainText(reply);

    // El cliente ve la respuesta y el aviso traducido.
    await page.reload();
    await expect(page.getByTestId('message-thread')).toContainText(reply);
    await page.goto('/dashboard/notifications');
    await expect(page.getByTestId('notifications-list')).toContainText('Nuevo mensaje del equipo');

    // Cancelar pide confirmación (modal del portal, no confirm() del navegador).
    await page.goto(`/dashboard/orders/${orderId}`);
    await page.getByTestId('order-cancel').click();
    await expect(page.getByRole('dialog', { name: 'Cancelar pedido' })).toBeVisible();
    await page.getByTestId('confirm-dialog-confirm').click();
    await expect(page.getByTestId('order-status')).toHaveText('Cancelado');
    await expect(page.getByTestId('order-cancel')).toHaveCount(0);

    expect(errors).toEqual([]);
    expect(admin.errors).toEqual([]);
  });

  test('el equipo aprueba el pedido y emite la factura; el cliente descarga el PDF', async ({ newActor }, testInfo) => {
    const client = await clientSession(`cliente-factura-${testInfo.project.name}`);
    const orderId = await createOrder(client, `Pedido para facturar ${testInfo.project.name}`);

    const admin = await newActor({ session: await adminSession(), device: 'desktop' });
    await admin.page.goto('/admin/orders');
    await admin.page.getByRole('searchbox').fill(orderId);
    await admin.page.getByRole('searchbox').press('Enter');
    const card = admin.page.locator(`[data-order="${orderId}"]`);
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: 'Aprobar Pedido' }).click();
    await admin.page.getByTestId('confirm-dialog-confirm').click();
    await card.getByRole('button', { name: 'Emitir factura' }).click();
    const dialog = admin.page.getByRole('dialog', { name: 'Emitir factura' });
    await dialog.getByRole('button', { name: 'Emitir factura' }).click();
    await expect(card.getByRole('link', { name: /Ver factura FAC-\d{4}-\d{4,}/ })).toBeVisible();
    const invoiceNumber = ((await card.getByRole('link', { name: /Ver factura/ }).textContent()) ?? '').match(/FAC-\d{4}-\d{4,}/)?.[0] ?? '';
    expect(invoiceNumber).not.toBe('');

    // El cliente ve la factura (a su nombre) y descarga el PDF.
    const { page, errors } = await newActor({ session: client });
    await page.goto('/dashboard/billing');
    const invoice = page.locator(`[data-invoice="${invoiceNumber}"]`);
    await expect(invoice).toContainText('Pendiente');
    const [download] = await Promise.all([page.waitForEvent('download'), invoice.getByRole('button', { name: 'Descargar PDF' }).click()]);
    expect(download.suggestedFilename()).toBe(`factura-${invoiceNumber}.pdf`);

    // Avisos reales en el portal.
    await page.goto('/dashboard/notifications');
    await expect(page.getByTestId('notifications-list')).toContainText(`Pedido ${orderId} aprobado`);
    await expect(page.getByTestId('notifications-list')).toContainText(`Nueva factura ${invoiceNumber}`);
    expect(errors).toEqual([]);
    expect(admin.errors).toEqual([]);
  });

  test('el equipo crea el proyecto y comparte un entregable; el cliente lo aprueba', async ({ newActor }, testInfo) => {
    const client = await clientSession(`cliente-proyecto-${testInfo.project.name}`);
    const projectName = `Portal de clientes ${testInfo.project.name} ${Date.now().toString(36)}`;

    const admin = await newActor({ session: await adminSession(), device: 'desktop' });
    await admin.page.goto('/admin/proyectos');
    await admin.page.getByRole('button', { name: 'Nuevo proyecto' }).click();
    const projectDialog = admin.page.getByRole('dialog', { name: 'Nuevo proyecto' });
    await projectDialog.getByRole('searchbox').fill(client.user.email);
    await projectDialog.getByTestId('client-picker-option').first().click();
    await expect(projectDialog.getByTestId('client-picker-selected')).toContainText(client.user.email);
    await projectDialog.locator('#prj-name').fill(projectName);
    await projectDialog.getByRole('button', { name: 'Crear proyecto' }).click();
    await expect(admin.page.getByText(projectName).first()).toBeVisible();

    await admin.page.goto('/admin/deliverables');
    await admin.page.getByRole('button', { name: 'Nuevo entregable' }).click();
    const delDialog = admin.page.getByRole('dialog', { name: 'Nuevo entregable' });
    const option = delDialog.locator('#del-project option').filter({ hasText: projectName });
    await expect(option).toHaveCount(1);
    await delDialog.locator('#del-project').selectOption((await option.getAttribute('value')) ?? '');
    await delDialog.locator('#del-title').fill('Prototipo navegable');
    await delDialog.getByLabel('Compartir enlace').first().check();
    await delDialog.getByRole('textbox', { name: 'Compartir enlace' }).fill('https://example.com/prototipo');
    await delDialog.getByRole('button', { name: 'Compartir con el cliente' }).click();
    await expect(admin.page.getByText('Prototipo navegable').first()).toBeVisible();

    const { page, errors } = await newActor({ session: client });
    await page.goto('/dashboard');
    await expect(page.getByTestId('home-projects')).toContainText(projectName);
    await page.goto('/dashboard/projects');
    await expect(page.getByTestId('projects-list')).toContainText(projectName);
    await page.goto('/dashboard/deliverables');
    const item = page.locator('[data-deliverable]').filter({ hasText: 'Prototipo navegable' });
    await expect(item).toContainText('Por revisar');
    await item.getByRole('button', { name: 'Aprobar' }).click();
    const review = page.getByRole('dialog', { name: 'Aprobar "Prototipo navegable"' });
    await review.getByRole('button', { name: 'Aprobar' }).click();
    await expect(item).toContainText('Aprobado');
    expect(errors).toEqual([]);
    expect(admin.errors).toEqual([]);
  });

  test('usuarios: roles traducidos, enlace de contraseña del admin y bitácora; el gerente solo consulta', async ({ newActor }, testInfo) => {
    const client = await clientSession(`cliente-usuarios-${testInfo.project.name}`);
    const admin = await newActor({ session: await adminSession(), device: 'desktop' });
    await admin.page.goto('/admin/users');
    await admin.page.getByRole('searchbox').fill(client.user.email);
    await admin.page.getByRole('searchbox').press('Enter');
    const row = admin.page.locator('tr').filter({ hasText: client.user.email });
    await expect(row.locator('[data-role="client"]')).toHaveText('Cliente');
    await row.getByRole('button', { name: `Generar enlace de contraseña para ${client.user.name}` }).click();
    await admin.page.getByTestId('confirm-dialog-confirm').click();
    await expect(admin.page.getByTestId('reset-link')).toHaveValue(/\/reset-password\?token=/);

    await admin.page.goto('/admin/bitacora');
    await admin.page.locator('#audit-group').selectOption('user');
    await admin.page.getByRole('button', { name: 'Filtrar' }).click();
    await expect(admin.page.locator('[data-audit="user.reset_link"]').first()).toContainText('Enlace de contraseña generado');
    expect(admin.errors).toEqual([]);

    const manager = await newActor({ session: await staffSession('manager', 'gerente-usuarios'), device: 'desktop' });
    await manager.page.goto('/admin/users');
    await expect(manager.page.getByText('Solo un administrador puede cambiarlos')).toBeVisible();
    await expect(manager.page.locator('select[id^="role-"]')).toHaveCount(0);
    await manager.page.goto('/admin/bitacora');
    await expect(manager.page).toHaveURL(/\/admin\/?$/);
    expect(manager.errors).toEqual([]);
  });

  test('sin datos inventados: si la API falla se ve el error con reintento; backend caído no manda al login', async ({ newActor }, testInfo) => {
    const client = await clientSession(`cliente-errores-${testInfo.project.name}`);
    const { page, context } = await newActor({ session: client });

    await context.route(/\/api\/invoices(\?|$)/, (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{"success":false}' }));
    await page.goto('/dashboard/billing');
    await expect(page.getByTestId('portal-error')).toContainText('El servidor tuvo un problema');
    await expect(page.getByText('INV-2025-045')).toHaveCount(0);
    await context.unroute(/\/api\/invoices(\?|$)/);
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(page.getByTestId('portal-empty')).toContainText('Aún no tienes facturas');

    // El backend no responde la sesión: "Servicio no disponible", no el login.
    await context.route(/\/api\/auth\/me(\?|$)/, (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"success":false}' }));
    await page.goto('/dashboard/orders');
    await expect(page.getByRole('heading', { name: 'El servicio no está disponible' })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/orders$/);
    await context.unroute(/\/api\/auth\/me(\?|$)/);
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(page.getByRole('heading', { name: 'Mis pedidos' })).toBeVisible();
  });

  test('inicio de sesión: sin GitHub, Google solo si el backend lo ofrece, "Recordarme" real y ruta de regreso', async ({ browser, page }, testInfo) => {
    const ctx = await api();
    let google = false;
    try {
      google = (await (await ctx.get('api/auth/providers')).json()).data.google === true;
    } finally {
      await ctx.dispose();
    }
    const client = await clientSession(`cliente-login-${testInfo.project.name}`);

    // Sin sesión, el portal manda al login conservando la página.
    await page.goto('/dashboard/billing');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard%2Fbilling/);
    await expect(page.getByText('Continuar con GitHub')).toHaveCount(0);
    await expect(page.getByText('Continuar con Google')).toHaveCount(google ? 1 : 0);
    const remember = page.getByLabel('Recordarme');
    await expect(remember).not.toBeChecked();

    // Sin "Recordarme": la sesión es de navegador (cookie sin vencimiento propio).
    await page.fill('#email', client.user.email);
    await page.fill('#password', client.password);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL(/\/dashboard\/billing$/);
    const sessionCookie = (await page.context().cookies()).find((c) => c.name === 'refreshToken');
    expect(sessionCookie?.expires).toBe(-1);

    // Con "Recordarme": la cookie dura días.
    const other = await browser.newContext({ baseURL: testInfo.project.use.baseURL, locale: 'es-CO' });
    await actAsVisitor(other);
    try {
      const p2 = await other.newPage();
      await p2.goto('/login');
      await p2.fill('#email', client.user.email);
      await p2.fill('#password', client.password);
      await p2.getByLabel('Recordarme').check();
      await p2.getByRole('button', { name: 'Ingresar' }).click();
      await expect(p2).toHaveURL(/\/dashboard/);
      const persistent = (await other.cookies()).find((c) => c.name === 'refreshToken');
      expect(persistent?.expires ?? 0).toBeGreaterThan(Date.now() / 1000 + 2 * 24 * 60 * 60);
      // Las dos sesiones conviven: la primera sigue funcionando.
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Facturación y pagos' })).toBeVisible();
    } finally {
      await other.close();
    }
  });
});
