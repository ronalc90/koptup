import Shell from './components/Shell';
import { lastClosedMonth } from './lib/dates';
import { DashboardProvider } from './lib/store';

/** El mes de corte depende del día de la visita: se calcula en cada petición. */
export const dynamic = 'force-dynamic';

/**
 * Demo del tablero ejecutivo: datos de ejemplo generados en el navegador (o el
 * CSV del visitante), sin backend ni IA. Todas las vistas se calculan con las
 * mismas filas, así las cifras cuadran entre Resumen, Finanzas, Clientes,
 * alertas y el informe PDF.
 *
 * El corte de los datos de ejemplo es el último mes cerrado en Colombia. Se
 * calcula aquí, en el servidor, y llega a los componentes del navegador como
 * dato: el HTML inicial y la hidratación usan el mismo mes.
 */
export default function DashboardEjecutivoPage() {
  return (
    <DashboardProvider anchor={lastClosedMonth(new Date())}>
      <Shell />
    </DashboardProvider>
  );
}
