/**
 * Configuración común de las pruebas de Jest de la web (jsdom).
 *
 * - Matchers de @testing-library/jest-dom (toBeInTheDocument, etc.).
 * - Simulaciones de APIs del navegador que jsdom no implementa.
 * - Simulación de next/navigation (useRouter, usePathname, ...).
 * - fetch que falla: ninguna prueba debe salir a la red.
 */
import '@testing-library/jest-dom';
import { act } from 'react';
import { TextDecoder, TextEncoder } from 'node:util';

// La URL del backend sale de NEXT_PUBLIC_API_URL y, si no existe, apunta a
// producción (src/lib/backend-url.ts). En pruebas se fija a un dominio que
// nunca resuelve (.invalid), además del bloqueo de red de más abajo.
process.env.NEXT_PUBLIC_API_URL = 'http://backend.invalid';

// ---------------------------------------------------------------------------
// next/navigation: los componentes cliente usan el App Router, que no existe
// fuera de Next. Cada prueba puede leer o cambiar estos mocks con
// jest.requireMock('next/navigation').
// ---------------------------------------------------------------------------
jest.mock('next/navigation', () => {
  const router = {
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(() => Promise.resolve()),
  };
  return {
    __esModule: true,
    useRouter: () => router,
    usePathname: jest.fn(() => '/'),
    useSearchParams: jest.fn(() => new URLSearchParams()),
    useParams: jest.fn(() => ({})),
    useSelectedLayoutSegment: jest.fn(() => null),
    useSelectedLayoutSegments: jest.fn(() => []),
    redirect: jest.fn(),
    permanentRedirect: jest.fn(),
    notFound: jest.fn(),
  };
});

// ---------------------------------------------------------------------------
// APIs del navegador que jsdom no trae. Las pruebas con
// `@jest-environment node` (p. ej. el middleware de Next) no tienen DOM:
// ahí se omiten.
// ---------------------------------------------------------------------------
const IS_DOM = typeof window !== 'undefined';

class MockObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

if (IS_DOM) Object.defineProperty(window, 'ResizeObserver', { writable: true, configurable: true, value: MockObserver });
if (IS_DOM) Object.defineProperty(window, 'IntersectionObserver', { writable: true, configurable: true, value: MockObserver });
if (IS_DOM) Object.defineProperty(window, 'MutationObserver', {
  writable: true,
  configurable: true,
  value: window.MutationObserver ?? MockObserver,
});

if (IS_DOM) Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(() => false),
  }),
});

if (IS_DOM) Object.defineProperty(window, 'scrollTo', { writable: true, configurable: true, value: jest.fn() });
if (IS_DOM) Element.prototype.scrollIntoView = jest.fn();
if (IS_DOM) Element.prototype.scrollTo = jest.fn() as unknown as Element['scrollTo'];

// Canvas: las gráficas dibujan en <canvas>; jsdom no tiene contexto 2D.
if (IS_DOM) HTMLCanvasElement.prototype.getContext = jest.fn(() => null) as unknown as HTMLCanvasElement['getContext'];
if (IS_DOM) HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,');

// Audio y video: jsdom no reproduce medios.
if (IS_DOM) Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: jest.fn(() => Promise.resolve()),
});
if (IS_DOM) Object.defineProperty(HTMLMediaElement.prototype, 'pause', { configurable: true, value: jest.fn() });
if (IS_DOM) Object.defineProperty(HTMLMediaElement.prototype, 'load', { configurable: true, value: jest.fn() });

// TextEncoder/TextDecoder existen en todos los navegadores, pero no en el
// entorno jsdom de Jest (los usa, por ejemplo, jspdf).
if (typeof globalThis.TextEncoder === 'undefined') {
  Object.assign(globalThis, { TextEncoder, TextDecoder });
}

// URL de objetos (descargas y vistas previas de archivos).
if (!URL.createObjectURL) {
  URL.createObjectURL = jest.fn(() => 'blob:mock');
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = jest.fn();
}

