'use client';

/**
 * Demo: gestor documental con IA.
 * - Datos de ejemplo (sin sesión ni llamadas al servidor): archivo de una
 *   constructora ficticia para organizar, buscar en el contenido, detectar
 *   cláusulas, comparar versiones, leer una factura escaneada, aplicar
 *   retención y exportar.
 * - Mis documentos (con sesión): subida real, resumen y búsqueda por
 *   significado con IA en el servidor (/api/documents).
 */
import Header from './parts/Header';
import Workspace from './parts/Workspace';
import { Toasts } from './parts/ui';
import { DocsProvider } from './lib/store';

export default function GestorDocumentosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-white">
      <DocsProvider>
        <Header />
        <Workspace />
        <Toasts />
      </DocsProvider>
    </div>
  );
}
