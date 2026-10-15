import type { Page, TestInfo } from '@playwright/test';
import { SITE_URL } from '../src/lib/site';
import { encodeCert } from '../src/app/demo/lms/lib/engine';
import { adminSession, HAS_API, NEEDS_API, Api, uniqueEmail } from './support/backend';
import { collectBrowserErrors } from './support/browser-errors';
import { expect, test } from './support/fixtures';

/**
 * Sitio público, embudo RAG, SEO y contenido (wiki 16, puntos 1.9–1.14 y
 * 3.1–3.17):
 *  - páginas de cuenta y enlaces de un solo uso con noindex y canonical propio;
 *    404 con título propio, sin canonical y con un solo meta robots;
 *    /pricing con 308; sitemap según el catálogo; robots, llms.txt y cabeceras;
 *  - "Prueba con tu documento" abre la pestaña de subida; /rag/salud lleva a
 *    pedir la demo con invitación; "Cotizar este tier" llega a /contact con
 *    nombres legibles y el lead guarda el nivel, la modalidad y el plazo;
 *  - cambiar de idioma conserva la URL; el menú tiene fondo al bajar;
 *  - textos sin afirmaciones que no se pueden respaldar, en ES y EN.
 */

const isMobile = (testInfo: TestInfo) => testInfo.project.name === 'movil';

function metas(html: string) {
  return {
    title: /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? null,
    robots: [...html.matchAll(/<meta name="robots" content="([^"]*)"/g)].map((m) => m[1]),
    canonical: [...html.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map((m) => m[1]),
  };
}

/**
 * Pulsa el botón de idioma (en el celular está dentro del menú) y espera la
 * recarga. Antes espera a que la página termine de hidratarse.
 */
async function toggleLanguage(page: Page, testInfo: TestInfo, label: RegExp) {
  await page.waitForLoadState('networkidle');
  let button = page.getByRole('navigation').getByRole('button', { name: label }).first();
  if (isMobile(testInfo)) {
    await page.getByRole('button', { name: /Abrir menú|Open menu/ }).click();
    button = page.locator('#mobile-menu').getByRole('button', { name: label });
  }
  await Promise.all([page.waitForEvent('load'), button.click()]);
}

test.describe('SEO: páginas de cuenta, 404, redirecciones y archivos', () => {
  for (const { path, canonical, title } of [
    { path: '/login', canonical: '/login', title: 'Iniciar sesión | KopTup' },
    { path: '/register', canonical: '/register', title: 'Crear cuenta | KopTup' },
    { path: '/forgot-password', canonical: '/forgot-password', title: 'Recuperar contraseña | KopTup' },
    { path: '/reset-password?token=prueba-e2e', canonical: '/reset-password', title: 'Nueva contraseña | KopTup' },
    { path: '/auth/callback', canonical: '/auth/callback', title: 'Iniciando sesión | KopTup' },
  ]) {
    test(`${path}: noindex, título y canonical propios`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(200);
      expect(res.headers()['x-robots-tag']).toMatch(/noindex/);
      const m = metas(await res.text());
      expect(m.title).toBe(title);
      expect(m.robots).toEqual(['noindex, nofollow']);
      expect(m.canonical).toEqual([`${SITE_URL}${canonical}`]);
    });
  }

  test('/activar/<token>: noindex y sin canonical (no repite el token)', async ({ request }) => {
    const res = await request.get('/activar/token-de-prueba-e2e');
    const m = metas(await res.text());
    expect(m.robots).toEqual(['noindex, nofollow']);
    expect(m.canonical).toEqual([]);
    expect(m.title).toBe('Activa tu acceso | KopTup');
  });

  test('404: título propio, un solo meta robots (noindex) y sin canonical', async ({ request }) => {
    const res = await request.get('/esta-ruta-no-existe-e2e');
    expect(res.status()).toBe(404);
    const m = metas(await res.text());
    expect(m.title).toBe('Página no encontrada | KopTup');
    expect(m.robots).toEqual(['noindex']);
    expect(m.canonical).toEqual([]);
  });

  test('/pricing redirige de forma permanente (308) a los planes', async ({ request }) => {
    const res = await request.get('/pricing', { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers()['location']).toBe('/services#planes-rag');
  });

  test('sitemap: demos abiertas según el catálogo, sin las que piden acceso ni redirecciones', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).toContain(`<loc>${SITE_URL}/demo/chatbot</loc>`);
    expect(xml).toContain(`<loc>${SITE_URL}/rag/salud</loc>`);
    for (const absent of ['/demo/erp<', '/demo/cuentas-medicas<', '/pricing<', '/login<']) {
      expect(xml).not.toContain(`${SITE_URL}${absent}`);
    }
  });

  test('robots.txt, llms.txt y cabeceras de permisos', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Disallow: /propuesta/');

    const llms = await (await request.get('/llms.txt')).text();
    expect(llms).not.toMatch(/fundación|2019|GPT-4,|Claude AI|TensorFlow|tiempo real|x\.com/i);
    expect(llms).toContain('https://www.linkedin.com/company/koptup');

    const tele = await request.get('/demo/telemedicina');
    expect(tele.headers()['permissions-policy']).toContain('camera=(self)');
    expect(tele.headers()['permissions-policy']).toContain('microphone=(self)');
    const home = await request.get('/');
    expect(home.headers()['permissions-policy']).toContain('camera=()');
  });

  test('/demo/lms/verificar es pública aunque el LMS pida acceso', async ({ page }) => {
    const errors = collectBrowserErrors(page);
    const res = await page.goto('/demo/lms/verificar');
    expect(res!.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'Verificación de certificados' })).toBeVisible();
    await expect(page.getByText('Requiere acceso')).toHaveCount(0);
    // Espera a que termine la precarga de los enlaces antes de navegar otra vez
    // (si no, el navegador la corta y lo registra como error de consola).
    await page.waitForLoadState('networkidle');
    // El enlace de un certificado (lo que abre su QR) se abre sin sesión. En la
    // demo el registro vive en el navegador que lo emitió: en otro navegador la
    // página muestra los datos del enlace y dice que no puede confirmarlo.
    const d = encodeCert({ c: 'CERT-E2E-0001', n: 'Persona de Prueba', t: 'Curso de prueba', h: 12, f: '2026-10-10', o: 'Academia de ejemplo' });
    await page.goto(`/demo/lms/verificar?d=${d}`);
    await expect(page.getByText('No se puede confirmar en este navegador')).toBeVisible();
    await expect(page.getByText('CERT-E2E-0001').first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
});

