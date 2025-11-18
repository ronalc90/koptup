'use client';

import { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  ChartBarIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  CpuChipIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface EstadisticasExperto {
  totalCuentas: number;
  cuentasProcesadas: number;
  porcentajeProcesado: number;
}

interface EstadisticasCUPS {
  totalCUPS: number;
  cupsActivos: number;
  cupsInactivos: number;
  cupsPorCategoria: Record<string, number>;
  cupsConTarifaISS2004: number;
}

interface EstadisticasVectorizacion {
  totalCUPS: number;
  cupsVectorizados: number;
  cupsPendientes: number;
  porcentajeVectorizado: number;
}

export default function DashboardAuditoria() {
  const [estadisticasExperto, setEstadisticasExperto] = useState<EstadisticasExperto | null>(null);
  const [estadisticasCUPS, setEstadisticasCUPS] = useState<EstadisticasCUPS | null>(null);
  const [estadisticasVector, setEstadisticasVector] = useState<EstadisticasVectorizacion | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    setLoading(true);
    try {
      // Cargar estadísticas del sistema experto
      const resExperto = await fetch(`${API_BASE_URL}/expert/estadisticas`);
      const dataExperto = await resExperto.json();
      if (dataExperto.success) {
        setEstadisticasExperto(dataExperto.data);
      }

      // Cargar estadísticas de CUPS
      const resCUPS = await fetch(`${API_BASE_URL}/cups/estadisticas`);
      const dataCUPS = await resCUPS.json();
      if (dataCUPS.success) {
        setEstadisticasCUPS(dataCUPS.data);
      }

      // Cargar estadísticas de vectorización
      const resVector = await fetch(`${API_BASE_URL}/cups/estadisticas-vectorizacion`);
      const dataVector = await resVector.json();
      if (dataVector.success) {
        setEstadisticasVector(dataVector.data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Dashboard de Auditoría
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Estadísticas en tiempo real del Sistema Experto
          </p>
        </div>
        <button
          onClick={cargarEstadisticas}
          className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
          title="Actualizar estadísticas"
        >
          <ClockIcon className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
        </button>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de cuentas */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                  Total Cuentas
                </p>
                <p className="text-3xl font-bold text-secondary-900 dark:text-white mt-2">
                  {estadisticasExperto?.totalCuentas || 0}
                </p>
              </div>
              <DocumentCheckIcon className="h-12 w-12 text-primary-500" />
            </div>
          </CardContent>
        </Card>

        {/* Cuentas procesadas */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                  Procesadas
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {estadisticasExperto?.cuentasProcesadas || 0}
                </p>
                <p className="text-xs text-secondary-500 mt-1">
                  {estadisticasExperto?.porcentajeProcesado.toFixed(1)}% del total
                </p>
              </div>
              <CheckCircleIcon className="h-12 w-12 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Total CUPS */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                  Catálogo CUPS
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                  {estadisticasCUPS?.totalCUPS.toLocaleString() || 0}
                </p>
                <p className="text-xs text-secondary-500 mt-1">códigos disponibles</p>
              </div>
              <ChartBarIcon className="h-12 w-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Vectorización */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                  Vectorizados
                </p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                  {estadisticasVector?.porcentajeVectorizado.toFixed(0)}%
                </p>
                <p className="text-xs text-secondary-500 mt-1">
                  {estadisticasVector?.cupsVectorizados.toLocaleString()} de{' '}
                  {estadisticasVector?.totalCUPS.toLocaleString()}
                </p>
              </div>
              <SparklesIcon className="h-12 w-12 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos y detalles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CUPS por categoría */}
        <Card>
          <CardHeader>
            <CardTitle>CUPS por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {estadisticasCUPS &&
                Object.entries(estadisticasCUPS.cupsPorCategoria)
                  .sort((a, b) => b[1] - a[1])
                  .map(([categoria, cantidad]) => {
                    const porcentaje = (cantidad / estadisticasCUPS.totalCUPS) * 100;
                    return (
                      <div key={categoria}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                            {categoria}
                          </span>
                          <span className="text-sm text-secondary-600 dark:text-secondary-400">
                            {cantidad.toLocaleString()} ({porcentaje.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${porcentaje}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </CardContent>
        </Card>

        {/* Estado del sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Motor de reglas */}
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <CpuChipIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Motor de Reglas
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      8 reglas activas
                    </p>
                  </div>
                </div>
                <Badge variant="success">Activo</Badge>
              </div>

              {/* Búsqueda semántica */}
              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3">
                  <SparklesIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="font-medium text-purple-900 dark:text-purple-100">
                      Búsqueda Semántica
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      {estadisticasVector?.cupsVectorizados.toLocaleString()} CUPS vectorizados
                    </p>
                  </div>
                </div>
                <Badge variant="warning">
                  {estadisticasVector?.porcentajeVectorizado.toFixed(0)}%
                </Badge>
              </div>

              {/* Catálogo CUPS */}
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <ChartBarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">Catálogo CUPS</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {estadisticasCUPS?.totalCUPS.toLocaleString()} procedimientos
                    </p>
                  </div>
                </div>
                <Badge variant="primary">Actualizado</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalles adicionales */}
      <Card>
        <CardHeader>
          <CardTitle>Información Adicional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                CUPS con Tarifas ISS 2004
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                {estadisticasCUPS?.cupsConTarifaISS2004.toLocaleString()}
              </p>
              <p className="text-xs text-secondary-500 mt-1">
                {((estadisticasCUPS?.cupsConTarifaISS2004 || 0) / (estadisticasCUPS?.totalCUPS || 1) * 100).toFixed(1)}% del catálogo
              </p>
            </div>
            <div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                CUPS Activos
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {estadisticasCUPS?.cupsActivos.toLocaleString()}
              </p>
              <p className="text-xs text-secondary-500 mt-1">habilitados para uso</p>
            </div>
            <div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                Pendientes de Vectorizar
              </p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {estadisticasVector?.cupsPendientes.toLocaleString()}
              </p>
              <p className="text-xs text-secondary-500 mt-1">para búsqueda semántica</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
