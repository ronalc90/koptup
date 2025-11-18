'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import DashboardAuditoria from '@/components/DashboardAuditoria';
import BusquedaSemanticaCUPS from '@/components/BusquedaSemanticaCUPS';

type TabType = 'dashboard' | 'busqueda' | 'configuracion' | 'documentacion';

export default function SistemaExpertoPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const tabs = [
    {
      id: 'dashboard' as TabType,
      name: 'Dashboard',
      icon: ChartBarIcon,
      description: 'Estadísticas y métricas',
    },
    {
      id: 'busqueda' as TabType,
      name: 'Búsqueda Semántica',
      icon: MagnifyingGlassIcon,
      description: 'Buscar CUPS con IA',
    },
    {
      id: 'configuracion' as TabType,
      name: 'Configuración',
      icon: Cog6ToothIcon,
      description: 'Motor de reglas',
    },
    {
      id: 'documentacion' as TabType,
      name: 'Documentación',
      icon: DocumentTextIcon,
      description: 'Guías y API',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50 dark:from-secondary-900 dark:via-secondary-800 dark:to-secondary-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/demo/cuentas-medicas">
            <Button variant="ghost" className="mb-4">
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Volver a Cuentas Médicas
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-2">
                Sistema Experto de Auditoría
              </h1>
              <p className="text-lg text-secondary-600 dark:text-secondary-400">
                Procesamiento inteligente de cuentas médicas con IA
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                ● Sistema Activo
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-3 border-b-2 transition-all
                  ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-transparent text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white hover:border-secondary-300 dark:hover:border-secondary-600'
                  }
                `}
              >
                <tab.icon className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">{tab.name}</div>
                  <div className="text-xs opacity-75">{tab.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mt-6">
          {activeTab === 'dashboard' && <DashboardAuditoria />}

          {activeTab === 'busqueda' && <BusquedaSemanticaCUPS />}

          {activeTab === 'configuracion' && <ConfiguracionMotorReglas />}

          {activeTab === 'documentacion' && <DocumentacionAPI />}
        </div>
      </div>
    </div>
  );
}

// Componente de Configuración del Motor de Reglas
function ConfiguracionMotorReglas() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración del Motor de Reglas</CardTitle>
      </CardHeader>
      <div className="p-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            🔧 Funcionalidad en Desarrollo
          </h3>
          <p className="text-blue-700 dark:text-blue-300 mb-4">
            La configuración del motor de reglas estará disponible próximamente.
          </p>
          <div className="space-y-2 text-sm text-blue-600 dark:text-blue-400">
            <p>• Habilitar/deshabilitar reglas específicas</p>
            <p>• Ajustar tolerancia de diferencia de tarifa</p>
            <p>• Configurar manuales tarifarios</p>
            <p>• Personalizar validaciones clínicas</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg">
            <h4 className="font-medium text-secondary-900 dark:text-white mb-2">
              Reglas Actuales
            </h4>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
              8 reglas automáticas activas
            </p>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>101 - Falta autorización</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>102 - Diferencia de tarifa</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>201 - CUPS inválido</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>301 - Incoherencia clínica</span>
              </li>
            </ul>
          </div>

          <div className="p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg">
            <h4 className="font-medium text-secondary-900 dark:text-white mb-2">
              Configuración Actual
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-600 dark:text-secondary-400">
                  Tolerancia Tarifa:
                </span>
                <span className="font-medium">5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600 dark:text-secondary-400">Manual Defecto:</span>
                <span className="font-medium">ISS 2004</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600 dark:text-secondary-400">
                  Validación Clínica:
                </span>
                <span className="font-medium text-green-600">Activa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600 dark:text-secondary-400">Cache CUPS:</span>
                <span className="font-medium text-green-600">Habilitado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Componente de Documentación
function DocumentacionAPI() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Documentación de la API</CardTitle>
        </CardHeader>
        <div className="p-6">
          <div className="prose dark:prose-invert max-w-none">
            <h3>APIs Disponibles</h3>

            <h4 className="text-primary-600 dark:text-primary-400">1. Sistema Experto</h4>
            <div className="bg-secondary-50 dark:bg-secondary-900 p-4 rounded-lg mb-4">
              <code className="text-sm">POST /api/expert/procesar-y-descargar</code>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-2">
                Procesa una cuenta médica y descarga el Excel con 5 hojas.
              </p>
            </div>

            <h4 className="text-primary-600 dark:text-primary-400">2. Búsqueda Semántica</h4>
            <div className="bg-secondary-50 dark:bg-secondary-900 p-4 rounded-lg mb-4">
              <code className="text-sm">POST /api/cups/buscar-semantica</code>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-2">
                Busca CUPS usando lenguaje natural con IA.
              </p>
            </div>

            <h4 className="text-primary-600 dark:text-primary-400">3. Estadísticas</h4>
            <div className="bg-secondary-50 dark:bg-secondary-900 p-4 rounded-lg mb-4">
              <code className="text-sm">GET /api/expert/estadisticas</code>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-2">
                Obtiene estadísticas del sistema experto.
              </p>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                📚 <strong>Documentación Completa:</strong> Consulta los archivos
                SISTEMA_EXPERTO_README.md y SISTEMA_EXPERTO_API.md en la raíz del proyecto
                para ver la documentación completa con todos los endpoints y ejemplos.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
