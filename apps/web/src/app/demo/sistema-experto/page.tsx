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
  const [rules, setRules] = useState([
    { id: 101, name: 'Falta Autorización', enabled: true, severity: 'alta' },
    { id: 102, name: 'Diferencia de Tarifa', enabled: true, severity: 'media' },
    { id: 201, name: 'CUPS Inválido', enabled: true, severity: 'alta' },
    { id: 202, name: 'Autorización Incompleta', enabled: true, severity: 'media' },
    { id: 301, name: 'Incoherencia Clínica', enabled: true, severity: 'alta' },
    { id: 303, name: 'Duplicidad de Servicios', enabled: true, severity: 'alta' },
    { id: 401, name: 'Valor Superior al Contratado', enabled: true, severity: 'media' },
    { id: 402, name: 'Cantidad Excede Autorizado', enabled: true, severity: 'media' },
  ]);

  const [config, setConfig] = useState({
    tolerancia: 5,
    manual: 'ISS 2004',
    validacionClinica: true,
    cacheCUPS: true,
  });

  const [saved, setSaved] = useState(false);

  const toggleRule = (id: number) => {
    setRules(rules.map(rule =>
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Configuración del Motor de Reglas</CardTitle>
            <button
              onClick={handleSave}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              {saved ? '✓ Guardado' : 'Guardar Cambios'}
            </button>
          </div>
        </CardHeader>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reglas de Auditoría */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
                Reglas de Auditoría
              </h3>
              <div className="space-y-2">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={`w-12 h-6 rounded-full transition-all ${
                          rule.enabled
                            ? 'bg-green-600'
                            : 'bg-secondary-300 dark:bg-secondary-600'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                            rule.enabled ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                      <div>
                        <p className="font-medium text-secondary-900 dark:text-white">
                          {rule.id} - {rule.name}
                        </p>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400">
                          Severidad:{' '}
                          <span
                            className={
                              rule.severity === 'alta'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-yellow-600 dark:text-yellow-400'
                            }
                          >
                            {rule.severity}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        rule.enabled ? 'bg-green-500' : 'bg-secondary-400'
                      }`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>
                    {rules.filter((r) => r.enabled).length} de {rules.length}
                  </strong>{' '}
                  reglas activas
                </p>
              </div>
            </div>

            {/* Configuración General */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
                Configuración General
              </h3>

              <div className="space-y-4">
                {/* Tolerancia */}
                <div className="p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                  <label className="block text-sm font-medium text-secondary-900 dark:text-white mb-2">
                    Tolerancia de Diferencia de Tarifa
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={config.tolerancia}
                      onChange={(e) =>
                        setConfig({ ...config, tolerancia: parseInt(e.target.value) })
                      }
                      className="flex-1"
                    />
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400 min-w-[4rem] text-right">
                      {config.tolerancia}%
                    </span>
                  </div>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-2">
                    Diferencias menores a este porcentaje no generarán glosa
                  </p>
                </div>

                {/* Manual Tarifario */}
                <div className="p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                  <label className="block text-sm font-medium text-secondary-900 dark:text-white mb-2">
                    Manual Tarifario Predeterminado
                  </label>
                  <select
                    value={config.manual}
                    onChange={(e) => setConfig({ ...config, manual: e.target.value })}
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white"
                  >
                    <option value="ISS 2001">ISS 2001</option>
                    <option value="ISS 2004">ISS 2004</option>
                    <option value="SOAT">SOAT</option>
                    <option value="Particular">Particular</option>
                  </select>
                </div>

                {/* Validación Clínica */}
                <div className="p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-secondary-900 dark:text-white">
                        Validación Clínica con IA
                      </p>
                      <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                        Analiza coherencia entre diagnóstico y procedimientos
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setConfig({ ...config, validacionClinica: !config.validacionClinica })
                      }
                      className={`w-12 h-6 rounded-full transition-all ${
                        config.validacionClinica
                          ? 'bg-green-600'
                          : 'bg-secondary-300 dark:bg-secondary-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                          config.validacionClinica ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Cache CUPS */}
                <div className="p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-secondary-900 dark:text-white">
                        Cache de CUPS
                      </p>
                      <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                        Mejora rendimiento almacenando códigos consultados
                      </p>
                    </div>
                    <button
                      onClick={() => setConfig({ ...config, cacheCUPS: !config.cacheCUPS })}
                      className={`w-12 h-6 rounded-full transition-all ${
                        config.cacheCUPS
                          ? 'bg-green-600'
                          : 'bg-secondary-300 dark:bg-secondary-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                          config.cacheCUPS ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Resumen */}
              <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                <h4 className="font-semibold text-primary-900 dark:text-primary-100 mb-3">
                  Resumen de Configuración
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-secondary-600 dark:text-secondary-400">
                      Reglas activas:
                    </span>
                    <p className="font-semibold text-secondary-900 dark:text-white">
                      {rules.filter((r) => r.enabled).length}/{rules.length}
                    </p>
                  </div>
                  <div>
                    <span className="text-secondary-600 dark:text-secondary-400">
                      Tolerancia:
                    </span>
                    <p className="font-semibold text-secondary-900 dark:text-white">
                      {config.tolerancia}%
                    </p>
                  </div>
                  <div>
                    <span className="text-secondary-600 dark:text-secondary-400">Manual:</span>
                    <p className="font-semibold text-secondary-900 dark:text-white">
                      {config.manual}
                    </p>
                  </div>
                  <div>
                    <span className="text-secondary-600 dark:text-secondary-400">IA:</span>
                    <p
                      className={`font-semibold ${
                        config.validacionClinica
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-secondary-400'
                      }`}
                    >
                      {config.validacionClinica ? 'Activa' : 'Inactiva'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
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
