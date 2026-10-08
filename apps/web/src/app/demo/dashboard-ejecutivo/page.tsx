'use client';

import Shell from './components/Shell';
import { DashboardProvider } from './lib/store';

/**
 * Demo del tablero ejecutivo: datos de ejemplo generados en el navegador (o el
 * CSV del visitante), sin backend ni IA. Todas las vistas se calculan con las
 * mismas filas, así las cifras cuadran entre Resumen, Finanzas, Clientes,
 * alertas y el informe PDF.
 */
export default function DashboardEjecutivoPage() {
  return (
    <DashboardProvider>
      <Shell />
    </DashboardProvider>
  );
}
