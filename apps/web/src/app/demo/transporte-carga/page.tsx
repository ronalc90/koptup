'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  ArrowLeftIcon,
  TruckIcon,
  HomeIcon,
  UserGroupIcon,
  IdentificationIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ReceiptPercentIcon,
  PresentationChartLineIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import Dashboard from './components/Dashboard';

// Importes dinámicos para reducir tamaño del bundle inicial
const TabClientes = dynamic(() => import('./components/TabClientes'), { ssr: false });
const TabConductores = dynamic(() => import('./components/TabConductores'), { ssr: false });
const TabVehiculos = dynamic(() => import('./components/TabVehiculos'), { ssr: false });
const TabOrdenes = dynamic(() => import('./components/TabOrdenes'), { ssr: false });
const TabGuias = dynamic(() => import('./components/TabGuias'), { ssr: false });
const TabFacturas = dynamic(() => import('./components/TabFacturas'), { ssr: false });
const TabReportes = dynamic(() => import('./components/TabReportes'), { ssr: false });

export type SeccionId =
  | 'dashboard'
  | 'clientes'
  | 'conductores'
  | 'vehiculos'
  | 'ordenes'
  | 'guias'
  | 'facturas'
  | 'reportes';

interface SeccionConfig {
  id: SeccionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SECCIONES: SeccionConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
  { id: 'clientes', label: 'Clientes', icon: UserGroupIcon },
  { id: 'conductores', label: 'Conductores', icon: IdentificationIcon },
  { id: 'vehiculos', label: 'Vehículos', icon: TruckIcon },
  { id: 'ordenes', label: 'Órdenes', icon: ClipboardDocumentListIcon },
  { id: 'guias', label: 'Guías', icon: DocumentTextIcon },
  { id: 'facturas', label: 'Facturación', icon: ReceiptPercentIcon },
  { id: 'reportes', label: 'Reportes', icon: PresentationChartLineIcon },
];

export default function TransporteCargaPage() {
  const [seccion, setSeccion] = useState<SeccionId>('dashboard');

  const renderContent = () => {
    switch (seccion) {
      case 'dashboard':
        return <Dashboard onNavigate={setSeccion} />;
      case 'clientes':
        return <TabClientes />;
      case 'conductores':
        return <TabConductores />;
      case 'vehiculos':
        return <TabVehiculos />;
      case 'ordenes':
        return <TabOrdenes />;
      case 'guias':
        return <TabGuias />;
      case 'facturas':
        return <TabFacturas />;
      case 'reportes':
        return <TabReportes />;
      default:
        return <Dashboard onNavigate={setSeccion} />;
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      {/* Hero header de la demo */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-600 via-orange-700 to-orange-900 text-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Volver a demos
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Badge variant="outline" className="border-white/30 text-white mb-3">
                <SparklesIcon className="h-3 w-3 mr-1" />
                Demo SUNAT · Perú
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-2">
                Transporte de Carga
              </h1>
              <p className="text-base md:text-lg text-orange-100 max-w-2xl">
                Sistema integral con clientes, conductores, vehículos, órdenes, guía de remisión
                electrónica (GRE), facturación SUNAT UBL 2.1 y detracciones del SPOT.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
              <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                <TruckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-orange-100">Empresa demo</p>
                <p className="text-sm font-semibold">TRANSPORTES DEMO S.A.C.</p>
                <p className="text-xs text-orange-200">RUC 20505000999</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs horizontales sticky */}
      <div className="sticky top-0 z-20 bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto -mb-px" aria-label="Secciones">
            {SECCIONES.map((sec) => {
              const Icon = sec.icon;
              const isActive = seccion === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setSeccion(sec.id)}
                  className={[
                    'inline-flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap',
                    'border-b-2 transition-colors',
                    isActive
                      ? 'border-primary-600 text-primary-700 dark:text-primary-300'
                      : 'border-transparent text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-200 hover:border-secondary-300',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4" />
                  {sec.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      {/* Toast Notifications */}
      <Toaster position="top-right" />
    </div>
  );
}
