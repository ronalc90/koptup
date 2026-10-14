/**
 * Avisos de la demo abajo y al centro: el Toaster global está arriba a la
 * derecha y taparía el botón «Actualizar ahora» del encabezado. Los avisos no
 * reciben clics (no tapan botones de debajo) y se cierran al abrir una ventana.
 * Con `id`, el mismo aviso no se repite (p. ej. si un efecto corre dos veces en desarrollo).
 */
import toast from 'react-hot-toast';

const opts = { position: 'bottom-center' as const, duration: 3500, style: { pointerEvents: 'none' as const } };

/** Cierra los avisos visibles (lo usa la ventana modal al abrirse). */
export function dismissNotices() {
  toast.dismiss();
}

export const notify = {
  success: (msg: string, id?: string) => toast.success(msg, { ...opts, id }),
  error: (msg: string, id?: string) => toast.error(msg, { ...opts, id }),
  info: (msg: string, id?: string) => toast(msg, { ...opts, id, duration: 6000 }),
};
