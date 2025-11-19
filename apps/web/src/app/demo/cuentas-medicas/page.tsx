'use client';

import { useState, useEffect, useRef } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import { useAutoContrast } from '@/hooks/useAutoContrast';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlayIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  DocumentArrowUpIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { auditoriaAPI } from './api';
import { Factura, Estadisticas, ResultadoAuditoria } from './tipos-auditoria';
import toast from 'react-hot-toast';

export default function CuentasMedicasPage() {
  const [vista, setVista] = useState<'dashboard' | 'facturas' | 'detalle' | 'crear'>('dashboard');
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    estado: '',
    desde: '',
    hasta: '',
  });
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [nombreCuenta, setNombreCuenta] = useState('');
  const [cuentaActual, setCuentaActual] = useState<any>(null);
  const [archivosSubidos, setArchivosSubidos] = useState<any[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);
  const modalHeaderRef = useRef<HTMLDivElement>(null);

  // Hook para detectar automáticamente el contraste en los headers
  const { textColor: headerTextColor } = useAutoContrast(headerRef, {
    lightColor: '#ffffff',
    darkColor: '#1f2937',
  });

  const { textColor: modalHeaderTextColor } = useAutoContrast(modalHeaderRef, {
    lightColor: '#ffffff',
    darkColor: '#1f2937',
  });

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const response = await auditoriaAPI.obtenerEstadisticas();
      setEstadisticas(response.data);
    } catch (error: any) {
      console.error('Error al cargar estadísticas:', error);
      toast.error('No se pudieron cargar las estadísticas. Verifique que el servidor esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  const cargarFacturas = async () => {
    try {
      setLoading(true);
      const response = await auditoriaAPI.obtenerFacturas(filtros);
      setFacturas(response.data);
    } catch (error) {
      console.error('Error al cargar facturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const verDetalleFactura = async (facturaId: string) => {
    try {
      setLoading(true);
      const response = await auditoriaAPI.obtenerFacturaPorId(facturaId);
      setFacturaSeleccionada(response.data);
      setVista('detalle');
    } catch (error) {
      console.error('Error al cargar detalle:', error);
    } finally {
      setLoading(false);
    }
  };

  const ejecutarAuditoria = async (facturaId: string) => {
    try {
      setLoading(true);
      const response = await auditoriaAPI.ejecutarAuditoria(facturaId);

      // Mostrar notificación de éxito con información detallada
      toast.success(
        `Auditoría completada exitosamente!\n\nTotal glosas: $${response.data.totalGlosas.toLocaleString('es-CO')}\nValor aceptado: $${response.data.valorAceptado.toLocaleString('es-CO')}`,
        { duration: 6000, style: { whiteSpace: 'pre-line' } }
      );

      // Recargar detalle
      await verDetalleFactura(facturaId);
      await cargarEstadisticas();
    } catch (error: any) {
      toast.error('Error al ejecutar auditoría: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const descargarExcel = async (facturaId: string) => {
    try {
      setLoading(true);
      await auditoriaAPI.descargarExcel(facturaId);
      toast.success('Excel descargado exitosamente');
    } catch (error: any) {
      toast.error('Error al generar Excel: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const crearFactura = async () => {
    try {
      setLoading(true);

      // Validar nombre
      if (!nombreCuenta.trim()) {
        toast.error('Por favor ingrese un nombre para la cuenta');
        setLoading(false);
        return;
      }

      // Validar archivos
      if (archivosSubidos.length === 0) {
        toast.error('Por favor suba al menos un archivo (Excel/RIPS o PDF)');
        setLoading(false);
        return;
      }

      // Crear FormData para enviar archivos
      const formData = new FormData();
      formData.append('nombreCuenta', nombreCuenta);

      // Agregar todos los archivos
      archivosSubidos.forEach((file) => {
        formData.append('files', file);
      });

      // Mostrar notificación de procesamiento
      const loadingToast = toast.loading('Procesando archivos y creando cuenta...');

      // Enviar al backend
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE}/auditoria/procesar-archivos`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.dismiss(loadingToast);
        throw new Error(errorData.message || 'Error al procesar archivos');
      }

      const result = await response.json();

      // Remover toast de loading y mostrar éxito
      toast.dismiss(loadingToast);
      toast.success(
        `✅ Cuenta creada exitosamente!\n\nFactura: ${result.data.factura.numeroFactura}\nArchivos procesados: ${result.data.archivosProcessed.total}\n\nPuede ver los detalles en el listado de facturas.`,
        { duration: 6000, style: { whiteSpace: 'pre-line' } }
      );

      // Limpiar formulario
      setMostrarModalCrear(false);
      setNombreCuenta('');
      setArchivosSubidos([]);

      // Recargar estadísticas
      await cargarEstadisticas();
    } catch (error: any) {
      toast.error('Error al crear cuenta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const importarDesdeExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Abrir modal de creación con el archivo pre-cargado
    setArchivosSubidos([file]);
    setMostrarModalCrear(true);
    event.target.value = '';

    toast.success('Archivo cargado. Complete el nombre de la cuenta para continuar.', {
      duration: 4000,
    });
  };

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(valor);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getEstadoBadge = (estado: string) => {
    const estilos: Record<string, string> = {
      Radicada: 'bg-blue-100 text-blue-800',
      'En Auditoría': 'bg-yellow-100 text-yellow-800',
      Auditada: 'bg-green-100 text-green-800',
      Glosada: 'bg-orange-100 text-orange-800',
      Aceptada: 'bg-green-100 text-green-800',
      Pagada: 'bg-purple-100 text-purple-800',
      Rechazada: 'bg-red-100 text-red-800',
    };
    return estilos[estado] || 'bg-gray-100 text-gray-800';
  };

  // MODAL DE CREAR FACTURA (Simplificado)
  const ModalCrearFactura = () => {
    // Control del scroll del body cuando el modal está abierto
    useEffect(() => {
      if (mostrarModalCrear) {
        // Deshabilitar scroll del body
        document.body.style.overflow = 'hidden';
      } else {
        // Rehabilitar scroll del body
        document.body.style.overflow = 'unset';
      }

      // Cleanup: asegurar que se rehabilite el scroll al desmontar
      return () => {
        document.body.style.overflow = 'unset';
      };
    }, [mostrarModalCrear]);

    if (!mostrarModalCrear) return null;

    const handleFileSelect = (files: FileList | null) => {
      if (!files) return;
      const newFiles = Array.from(files);
      setArchivosSubidos([...archivosSubidos, ...newFiles]);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      handleFileSelect(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
    };

    const removeFile = (index: number) => {
      setArchivosSubidos(archivosSubidos.filter((_, i) => i !== index));
    };

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 overflow-y-auto">
        <div className="bg-white rounded-lg max-w-2xl w-full my-8 shadow-2xl">
          <div className="p-6" ref={modalHeaderRef}>
            <h2
              className="text-2xl font-bold mb-2 transition-colors"
              style={{ color: modalHeaderTextColor }}
            >
              Nueva Cuenta de Auditoría
            </h2>
            <p
              className="text-sm mb-6 transition-colors"
              style={{ color: modalHeaderTextColor, opacity: 0.8 }}
            >
              Ingrese un nombre y suba los documentos. El sistema extraerá automáticamente la información.
            </p>

            <div className="space-y-6">
              {/* Nombre de la Cuenta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Cuenta *
                </label>
                <input
                  type="text"
                  value={nombreCuenta}
                  onChange={(e) => setNombreCuenta(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Cuenta Hospital San José - Enero 2024"
                  autoFocus
                />
              </div>

              {/* Área de Carga de Archivos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Documentos *
                </label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
                >
                  <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Arrastre archivos aquí o haga clic para seleccionar
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Formatos: Excel (.xlsx, .xls, .csv) para RIPS/Facturas, PDF para soportes
                  </p>
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept=".xlsx,.xls,.csv,.pdf"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Button
                      asChild
                      variant="outline"
                    >
                      <span>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Seleccionar Archivos
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              {/* Lista de Archivos Subidos */}
              {archivosSubidos.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Archivos Seleccionados ({archivosSubidos.length})
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {archivosSubidos.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          {file.name.endsWith('.pdf') ? (
                            <DocumentTextIcon className="h-5 w-5 text-red-500" />
                          ) : (
                            <TableCellsIcon className="h-5 w-5 text-green-500" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="ml-4 text-red-600 hover:text-red-700"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Información */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      ¿Qué archivos debo subir?
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Excel/RIPS con facturas, atenciones y procedimientos</li>
                        <li>PDFs de soportes (autorizaciones, órdenes médicas, etc.)</li>
                        <li>Puede subir múltiples archivos a la vez</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setMostrarModalCrear(false);
                  setNombreCuenta('');
                  setArchivosSubidos([]);
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={crearFactura}
                disabled={loading || !nombreCuenta.trim() || archivosSubidos.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Procesando...' : `Crear y Procesar (${archivosSubidos.length} archivo${archivosSubidos.length !== 1 ? 's' : ''})`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // VISTA DASHBOARD
  if (vista === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Modal */}
          <ModalCrearFactura />

          {/* Header */}
          <div className="mb-8" ref={headerRef}>
            <Link href="/demo">
              <Button variant="ghost" className="mb-4">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Volver a Demos
              </Button>
            </Link>

            <div className="flex items-center justify-between">
              <div>
                <h1
                  className="text-4xl font-bold mb-2 transition-colors"
                  style={{ color: headerTextColor }}
                >
                  🏥 Auditoría de Cuentas Médicas
                </h1>
                <p
                  className="transition-colors"
                  style={{ color: headerTextColor, opacity: 0.8 }}
                >
                  Sistema experto con IA para auditoría automática de facturas de salud
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setMostrarModalCrear(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Nueva Factura
                </Button>
                <Button
                  onClick={() => {
                    cargarFacturas();
                    setVista('facturas');
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                  Ver Facturas
                </Button>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          {estadisticas && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="border-l-4 border-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Facturas</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {estadisticas.totalFacturas}
                        </p>
                      </div>
                      <div className="bg-blue-100 p-3 rounded-full">
                        <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-green-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Auditadas</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {estadisticas.facturasAuditadas}
                        </p>
                      </div>
                      <div className="bg-green-100 p-3 rounded-full">
                        <CheckCircleIcon className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-purple-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Valor Total</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatearMoneda(estadisticas.totales.valorTotal)}
                        </p>
                      </div>
                      <div className="bg-purple-100 p-3 rounded-full">
                        <CurrencyDollarIcon className="h-8 w-8 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-orange-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Glosas</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {formatearMoneda(estadisticas.totales.totalGlosas)}
                        </p>
                      </div>
                      <div className="bg-orange-100 p-3 rounded-full">
                        <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficos y Detalles */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Estado de Facturas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {estadisticas.estadoPorFactura.map((item) => (
                        <div key={item._id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge className={getEstadoBadge(item._id)}>
                              {item._id}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {item.count} facturas
                            </span>
                          </div>
                          <span className="font-semibold text-gray-900">
                            {formatearMoneda(item.total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Glosas por Tipo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {estadisticas.glosasPorTipo.map((item) => (
                        <div key={item._id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span className="text-sm font-medium text-gray-700">
                              {item._id}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({item.count})
                            </span>
                          </div>
                          <span className="font-semibold text-orange-600">
                            {formatearMoneda(item.valorTotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Características del Sistema */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>✨ Características del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Validación Automática</p>
                    <p className="text-sm text-gray-600">
                      Compara tarifas IPS vs contrato automáticamente
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Detección de Duplicidades</p>
                    <p className="text-sm text-gray-600">
                      Identifica procedimientos duplicados automáticamente
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Motor de Reglas IA</p>
                    <p className="text-sm text-gray-600">
                      9 reglas de auditoría configurables sin código
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Validación de Autorizaciones</p>
                    <p className="text-sm text-gray-600">
                      Verifica autorizaciones y vigencias automáticamente
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Pertinencia Médica</p>
                    <p className="text-sm text-gray-600">
                      Valida correspondencia diagnóstico-procedimiento
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Exportación Excel</p>
                    <p className="text-sm text-gray-600">
                      Genera reportes profesionales en Excel listos para entregar
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // VISTA LISTADO DE FACTURAS
  if (vista === 'facturas') {
    useEffect(() => {
      if (facturas.length === 0) {
        cargarFacturas();
      }
    }, []);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Modal */}
          <ModalCrearFactura />

          <div className="mb-6">
            <Button variant="ghost" onClick={() => setVista('dashboard')}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>📋 Facturas de Salud</CardTitle>
                <div className="flex space-x-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={importarDesdeExcel}
                      className="hidden"
                    />
                    <Button
                      as="span"
                      variant="outline"
                      className="border-purple-600 text-purple-600 hover:bg-purple-50"
                    >
                      <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                      Importar Excel
                    </Button>
                  </label>
                  <Button
                    onClick={() => setMostrarModalCrear(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nueva Factura
                  </Button>
                  <Button
                    onClick={cargarFacturas}
                    variant="outline"
                    disabled={loading}
                  >
                    {loading ? 'Cargando...' : 'Actualizar'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={filtros.estado}
                    onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Todos</option>
                    <option value="Radicada">Radicada</option>
                    <option value="En Auditoría">En Auditoría</option>
                    <option value="Auditada">Auditada</option>
                    <option value="Glosada">Glosada</option>
                    <option value="Aceptada">Aceptada</option>
                    <option value="Pagada">Pagada</option>
                    <option value="Rechazada">Rechazada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={filtros.desde}
                    onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={filtros.hasta}
                    onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Listado */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando facturas...</p>
                </div>
              ) : facturas.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No hay facturas disponibles</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Las facturas aparecerán aquí una vez que sean cargadas en el sistema
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {facturas.map((factura) => (
                    <div
                      key={factura._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {factura.numeroFactura}
                            </h3>
                            <Badge className={getEstadoBadge(factura.estado)}>
                              {factura.estado}
                            </Badge>
                            {factura.auditoriaCompletada && (
                              <Badge className="bg-green-100 text-green-800">
                                ✓ Auditada
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">IPS</p>
                              <p className="font-medium">{factura.ips.nombre}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">EPS</p>
                              <p className="font-medium">{factura.eps.nombre}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Fecha</p>
                              <p className="font-medium">{formatearFecha(factura.fechaEmision)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Valor Total</p>
                              <p className="font-semibold text-blue-600">
                                {formatearMoneda(factura.valorTotal)}
                              </p>
                            </div>
                          </div>

                          {factura.auditoriaCompletada && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center space-x-6 text-sm">
                                <div>
                                  <span className="text-gray-500">Glosas: </span>
                                  <span className="font-semibold text-orange-600">
                                    {formatearMoneda(factura.totalGlosas)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Valor Aceptado: </span>
                                  <span className="font-semibold text-green-600">
                                    {formatearMoneda(factura.valorAceptado)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            onClick={() => verDetalleFactura(factura._id)}
                            variant="outline"
                            size="sm"
                          >
                            Ver Detalle
                          </Button>
                          {factura.auditoriaCompletada && (
                            <Button
                              onClick={() => descargarExcel(factura._id)}
                              variant="outline"
                              size="sm"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                              Excel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // VISTA DETALLE DE FACTURA
  if (vista === 'detalle' && facturaSeleccionada) {
    const { factura, atenciones, procedimientos, glosas } = facturaSeleccionada;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => setVista('facturas')}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Volver a Facturas
            </Button>
          </div>

          {/* Información de la Factura */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    Factura {factura.numeroFactura}
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    {factura.ips.nombre} → {factura.eps.nombre}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={getEstadoBadge(factura.estado)} size="lg">
                    {factura.estado}
                  </Badge>
                  {!factura.auditoriaCompletada ? (
                    <Button
                      onClick={() => ejecutarAuditoria(factura._id)}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <PlayIcon className="h-5 w-5 mr-2" />
                      {loading ? 'Ejecutando...' : 'Ejecutar Auditoría'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => descargarExcel(factura._id)}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                      Descargar Excel
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Valor Bruto</p>
                  <p className="text-xl font-semibold">{formatearMoneda(factura.valorBruto)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">IVA</p>
                  <p className="text-xl font-semibold">{formatearMoneda(factura.iva)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Glosas</p>
                  <p className="text-xl font-semibold text-orange-600">
                    {formatearMoneda(factura.totalGlosas)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Valor Aceptado</p>
                  <p className="text-xl font-semibold text-green-600">
                    {formatearMoneda(factura.valorAceptado)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Atenciones */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Atenciones ({atenciones.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {atenciones.map((atencion: any) => (
                  <div
                    key={atencion._id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Atención {atencion.numeroAtencion}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Paciente: {atencion.paciente.tipoDocumento} {atencion.paciente.numeroDocumento}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {atencion.tieneAutorizacion ? (
                          <Badge className="bg-green-100 text-green-800">
                            ✓ Autorizado
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            ✗ Sin Autorización
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium text-blue-900">
                        Diagnóstico: {atencion.diagnosticoPrincipal.codigoCIE10}
                      </p>
                      <p className="text-sm text-blue-700">
                        {atencion.diagnosticoPrincipal.descripcion}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Fecha</p>
                        <p>{formatearFecha(atencion.fechaInicio)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Copago</p>
                        <p>{formatearMoneda(atencion.copago)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Cuota Moderadora</p>
                        <p>{formatearMoneda(atencion.cuotaModeradora)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Procedimientos */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Procedimientos ({procedimientos.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Código CUPS
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Descripción
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Cant.
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Valor IPS
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Valor Contrato
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Diferencia
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Glosas
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {procedimientos.map((proc: any) => (
                      <tr
                        key={proc._id}
                        className={`border-b border-gray-100 ${
                          proc.duplicado ? 'bg-red-50' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm">{proc.codigoCUPS}</span>
                            {proc.duplicado && (
                              <Badge className="bg-red-100 text-red-800 text-xs">
                                Duplicado
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{proc.descripcion}</td>
                        <td className="py-3 px-4 text-right">{proc.cantidad}</td>
                        <td className="py-3 px-4 text-right">
                          {formatearMoneda(proc.valorTotalIPS)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {formatearMoneda(proc.valorTotalContrato)}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-semibold ${
                            proc.diferenciaTarifa > 0
                              ? 'text-orange-600'
                              : 'text-gray-900'
                          }`}
                        >
                          {formatearMoneda(proc.diferenciaTarifa)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-orange-600">
                          {formatearMoneda(proc.totalGlosas)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Glosas */}
          {glosas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Glosas Generadas ({glosas.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {glosas.map((glosa: any) => (
                    <div
                      key={glosa._id}
                      className="border border-orange-200 bg-orange-50 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className="bg-orange-100 text-orange-800">
                              {glosa.codigo}
                            </Badge>
                            <Badge className="bg-gray-100 text-gray-800">
                              {glosa.tipo}
                            </Badge>
                            <Badge className={getEstadoBadge(glosa.estado)}>
                              {glosa.estado}
                            </Badge>
                            {glosa.generadaAutomaticamente && (
                              <Badge className="bg-blue-100 text-blue-800">
                                🤖 Automática
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {glosa.descripcion}
                          </p>
                          {glosa.observaciones && (
                            <p className="text-xs text-gray-600 mt-1">
                              {glosa.observaciones}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold text-orange-600">
                            {formatearMoneda(glosa.valorGlosado)}
                          </p>
                          {glosa.porcentaje && (
                            <p className="text-xs text-gray-600">
                              {glosa.porcentaje}%
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return null;
}
