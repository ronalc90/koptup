/**
 * Avisos de la demo abajo y al centro: el Toaster global está arriba a la
 * derecha y taparía el botón «Actualizar ahora» del encabezado.
 */
import toast from 'react-hot-toast';

const opts = { position: 'bottom-center' as const, duration: 3500 };

export const notify = {
  success: (msg: string) => toast.success(msg, opts),
  error: (msg: string) => toast.error(msg, opts),
  info: (msg: string) => toast(msg, opts),
};
