import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ACCESS_MODE_TEST_DEMO, Api, HAS_API, randomPassword, uniqueEmail } from './support/backend';

/**
 * Preparación de la corrida e2e (una vez, antes de todos los workers).
 *
 * Cuenta admin de pruebas para el panel:
 *  - Si existen E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD, se usa esa cuenta (debe
 *    tener rol admin).
 *  - Si no, y existe E2E_MONGODB_URI (la base del backend que se prueba), se
 *    registra una cuenta nueva por la API con un email y una contraseña al
 *    azar de esta corrida, y se le da el rol admin con el script del backend
 *    `src/scripts/set-admin.ts` (el mismo que usa el equipo: la API no deja
 *    que nadie se asigne el rol admin).
 *  - Sin ninguna de las dos, la preparación falla con un mensaje claro: las
 *    pruebas del panel no se saltan en silencio.
 * Las credenciales pasan a los workers por process.env (así lo documenta
 * Playwright para los datos del globalSetup).
 *
 * Sin E2E_API_URL no se hace nada: las pruebas que siembran datos se omiten
 * (test.skip con el motivo) y el resto corre contra la web.
 */

const BACKEND_DIR = path.resolve(__dirname, '..', '..', 'backend');

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Las pruebas de la plataforma crean cuentas (también una admin), solicitudes,
 * accesos y leads, y cambian el catálogo de demos: nunca deben correr contra
 * el sitio o el backend de producción. Solo se aceptan una web y un backend
 * locales, salvo E2E_ALLOW_REMOTE=1 (por ejemplo, un entorno de pruebas
 * propio y desechable).
 */
function assertDisposableEnvironment(): void {
  if (process.env.E2E_ALLOW_REMOTE === '1') return;
  const targets = [
    ['E2E_BASE_URL', process.env.E2E_BASE_URL || 'http://localhost:3300'],
    ['E2E_API_URL', process.env.E2E_API_URL ?? ''],
  ];
  for (const [name, value] of targets) {
    const host = new URL(value).hostname;
    if (!LOCAL_HOSTS.has(host)) {
      throw new Error(
        `${name}=${value} no es local: con E2E_API_URL las pruebas siembran datos (cuentas, solicitudes, accesos, leads) y cambian el catálogo. Corre la suite contra una web y un backend locales, o define E2E_ALLOW_REMOTE=1 si ese entorno es desechable.`,
      );
    }
  }
}

function promoteToAdmin(email: string, mongoUri: string): void {
  const source = path.join(BACKEND_DIR, 'src', 'scripts', 'set-admin.ts');
  const compiled = path.join(BACKEND_DIR, 'dist', 'scripts', 'set-admin.js');
  // El código fuente con ts-node (siempre al día); si no existe, el compilado.
  const args = fs.existsSync(source) ? ['-r', 'ts-node/register/transpile-only', source, email] : [compiled, email];
  const result = spawnSync(process.execPath, args, {
    cwd: BACKEND_DIR,
    env: { ...process.env, MONGODB_URI: mongoUri },
    encoding: 'utf8',
    timeout: 90_000,
  });
  if (result.status !== 0) {
    throw new Error(
      `No se pudo dar el rol admin a la cuenta de pruebas con set-admin (código ${result.status}):\n${result.stdout}\n${result.stderr}`,
    );
  }
}

async function ensureAdmin(): Promise<void> {
  const api = await Api.open();
  try {
    const presetEmail = process.env.E2E_ADMIN_EMAIL;
    const presetPassword = process.env.E2E_ADMIN_PASSWORD;
    if (presetEmail && presetPassword) {
      const session = await api.login(presetEmail, presetPassword);
      if (session.user.role !== 'admin') throw new Error(`E2E_ADMIN_EMAIL (${presetEmail}) no tiene rol admin (tiene "${session.user.role}").`);
      return;
    }

    const mongoUri = process.env.E2E_MONGODB_URI;
    if (!mongoUri) {
      throw new Error(
        'Las pruebas del panel necesitan una cuenta admin: define E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD, o E2E_MONGODB_URI (la base del backend que se prueba) para crear una (ver README › Pruebas y CI).',
      );
    }
    const email = uniqueEmail('admin');
    const password = randomPassword();
    await api.register('Admin E2E', email, password);
    promoteToAdmin(email, mongoUri);
    const session = await api.login(email, password);
    if (session.user.role !== 'admin') throw new Error('set-admin terminó, pero la cuenta de pruebas no quedó con rol admin.');
    process.env.E2E_ADMIN_EMAIL = email;
    process.env.E2E_ADMIN_PASSWORD = password;
  } finally {
    await api.dispose();
  }
}

/**
 * Si una corrida anterior se interrumpió a mitad de access-mode.spec.ts, la
 * demo de esa prueba pudo quedar en "solicitud": se devuelve a su modo de la
 * semilla (abierta y activa).
 */
async function restoreAccessModeDemo(): Promise<void> {
  const api = await Api.open();
  try {
    const item = (await api.catalog()).find((c) => c.slug === ACCESS_MODE_TEST_DEMO);
    if (item && (item.accessMode !== 'publico' || !item.activo)) {
      const admin = await api.login(process.env.E2E_ADMIN_EMAIL!, process.env.E2E_ADMIN_PASSWORD!);
      await api.patchCatalog(admin.accessToken, ACCESS_MODE_TEST_DEMO, { accessMode: 'publico', activo: true });
    }
  } finally {
    await api.dispose();
  }
}

export default async function globalSetup(): Promise<void> {
  if (!HAS_API) return;
  assertDisposableEnvironment();
  await ensureAdmin();
  await restoreAccessModeDemo();
}