// ---------------------------------------------------------------------------
// Red: una prueba unitaria nunca llama a servicios reales (y nunca al backend
// de producción, que es la URL por defecto de src/lib/backend-url.ts). Si un
// componente pide datos al montar, recibe un error de red (igual que sin
// conexión) y debe mostrar su estado de error en lugar de romperse.
// Se bloquean fetch, XMLHttpRequest (lo usa axios), WebSocket y sendBeacon.
// Los errores llegan en una tarea aparte (setTimeout), como una respuesta de
// red real, para que el afterEach de abajo los procese dentro de act().
// ---------------------------------------------------------------------------
const networkError = (target: unknown) => new TypeError(`Red deshabilitada en pruebas unitarias: ${String(target)}`);

const blockedFetch = jest.fn(
  (input: unknown) =>
    new Promise<Response>((_resolve, reject) => {
      setTimeout(() => reject(networkError(input)), 0);
    }),
);
Object.defineProperty(globalThis, 'fetch', { writable: true, configurable: true, value: blockedFetch });

type Listener = (event: Event) => void;

/** Emisor mínimo de eventos con los manejadores on<evento> del DOM. */
class BlockedEventTarget {
  private listeners: Record<string, Listener[]> = {};
  [handler: `on${string}`]: unknown;

  addEventListener(type: string, listener: Listener) {
    (this.listeners[type] ??= []).push(listener);
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners[type] = (this.listeners[type] ?? []).filter((l) => l !== listener);
  }

  protected emit(type: string, event: Event = new Event(type)) {
    const handler = this[`on${type}`];
    if (typeof handler === 'function') handler.call(this, event);
    for (const listener of this.listeners[type] ?? []) listener.call(this, event);
  }
}

/** XMLHttpRequest que nunca sale a la red: cada envío termina en error. */
class BlockedXMLHttpRequest extends BlockedEventTarget {
  static readonly UNSENT = 0;
  static readonly OPENED = 1;
  static readonly HEADERS_RECEIVED = 2;
  static readonly LOADING = 3;
  static readonly DONE = 4;
  readyState = 0;
  status = 0;
  statusText = '';
  response: unknown = null;
  responseText = '';
  responseType = '';
  responseURL = '';
  timeout = 0;
  withCredentials = false;
  upload = new BlockedEventTarget();
  onreadystatechange: unknown = null;
  onloadend: unknown = null;
  onerror: unknown = null;
  onabort: unknown = null;
  ontimeout: unknown = null;
  private url = '';

  open(_method: string, url: string) {
    this.url = String(url);
    this.readyState = 1;
  }

  setRequestHeader() {}

  overrideMimeType() {}

  getAllResponseHeaders() {
    return '';
  }

  getResponseHeader() {
    return null;
  }

  abort() {}

  send() {
    setTimeout(() => {
      this.readyState = 4;
      const error = Object.assign(new Event('error'), { message: networkError(this.url).message });
      this.emit('error', error);
      this.emit('readystatechange');
      this.emit('loadend');
    }, 0);
  }
}
if (IS_DOM) Object.defineProperty(window, 'XMLHttpRequest', { writable: true, configurable: true, value: BlockedXMLHttpRequest });

/** WebSocket que nunca conecta: emite error y cierre. */
class BlockedWebSocket extends BlockedEventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  readyState = 0;
  url: string;
  onopen: unknown = null;
  onmessage: unknown = null;
  onerror: unknown = null;
  onclose: unknown = null;

  constructor(url: string | URL) {
    super();
    this.url = String(url);
    setTimeout(() => {
      this.readyState = 3;
      this.emit('error');
      this.emit('close');
    }, 0);
  }

  send() {}

  close() {
    this.readyState = 3;
  }
}
if (IS_DOM) Object.defineProperty(window, 'WebSocket', { writable: true, configurable: true, value: BlockedWebSocket });

if (IS_DOM) Object.defineProperty(navigator, 'sendBeacon', { writable: true, configurable: true, value: jest.fn(() => false) });

// Antes del desmontaje automático de Testing Library: deja que terminen los
// efectos asíncronos pendientes (por ejemplo, el manejo del fetch rechazado)
// dentro de act(), para que React aplique sus cambios de estado sin avisos.
afterEach(async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});
