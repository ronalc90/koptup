/**
 * Archivos que adjuntas en la demo: se guardan en el navegador (IndexedDB) para
 * que sigan ahí al recargar, igual que el resto de los cambios. Nunca salen del
 * navegador. Si IndexedDB no está disponible (modo privado, bloqueado), el
 * archivo queda solo en la memoria de la pestaña y se avisa.
 */

const DB_NAME = 'koptup-gestion-proyectos';
const STORE = 'adjuntos';

/** Archivos disponibles en esta pestaña (cargados de IndexedDB o recién subidos). */
export const uploadedFiles = new Map<string, File>();

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('sin IndexedDB'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return open().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => {
          db.close();
          resolve(req ? req.result : undefined);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
        tx.onabort = () => {
          db.close();
          reject(tx.error);
        };
      }),
  );
}

/** Guarda un adjunto. Devuelve false si no se pudo guardar (queda solo en esta pestaña). */
export async function saveFile(id: string, file: File): Promise<boolean> {
  uploadedFiles.set(id, file);
  try {
    await run('readwrite', (s) => s.put(file, id));
    return true;
  } catch {
    return false;
  }
}

export async function removeFile(id: string): Promise<void> {
  uploadedFiles.delete(id);
  try {
    await run('readwrite', (s) => s.delete(id));
  } catch {
    /* nada que borrar */
  }
}

/**
 * Carga los adjuntos guardados en `uploadedFiles` y borra los que ya no usa
 * ninguna tarea (`keep` = ids referenciados por el estado).
 */
export async function loadFiles(keep: Set<string>): Promise<void> {
  try {
    const keys = ((await run('readonly', (s) => s.getAllKeys())) ?? []).map(String);
    for (const key of keys) {
      if (!keep.has(key)) {
        await run('readwrite', (s) => s.delete(key));
        continue;
      }
      const file = await run<File>('readonly', (s) => s.get(key));
      if (file) uploadedFiles.set(key, file);
    }
  } catch {
    /* sin IndexedDB: solo quedan los archivos de esta pestaña */
  }
}

export async function clearFiles(): Promise<void> {
  uploadedFiles.clear();
  try {
    await run('readwrite', (s) => s.clear());
  } catch {
    /* nada que borrar */
  }
}
