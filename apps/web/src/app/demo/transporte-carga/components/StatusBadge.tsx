'use client';

interface StatusBadgeProps {
  estado: string;
  variant?: 'default' | 'compact';
}

const statusMap: Record<string, { label: string; class: string }> = {
  borrador: { label: 'Borrador', class: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200' },
  confirmada: { label: 'Confirmada', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  en_ruta: { label: 'En Ruta', class: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  entregada: { label: 'Entregada', class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  facturada: { label: 'Facturada', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  emitida: { label: 'Emitida', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  aceptada: { label: 'Aceptada', class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  rechazada: { label: 'Rechazada', class: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  anulada: { label: 'Anulada', class: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200' },
  cancelada: { label: 'Cancelada', class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  activo: { label: 'Activo', class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  inactivo: { label: 'Inactivo', class: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200' },
};

export function StatusBadge({ estado, variant = 'default' }: StatusBadgeProps) {
  const status = statusMap[estado] || { label: estado, class: 'bg-slate-100 text-slate-800' };

  const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const sizeClass = variant === 'compact' ? '' : '';

  return <span className={`${baseClass} ${sizeClass} ${status.class}`}>{status.label}</span>;
}
