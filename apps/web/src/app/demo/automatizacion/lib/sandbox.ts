/**
 * Ejecuta el código JavaScript de un paso en un Web Worker desechable:
 * sin acceso a la página (no hay DOM), sin red (se quitan fetch,
 * XMLHttpRequest, WebSocket, importScripts y similares) y con un tiempo
 * máximo. El código recibe `datos` (copia de los datos del flujo) y lo que
 * devuelva con `return` pasa al siguiente paso.
 */
import type { Data, JsResult, JsRunner } from './engine';

export const JS_TIMEOUT_MS = 1500;

const WORKER_SRC = `
const BLOCK = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'Worker', 'SharedWorker',
  'BroadcastChannel', 'indexedDB', 'caches', 'WebTransport', 'RTCPeerConnection'];
for (const name of BLOCK) {
  let obj = self;
  while (obj) {
    try { if (Object.prototype.hasOwnProperty.call(obj, name)) delete obj[name]; } catch (e) {}
    obj = Object.getPrototypeOf(obj);
  }
  try { Object.defineProperty(self, name, { value: undefined, configurable: false, writable: false }); } catch (e) {}
}
const send = self.postMessage.bind(self);
const NOT_CLONEABLE = '§jsErrors.notCloneable';
self.onmessage = (event) => {
  const finish = (msg) => { try { send(msg); } catch (e) { send({ ok: false, error: '§jsErrors.notCloneable' }); } };
  try {
    const fn = new Function('datos', '"use strict";\\n' + event.data.code);
    Promise.resolve(fn(event.data.data)).then(
      (value) => {
        let copy = null;
        try { copy = value === undefined ? null : JSON.parse(JSON.stringify(value)); } catch (e) { finish({ ok: false, error: '§jsErrors.notCloneable' }); return; }
        finish({ ok: true, value: copy });
      },
      (err) => finish({ ok: false, error: String((err && err.message) || err) }),
    );
  } catch (err) {
    finish({ ok: false, error: String((err && err.message) || err) });
  }
};
`;

let workerUrl: string | null = null;

function getWorkerUrl(): string {
  if (!workerUrl) workerUrl = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
  return workerUrl;
}

/** Corredor del navegador (Worker). Si no hay Worker disponible, lo dice. */
export const runInWorker: JsRunner = (code: string, data: Data) =>
  new Promise<JsResult>((resolve) => {
    if (typeof Worker === 'undefined') {
      resolve({ ok: false, error: '§jsErrors.noWorker' });
      return;
    }
    let done = false;
    const worker = new Worker(getWorkerUrl());
    const end = (res: JsResult) => {
      if (done) return;
      done = true;
      worker.terminate();
      resolve(res);
    };
    const timer = window.setTimeout(() => end({ ok: false, error: `${JS_TIMEOUT_MS} ms`, timeout: true }), JS_TIMEOUT_MS);
    worker.onmessage = (e: MessageEvent<JsResult>) => {
      window.clearTimeout(timer);
      end(e.data && typeof e.data === 'object' && 'ok' in e.data ? e.data : { ok: false, error: '§jsErrors.invalid' });
    };
    worker.onerror = (e) => {
      window.clearTimeout(timer);
      e.preventDefault();
      end({ ok: false, error: e.message || '§jsErrors.invalid' });
    };
    worker.postMessage({ code, data: JSON.parse(JSON.stringify(data)) });
  });