test.describe('Embudo RAG', () => {
  test('"Prueba con tu documento" de /rag abre la demo en la pestaña de subida', async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await page.goto('/rag');
    const ctas = page.getByRole('link', { name: 'Prueba con tu documento' });
    await expect(ctas).toHaveCount(2);
    for (const cta of await ctas.all()) await expect(cta).toHaveAttribute('href', '/demo/chatbot?mode=upload');
    await ctas.first().click();
    await expect(page).toHaveURL(/\/demo\/chatbot\?mode=upload$/);
    await expect(page.getByRole('tab', { name: /Prueba con tu documento/ })).toHaveAttribute('aria-selected', 'true');
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });

  test('landings por sector y /chatbots-ia también llevan a la subida', async ({ page }) => {
    for (const path of ['/rag/salud', '/rag/legal', '/rag/soporte', '/chatbots-ia']) {
      await page.goto(path);
      const ctas = page.getByRole('link', { name: 'Prueba con tu documento' });
      expect(await ctas.count(), path).toBeGreaterThan(0);
      for (const cta of await ctas.all()) await expect(cta, path).toHaveAttribute('href', '/demo/chatbot?mode=upload');
    }
  });

  test('/rag/salud pide la demo del sistema experto (otro producto, con invitación) en vez de abrirla', async ({ page }) => {
    await page.goto('/rag/salud');
    const link = page.getByRole('link', { name: 'Pedir la demo del sistema experto' });
    await expect(link).toHaveAttribute('href', '/solicitar-demo?demos=cuentas-medicas');
    await expect(page.getByText('Solo por invitación').first()).toBeVisible();
    // Un solo aviso de invitación (la insignia), no tres.
    await expect(page.getByText(/con invitación/)).toHaveCount(0);
    await link.click();
    await expect(page).toHaveURL(/\/solicitar-demo\?demos=cuentas-medicas$/);
    await expect(page.getByText(/Sistema experto para salud/).first()).toBeVisible();
  });

  test('cada landing por sector muestra arriba la demo de su sector, el piloto y su precio', async ({ page }) => {
    const errors = collectBrowserErrors(page);
    const cases = [
      { path: '/rag/salud', demo: 'Probar la demo con una IPS de ejemplo', empresa: 'salud' },
      { path: '/rag/legal', demo: 'Probar la demo con una firma de ejemplo', empresa: 'legal' },
      { path: '/rag/soporte', demo: 'Probar la demo con una tienda de ejemplo', empresa: 'tienda' },
    ];
    for (const { path, demo, empresa } of cases) {
      await page.goto(path);
      const hero = page.locator('section').first();
      await expect(hero.getByRole('link', { name: demo }), path).toHaveAttribute('href', `/demo/chatbot?empresa=${empresa}`);
      await expect(hero.getByRole('link', { name: 'Cotizar el piloto' }), path).toHaveAttribute('href', '/contact?service=sistema-rag&plan=piloto');
      await expect(hero.getByText(/COP 3\.900\.000 \(USD 1\.200\), pago único, más IVA si aplica/), path).toBeVisible();
      await expect(page.getByText('Qué necesitamos de ti').or(page.getByText('Nos entregas documentos y preguntas')).first(), path).toBeVisible();
    }
    // La demo abre con la empresa del sector ya elegida.
    await page.goto('/demo/chatbot?empresa=legal');
    await expect(page.getByRole('combobox', { name: 'Empresa de ejemplo' })).toHaveValue('legal');
    await expect(page.getByText(/soy el asistente interno de Firma Ejemplo Abogados/)).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });

  test('los planes dicen el total con IVA, el primer año y qué pasa al pulsar el botón', async ({ page }) => {
    await page.goto('/services#planes-rag');
    const plans = page.locator('#planes-rag');
    await expect(plans.getByText('Con IVA del 19 %: COP 4.641.000')).toBeVisible();
    await expect(plans.getByText(/COP 27\.780\.000 más IVA \(implementación \+ 12 mensualidades\)/)).toBeVisible();
    await expect(plans.getByText('Qué necesitamos de ti')).toBeVisible();
    await expect(plans.getByText(/Todavía no pagas nada/)).toBeVisible();
    await expect(plans.getByRole('link', { name: 'Cotizar el piloto' })).toHaveAttribute('href', '/contact?service=sistema-rag&plan=piloto');
    await expect(plans.getByRole('link', { name: 'Solicitar el Esencial' })).toHaveAttribute('href', '/contact?service=sistema-rag&plan=esencial');
  });

  test('/contact con un plan RAG: encabezado del plan, precio, qué pasa después y sin presupuesto', async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await page.goto('/contact?service=sistema-rag&plan=piloto');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cotiza el plan Piloto RAG');
    await expect(page.locator('[data-quote-price]')).toHaveText('COP 3.900.000, pago único · 2 semanas · más IVA si aplica');
    await expect(page.getByText('Qué pasa después')).toBeVisible();
    await expect(page.locator('#budget')).toHaveCount(0);
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });

  test('"Cotizar este tier" llega a /contact con nombres legibles y presupuesto en COP', async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await page.goto('/contact?service=crm-ia&tier=profesional&modality=saas');
    const banner = page.getByText('Estás cotizando').locator('..');
    await expect(banner).toContainText('CRM con IA');
    await expect(banner).toContainText('Nivel Profesional · Suscripción SaaS mensual');
    await expect(page.getByText('crm ia')).toHaveCount(0);
    await expect(page.locator('#service')).toHaveValue('CRM con IA');
    await expect(page.locator('#message')).toHaveValue(/CRM con IA \(Nivel Profesional · Suscripción SaaS mensual\)/);
    const budgets = await page.locator('#budget option').allTextContents();
    expect(budgets.slice(1).every((b) => b.includes('COP'))).toBe(true);
    await expect(page.locator('label[for="budget"]')).toContainText('pesos colombianos');
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });

  test('un servicio desconocido en la URL no muestra el banner ni el identificador', async ({ page }) => {
    await page.goto('/contact?service=producto-inventado&tier=oro');
    await expect(page.getByText('Estás cotizando')).toHaveCount(0);
    await expect(page.locator('#service')).toHaveValue('');
  });

  test('el lead guarda nivel, modalidad y plazo', async ({ page }, testInfo) => {
    test.skip(!HAS_API, NEEDS_API);
    const email = uniqueEmail(`cotiza-tier-${testInfo.project.name}`);
    await page.goto('/contact?service=crm-ia&tier=avanzado&modality=compra');
    await page.fill('#name', 'Cotiza Tier');
    await page.fill('#email', email);
    await page.locator('#timeline').selectOption('3m');
    // La casilla de autorización de datos (si el formulario la tiene) se marca.
    const consent = page.locator('form input[type="checkbox"]');
    if (await consent.count()) await consent.first().check();
    const [sent] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith('/api/contact') && r.request().method() === 'POST'),
      page.getByRole('button', { name: 'Enviar mensaje' }).click(),
    ]);
    expect(sent.status()).toBe(200);
    expect(sent.request().postDataJSON()).toMatchObject({
      service: 'CRM con IA — Nivel Avanzado · Comprar el software',
      timeline: '3m',
      quote: { service: 'crm-ia', tier: 'avanzado', modality: 'compra' },
    });
    const api = await Api.open();
    try {
      const lead = (await api.contacts((await adminSession()).accessToken)).find((l) => l.email === email);
      expect(lead).toMatchObject({
        service: 'CRM con IA — Nivel Avanzado · Comprar el software',
        plazo: '3m',
        cotizacion: { servicio: 'crm-ia', nivel: 'avanzado', modalidad: 'compra' },
      });
    } finally {
      await api.dispose();
    }
  });
});

