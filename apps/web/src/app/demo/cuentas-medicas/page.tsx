'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  ShieldCheckIcon,
  TrashIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';
import { auditoriaAPI } from './api';
import { Factura, Estadisticas, ResultadoAuditoria } from './tipos-auditoria';
import toast from 'react-hot-toast';
import ProcesoAuditoriaVisual from './ProcesoAuditoriaVisual';

// Tipo para documentos de la base de conocimiento
interface DocumentoConocimiento {
  id: string;
  nombre: string;
  tipo: 'tarifario' | 'normativa' | 'guia' | 'cups' | 'cie10';
  descripcion: string;
  activo: boolean;
  registros?: number;
  contenido?: string;
}

export default function CuentasMedicasPage() {
  const [vista, setVista] = useState<'dashboard' | 'facturas' | 'detalle' | 'crear' | 'proceso' | 'admin'>('dashboard');
  const [mostrarProceso, setMostrarProceso] = useState(false);
  const [procesoEnEjecucion, setProcesoEnEjecucion] = useState(false);
  const [verProcesoAlCrear, setVerProcesoAlCrear] = useState(false);
  const [facturaIdProceso, setFacturaIdProceso] = useState<string | null>(null); // Para rastrear factura en proceso
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
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState<DocumentoConocimiento | null>(null);
  const [mostrarModalDocumento, setMostrarModalDocumento] = useState(false);
  const [mostrarFlujo, setMostrarFlujo] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const modalHeaderRef = useRef<HTMLDivElement>(null);

  // Estado para documentos de la base de conocimiento
  const [documentosConocimiento, setDocumentosConocimiento] = useState<DocumentoConocimiento[]>([
    {
      id: 'cups',
      nombre: 'Códigos CUPS',
      tipo: 'cups',
      descripcion: 'Base SISPRO actualizada con 12,457 códigos de procedimientos',
      activo: true,
      registros: 12457,
      contenido: 'Sistema de clasificación de procedimientos médicos y quirúrgicos. Incluye códigos como:\n\n890201 - Consulta Medicina General\n890301 - Consulta Medicina Especializada\n890701 - Consulta Odontología\n...\n\nTotal: 12,457 procedimientos clasificados'
    },
    {
      id: 'cie10',
      nombre: 'Diagnósticos CIE-10',
      tipo: 'cie10',
      descripcion: 'Clasificación internacional de enfermedades - 14,891 diagnósticos',
      activo: true,
      registros: 14891,
      contenido: 'Clasificación Internacional de Enfermedades versión 10. Incluye:\n\nA00-B99: Enfermedades infecciosas y parasitarias\nC00-D48: Neoplasias\nE00-E90: Enfermedades endocrinas\nJ00-J99: Enfermedades del sistema respiratorio\nJ18.9 - Neumonía no especificada\n...\n\nTotal: 14,891 códigos de diagnóstico'
    },
    {
      id: 'soat',
      nombre: 'Tarifario SOAT 2024',
      tipo: 'tarifario',
      descripcion: 'Seguro Obligatorio de Accidentes de Tránsito',
      activo: true,
      contenido: '# Tarifario SOAT 2024\n\n## Consultas\n- 890201: $35,000\n- 890301: $50,000\n\n## Procedimientos Quirúrgicos\n- 331101: $2,500,000\n- 331102: $1,800,000\n\n## Hospitalización\n- Día cama UCI: $1,200,000\n- Día cama general: $450,000\n\nVigencia: Enero 2024 - Diciembre 2024'
    },
    {
      id: 'iss',
      nombre: 'Manual Tarifario ISS 2001',
      tipo: 'tarifario',
      descripcion: 'Base de tarifas institucionales',
      activo: true,
      contenido: '# Manual Tarifario ISS 2001\n\n## Consulta Externa\n- CUPS 890201: $25,000 (Base)\n- CUPS 890301: $40,000 (Especializada)\n\n## Procedimientos\n- Laboratorio clínico: $15,000 - $80,000\n- Imagenología básica: $50,000 - $200,000\n- Cirugía menor: $150,000 - $500,000\n\nTarifas base sujetas a multiplicadores según nivel de complejidad'
    },
    {
      id: 'contratos',
      nombre: 'Contratos EPS - IPS',
      tipo: 'tarifario',
      descripcion: 'Tarifas pactadas específicas - 3 contratos activos',
      activo: true,
      registros: 3,
      contenido: '# Contratos Vigentes EPS-IPS\n\n## Contrato 1: EPS Salud Total - IPS San José\n- Consulta general: $30,000\n- Consulta especializada: $45,000\n- Vigencia: 2024\n\n## Contrato 2: EPS Nueva EPS - IPS San José  \n- Consulta general: $28,000\n- Consulta especializada: $42,000\n- Vigencia: 2024\n\n## Contrato 3: EPS Compensar - IPS San José\n- Consulta general: $32,000\n- Consulta especializada: $48,000\n- Vigencia: 2024'
    },
    {
      id: 'ley100',
      nombre: 'Ley 100 de 1993',
      tipo: 'normativa',
      descripcion: 'Sistema General de Seguridad Social en Salud',
      activo: true,
      contenido: '# Ley 100 de 1993\n\n## Sistema General de Seguridad Social en Salud\n\n### Artículos Relevantes:\n\n**Art. 156**: Características del Plan Obligatorio de Salud\n- Debe cubrir todas las contingencias\n- Servicios de promoción y prevención\n- Atención médica especializada\n\n**Art. 182**: Facturación de servicios\n- Las IPS deben presentar facturación detallada\n- Soportes de autorización\n- Historia clínica cuando sea requerida\n\n**Art. 227**: Glosas y devoluciones\n- Procedimientos para objeción de cuentas\n- Plazos de respuesta\n- Mecanismos de conciliación'
    },
    {
      id: 'res3047',
      nombre: 'Resolución 3047 de 2008',
      tipo: 'normativa',
      descripcion: 'Manual de tarifas y procedimientos',
      activo: true,
      contenido: '# Resolución 3047 de 2008\n\n## Manual de Tarifas Mínimas\n\n### Consultas\n- Medicina general: Tarifa mínima $22,000\n- Medicina especializada: Tarifa mínima $35,000\n- Odontología: Tarifa mínima $28,000\n\n### Procedimientos\n- Cada procedimiento debe facturarse según tarifa SOAT o ISS\n- Se permite incremento hasta 30% según nivel de complejidad\n- Requiere justificación médica documentada\n\n### Documentación Requerida\n- Orden médica\n- Autorización EPS\n- Consentimiento informado\n- Registro en historia clínica'
    },
    {
      id: 'guias',
      nombre: 'Guías de Práctica Clínica',
      tipo: 'guia',
      descripcion: 'Validación de pertinencia médica - 125 guías',
      activo: true,
      registros: 125,
      contenido: '# Guías de Práctica Clínica\n\n## Enfermedades Respiratorias\n\n### Neumonía (CIE-10: J18.9)\n**Procedimientos Pertinentes:**\n- Radiografía de tórax (CUPS: 870201)\n- Hemograma completo (CUPS: 902210)\n- Proteína C reactiva (CUPS: 902316)\n- Hospitalización según gravedad\n\n**No Pertinente:**\n- TAC cerebral simple (sin indicación)\n- Resonancia magnética sin justificación\n\n## Enfermedades Cardiovasculares\n\n### Hipertensión Arterial (CIE-10: I10)\n**Procedimientos Pertinentes:**\n- Electrocardiograma (CUPS: 890701)\n- Perfil lipídico (CUPS: 902234)\n- Ecocardiograma según evolución\n\n... (125 guías en total)'
    }
  ]);

  // Hook para detectar automáticamente el contraste en los headers
  const { textColor: headerTextColor } = useAutoContrast(headerRef, {
    lightColor: '#ffffff',
    darkColor: '#1f2937',
  });

  const { textColor: modalHeaderTextColor } = useAutoContrast(modalHeaderRef, {
    lightColor: '#ffffff',
    darkColor: '#1f2937',
  });

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

  const cargarFacturas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await auditoriaAPI.obtenerFacturas(filtros);
      setFacturas(response.data);
    } catch (error) {
      console.error('Error al cargar facturas:', error);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  // Cargar facturas cuando cambia la vista a 'facturas' o 'admin'
  useEffect(() => {
    if ((vista === 'facturas' || vista === 'admin') && facturas.length === 0) {
      cargarFacturas();
    }
  }, [vista, facturas.length, cargarFacturas]);

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

  const ejecutarAuditoria = async (facturaId: string, verProceso: boolean = false) => {
    try {
      setLoading(true);

      // Si se solicita ver el proceso, mostrar la visualización paso a paso
      if (verProceso) {
        setMostrarProceso(true);
        setProcesoEnEjecucion(true);
        setFacturaIdProceso(facturaId); // Guardar factura para el proceso
        setVista('proceso');
        setLoading(false);
        return; // No ejecutar automáticamente, dejar que el usuario controle
      }

      // Ejecución rápida sin visualización
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

  const eliminarFactura = async (facturaId: string, numeroFactura: string) => {
    const confirmar = window.confirm(
      `¿Está seguro de que desea eliminar la factura ${numeroFactura}? Esta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    try {
      setLoading(true);
      await auditoriaAPI.eliminarFactura(facturaId);
      toast.success('Factura eliminada exitosamente');

      // Actualizar la lista de facturas
      await cargarFacturas();
      await cargarEstadisticas();
    } catch (error: any) {
      toast.error('Error al eliminar factura: ' + error.message);
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
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const API_BASE = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
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

      // Limpiar formulario
      setMostrarModalCrear(false);
      const archivosCargados = [...archivosSubidos];
      setNombreCuenta('');
      setArchivosSubidos([]);

      // Si el usuario seleccionó ver el proceso, mostrarlo
      if (verProcesoAlCrear) {
        setMostrarProceso(true);
        setProcesoEnEjecucion(true);
        setVista('proceso');

        // Esperar a que termine la visualización
        await new Promise(resolve => setTimeout(resolve, 13000));

        toast.success(
          `✅ Cuenta creada exitosamente!\n\nFactura: ${result.data.factura.numeroFactura}\nArchivos procesados: ${result.data.archivosProcessed.total}`,
          { duration: 6000, style: { whiteSpace: 'pre-line' } }
        );

        setProcesoEnEjecucion(false);
        setVista('facturas');
        await cargarFacturas();
      } else {
        toast.success(
          `✅ Cuenta creada exitosamente!\n\nFactura: ${result.data.factura.numeroFactura}\nArchivos procesados: ${result.data.archivosProcessed.total}`,
          { duration: 6000, style: { whiteSpace: 'pre-line' } }
        );
      }

      // Recargar estadísticas
      await cargarEstadisticas();
      setVerProcesoAlCrear(false);
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

  // Función para toggle de activación de documento
  const toggleDocumento = (id: string) => {
    setDocumentosConocimiento(prev =>
      prev.map(doc =>
        doc.id === id ? { ...doc, activo: !doc.activo } : doc
      )
    );
    const doc = documentosConocimiento.find(d => d.id === id);
    if (doc) {
      toast.success(`${doc.nombre} ${doc.activo ? 'desactivado' : 'activado'}`);
    }
  };

  // Función para ver documento
  const verDocumento = (doc: DocumentoConocimiento) => {
    setDocumentoSeleccionado(doc);
    setMostrarModalDocumento(true);
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

              {/* Opción de ver proceso */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verProcesoAlCrear}
                    onChange={(e) => setVerProcesoAlCrear(e.target.checked)}
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-purple-900">
                      📊 Ver proceso de auditoría paso a paso
                    </span>
                    <p className="text-xs text-purple-700 mt-1">
                      Muestra cómo se procesan los documentos y se generan las glosas (demora ~13 segundos adicionales)
                    </p>
                  </div>
                </label>
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

  // MODAL DE VISUALIZACIÓN DE DOCUMENTO
  const ModalDocumento = () => {
    useEffect(() => {
      if (mostrarModalDocumento) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
      return () => {
        document.body.style.overflow = 'unset';
      };
    }, [mostrarModalDocumento]);

    if (!mostrarModalDocumento || !documentoSeleccionado) return null;

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 overflow-y-auto">
        <div className="bg-white rounded-lg max-w-4xl w-full my-8 shadow-2xl max-h-[90vh] flex flex-col">
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {documentoSeleccionado.nombre}
                </h2>
                <p className="text-sm text-gray-600">{documentoSeleccionado.descripcion}</p>
                {documentoSeleccionado.registros && (
                  <Badge className="mt-2 bg-blue-100 text-blue-800">
                    {documentoSeleccionado.registros.toLocaleString()} registros
                  </Badge>
                )}
              </div>
              <button
                onClick={() => setMostrarModalDocumento(false)}
                className="text-gray-400 hover:text-gray-600 ml-4"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {documentoSeleccionado.contenido || 'No hay contenido disponible'}
              </pre>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setMostrarModalDocumento(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // DIAGRAMA DE FLUJO DEL PROCESO
  const DiagramaFlujo = () => {
    const pasos = [
      { num: 1, titulo: 'Carga de Documentos', desc: 'Excel RIPS + PDFs soportes', icono: '📄', color: 'bg-blue-100 border-blue-500' },
      { num: 2, titulo: 'Extracción de Datos', desc: 'IA extrae: códigos CUPS, CIE-10, valores, autorizaciones', icono: '🔍', color: 'bg-purple-100 border-purple-500' },
      { num: 3, titulo: 'Consulta Tarifarios', desc: 'SOAT, ISS, Contratos EPS-IPS', icono: '💰', color: 'bg-green-100 border-green-500' },
      { num: 4, titulo: 'Validación Autorizaciones', desc: 'Verifica números, vigencia, cantidades', icono: '✅', color: 'bg-yellow-100 border-yellow-500' },
      { num: 5, titulo: 'Detección Duplicidades', desc: 'Identifica cobros duplicados', icono: '⚠️', color: 'bg-orange-100 border-orange-500' },
      { num: 6, titulo: 'Pertinencia Médica', desc: 'Valida coherencia diagnóstico-procedimiento', icono: '🩺', color: 'bg-indigo-100 border-indigo-500' },
      { num: 7, titulo: 'Generación de Glosas', desc: 'Crea glosas automáticas con justificación', icono: '📋', color: 'bg-red-100 border-red-500' },
      { num: 8, titulo: 'Reporte Excel', desc: 'Excel completo: resumen, glosas, detalles', icono: '📊', color: 'bg-green-100 border-green-500' },
    ];

    return (
      <div className="bg-white rounded-lg p-6 border-2 border-gray-300">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <ChartBarIcon className="h-6 w-6 text-blue-600" />
          Flujo del Proceso de Auditoría Médica
        </h3>

        <div className="space-y-4">
          {pasos.map((paso, idx) => (
            <div key={paso.num}>
              <div className={`flex items-center gap-4 p-4 border-2 rounded-lg ${paso.color}`}>
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-current flex items-center justify-center font-bold text-lg">
                  {paso.num}
                </div>
                <div className="flex-shrink-0 text-3xl">{paso.icono}</div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{paso.titulo}</h4>
                  <p className="text-sm text-gray-700">{paso.desc}</p>
                </div>
              </div>
              {idx < pasos.length - 1 && (
                <div className="flex justify-center py-2">
                  <div className="text-gray-400 text-2xl">↓</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
          <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
            <CpuChipIcon className="h-5 w-5" />
            Tecnología Utilizada
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>OCR + NLP</strong>: Extracción inteligente de datos de PDFs y Excel</li>
            <li>• <strong>Base de Datos</strong>: CUPS (12,457), CIE-10 (14,891), Tarifarios (5)</li>
            <li>• <strong>Motor de Reglas</strong>: 9 reglas de auditoría configurables</li>
            <li>• <strong>IA Generativa</strong>: Justificación automática de glosas</li>
            <li>• <strong>Tiempo Promedio</strong>: 15-20 segundos por cuenta completa</li>
          </ul>
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
                  onClick={() => setVista('admin')}
                  variant="outline"
                  className="border-gray-600 text-gray-700 hover:bg-gray-50"
                >
                  <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                  Administración
                </Button>
                <Button
                  onClick={() => {
                    setMostrarProceso(true);
                    setProcesoEnEjecucion(true);
                    setVista('proceso');
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Ver Proceso
                </Button>
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
                          <Button
                            onClick={() => eliminarFactura(factura._id, factura.numeroFactura)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
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
                    <>
                      <Button
                        onClick={() => ejecutarAuditoria(factura._id, true)}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <ChartBarIcon className="h-5 w-5 mr-2" />
                        Ver Proceso Paso a Paso
                      </Button>
                      <Button
                        onClick={() => ejecutarAuditoria(factura._id)}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <PlayIcon className="h-5 w-5 mr-2" />
                        {loading ? 'Ejecutando...' : 'Ejecutar Rápido'}
                      </Button>
                    </>
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

  // VISTA PROCESO DE AUDITORÍA
  if (vista === 'proceso') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => setVista('dashboard')}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </div>

          <ProcesoAuditoriaVisual
            facturaId={facturaIdProceso || undefined}
            enEjecucion={procesoEnEjecucion}
            usarBackend={!!facturaIdProceso} // Usar backend solo si hay facturaId
            onFinalizar={async (resultado) => {
              setProcesoEnEjecucion(false);

              if (facturaIdProceso) {
                // Proceso real completado
                toast.success(
                  `¡Auditoría completada!\n\nTotal glosas: $${resultado.totalGlosas.toLocaleString('es-CO')}\nValor aceptado: $${resultado.valorAceptado.toLocaleString('es-CO')}`,
                  { duration: 6000, style: { whiteSpace: 'pre-line' } }
                );

                // Recargar datos
                await verDetalleFactura(facturaIdProceso);
                await cargarEstadisticas();

                // Volver a la vista de detalle
                setTimeout(() => {
                  setVista('detalle');
                  setFacturaIdProceso(null);
                }, 2000);
              } else {
                // Demo completado
                toast.success(
                  `¡Proceso completado!\n\nAhora puedes crear una factura y ejecutar una auditoría real.`,
                  { duration: 5000, style: { whiteSpace: 'pre-line' } }
                );
              }
            }}
          />
        </div>
      </div>
    );
  }

  // VISTA ADMINISTRACIÓN
  if (vista === 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Modales */}
          <ModalDocumento />

          <div className="mb-6">
            <Button variant="ghost" onClick={() => setVista('dashboard')}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🤖 Base de Conocimiento del Sistema Experto
            </h1>
            <p className="text-gray-600">
              Todos los documentos, tarifarios y normativas en los que se basa la IA para auditar facturas médicas
            </p>
          </div>

          {/* Estadísticas de Base de Conocimiento */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Códigos CUPS</p>
                    <p className="text-3xl font-bold text-purple-900">12,457</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <TableCellsIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Base SISPRO actualizada</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Diagnósticos CIE-10</p>
                    <p className="text-3xl font-bold text-blue-900">14,891</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Clasificación internacional</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Tarifarios</p>
                    <p className="text-3xl font-bold text-green-900">5</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">SOAT, ISS, Contratos EPS</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Documentos Cargados</p>
                    <p className="text-3xl font-bold text-orange-900">
                      {facturas.reduce((acc, f) => acc + 1 + (f.soportes?.length || 2), 0)}
                    </p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-full">
                    <DocumentArrowUpIcon className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Facturas y soportes</p>
              </CardContent>
            </Card>
          </div>

          {/* Bases de Datos del Sistema Experto */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TableCellsIcon className="h-6 w-6 text-purple-600" />
                Documentos de Base de Conocimiento
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Haz clic en cualquier documento para ver su contenido. Usa el toggle para activar/desactivar su uso en auditorías.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documentosConocimiento.map((doc) => (
                  <div
                    key={doc.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                      doc.activo
                        ? 'bg-green-50 border-green-300 hover:bg-green-100'
                        : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                    }`}
                    onClick={() => verDocumento(doc)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        doc.tipo === 'tarifario' ? 'bg-green-100' :
                        doc.tipo === 'normativa' ? 'bg-blue-100' :
                        doc.tipo === 'guia' ? 'bg-indigo-100' :
                        doc.tipo === 'cups' ? 'bg-purple-100' :
                        'bg-blue-100'
                      }`}>
                        {doc.tipo === 'tarifario' && <CurrencyDollarIcon className="h-6 w-6 text-green-600" />}
                        {doc.tipo === 'normativa' && <ShieldCheckIcon className="h-6 w-6 text-blue-600" />}
                        {doc.tipo === 'guia' && <DocumentTextIcon className="h-6 w-6 text-indigo-600" />}
                        {doc.tipo === 'cups' && <TableCellsIcon className="h-6 w-6 text-purple-600" />}
                        {doc.tipo === 'cie10' && <DocumentTextIcon className="h-6 w-6 text-blue-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                          {doc.nombre}
                          {doc.registros && (
                            <Badge className="bg-gray-100 text-gray-700 text-xs">
                              {doc.registros.toLocaleString()} registros
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">{doc.descripcion}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4" onClick={(e) => e.stopPropagation()}>
                      <label className="flex items-center cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={doc.activo}
                            onChange={() => toggleDocumento(doc.id)}
                            className="sr-only"
                          />
                          <div className={`block w-14 h-8 rounded-full transition-colors ${
                            doc.activo ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                          <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                            doc.activo ? 'transform translate-x-6' : ''
                          }`}></div>
                        </div>
                      </label>
                      <Badge className={doc.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}>
                        {doc.activo ? (
                          <>
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Activo
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-3 w-3 mr-1" />
                            Inactivo
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Diagrama de Flujo */}
          <div className="mb-8">
            <DiagramaFlujo />
          </div>

          {/* Listado de Documentos por Factura */}
          <Card>
            <CardHeader>
              <CardTitle>Documentos por Cuenta Médica</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando documentos...</p>
                </div>
              ) : facturas.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No hay documentos cargados</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Los documentos aparecerán aquí una vez que crees facturas en el sistema
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {facturas.map((factura) => (
                    <div key={factura._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {factura.numeroFactura}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {factura.ips.nombre} • {formatearFecha(factura.fechaEmision)}
                          </p>
                        </div>
                        <Badge className={getEstadoBadge(factura.estado)}>
                          {factura.estado}
                        </Badge>
                      </div>

                      {/* Documentos de la Factura */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Documento Principal */}
                        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <TableCellsIcon className="h-8 w-8 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900">RIPS/Factura Principal</p>
                            <p className="text-xs text-gray-600">Excel • Generado automáticamente</p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Procesado
                          </Badge>
                        </div>

                        {/* Soportes */}
                        {(factura.soportes && factura.soportes.length > 0 ? factura.soportes : [
                          { tipo: 'pdf', descripcion: 'Autorizaciones' },
                          { tipo: 'pdf', descripcion: 'Órdenes Médicas' }
                        ]).map((soporte: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <DocumentTextIcon className="h-8 w-8 text-red-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">
                                {soporte.descripcion || `Soporte ${idx + 1}`}
                              </p>
                              <p className="text-xs text-gray-600">PDF • Soporte documental</p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800">
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              Validado
                            </Badge>
                          </div>
                        ))}
                      </div>

                      {/* Resumen de Documentos */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            Total documentos: {1 + ((factura.soportes?.length || 0) > 0 ? factura.soportes.length : 2)}
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => verDetalleFactura(factura._id)}
                            >
                              Ver Detalles Completos
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => eliminarFactura(factura._id, factura.numeroFactura)}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
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

  return null;
}