test.describe('Menú, idioma y pie', () => {
  test('cambiar de idioma conserva los parámetros de la URL', async ({ page }, testInfo) => {
    await page.goto('/contact?service=sistema-rag&plan=esencial');
    await expect(page.getByText('Estás cotizando')).toBeVisible();
    await toggleLanguage(page, testInfo, /Cambiar a inglés/);
    await expect(page.getByText('You are requesting a quote for')).toBeVisible();
    expect(new URL(page.url()).search).toBe('?service=sistema-rag&plan=esencial');
    await expect(page.locator('#service')).toHaveValue('RAG system');
    await toggleLanguage(page, testInfo, /Switch to Spanish/);
    await expect(page.getByText('Estás cotizando')).toBeVisible();
  });

  test('cambiar de idioma conserva el ancla, y el menú abre con fondo si la página ya está abajo', async ({ page }, testInfo) => {
    // #otras-soluciones queda más abajo del encabezado: la página abre desplazada.
    await page.goto('/services#otras-soluciones');
    await toggleLanguage(page, testInfo, /Cambiar a inglés/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect(new URL(page.url()).hash).toBe('#otras-soluciones');
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(20);
    await expect
      .poll(async () => page.locator('nav').first().evaluate((el) => getComputedStyle(el).backgroundColor))
      .toMatch(/rgba\(255, 255, 255, 0\.9\d*\)/);
  });

  test('al bajar, el menú tiene fondo sólido sobre los encabezados azules', async ({ page }) => {
    await page.goto('/services');
    await page.waitForLoadState('networkidle');
    await page.mouse.wheel(0, 900);
    await expect
      .poll(async () => page.locator('nav').first().evaluate((el) => getComputedStyle(el).backgroundColor))
      .toMatch(/rgba\(255, 255, 255, 0\.9\d*\)/);
  });

  test('pie: año actual, un solo LinkedIn (el mismo de /contact) y sin perfiles que no existen', async ({ page }) => {
    await page.goto('/contact');
    const year = new Date().getFullYear();
    await expect(page.locator('footer')).toContainText(`© ${year} KopTup`);
    const linkedin = await page.locator('a[href*="linkedin.com/company"]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
    expect(new Set(linkedin)).toEqual(new Set(['https://www.linkedin.com/company/koptup']));
    await expect(page.locator('a[href*="x.com/"]')).toHaveCount(0);
    // github.com/koptup no es de KopTup: no se enlaza.
    await expect(page.locator('a[href*="github.com/"]')).toHaveCount(0);
  });

  test('catálogo de /services: ningún botón dentro de un enlace', async ({ page }) => {
    await page.goto('/services#otras-soluciones');
    await expect(page.getByRole('link', { name: /Probar demo/ }).first()).toBeVisible();
    await expect(page.locator('a button, button a')).toHaveCount(0);
  });
});

test.describe('Contenido verificable', () => {
  test('/about: marca KopTup y sin años, fundación ni cifras sin respaldo', async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await page.goto('/about');
    await expect(page.locator('h1')).toHaveText('KopTup');
    const body = await page.locator('main').innerText();
    expect(body).not.toMatch(/Koptup|8\+|fundación|SoSalud|\+3x|-60%|150 herramientas|24\/7/);
    await expect(page.getByText('Lo que puedes comprobar hoy')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });

  test('/soluciones-ia redirige de forma permanente a /rag', async ({ request }) => {
    const response = await request.get('/soluciones-ia', { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers()['location']).toMatch(/\/rag$/);
  });

  test('home, Product Hunt y desarrollo web sin afirmaciones falsas', async ({ page }) => {
    for (const path of ['/', '/bienvenido-producthunt', '/desarrollo-web-colombia']) {
      await page.goto(path);
      const body = await page.locator('main').innerText();
      expect(body, path).not.toMatch(/tiempo real|100% funcional|GPT-4 y Claude|Lista para usar|Claude AI|cualquier parte del mundo/i);
    }
    // En /desarrollo-web-colombia cada botón dice a dónde lleva.
    await page.goto('/desarrollo-web-colombia');
    await expect(page.getByRole('link', { name: 'Ver planes y precios' })).toHaveAttribute('href', '/services');
    await expect(page.locator('a[href="/services#planes-rag"]', { hasText: /cotizaci/i })).toHaveCount(0);
  });

  test('en inglés: Nosotros, Product Hunt, pie y recuperación de contraseña', async ({ page, baseURL }) => {
    await page.context().addCookies([{ name: 'locale', value: 'en', url: baseURL! }]);
    await page.goto('/about');
    await expect(page.getByText('What you can check today')).toBeVisible();
    await expect(page.locator('footer')).toContainText('Custom web development');
    await expect(page.locator('footer')).toContainText('All demos');
    await page.goto('/bienvenido-producthunt');
    await expect(page.getByText('Try our demos now')).toBeVisible();
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { level: 1, name: 'Recover password' })).toBeVisible();
    await page.goto('/reset-password');
    await expect(page.getByRole('heading', { level: 1, name: 'New password' })).toBeVisible();
    await expect(page).toHaveTitle('New password | KopTup');
    await page.goto('/login');
    await expect(page.getByRole('link', { name: 'Continue as a guest and see the demos' })).toBeVisible();
    await page.goto('/register?plan=sistema-rag&tier=esencial');
    await expect(page.getByText('Your chosen plan')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Request a quote for this plan' })).toHaveAttribute('href', '/contact?service=sistema-rag&plan=esencial');
  });

  test('/register no muestra planes ni precios que no están publicados', async ({ page }) => {
    await page.goto('/register?plan=agente-ia-ventas&tier=growth');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('aside')).toHaveCount(0);
    await expect(page.getByText(/1\.290\.000|sin permanencia|empezar a usarlo en minutos/)).toHaveCount(0);
  });
});

test.describe('Títulos del panel y del portal', () => {
  test.skip(!HAS_API, NEEDS_API);

  test('el panel muestra el título de cada sección', async ({ newActor }) => {
    const admin = await newActor({ session: await adminSession(), device: 'desktop' });
    await admin.page.goto('/admin/solicitudes');
    await expect(admin.page).toHaveTitle('Solicitudes de demo · Panel | KopTup');
    await admin.page.goto('/admin/accesos');
    await expect(admin.page).toHaveTitle('Accesos a demos · Panel | KopTup');
  });
});
