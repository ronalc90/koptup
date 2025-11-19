'use client';

import { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  CheckCircleIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  TableCellsIcon,
  ShieldCheckIcon,
  CalculatorIcon,
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface PasoProcesoProps {
  numero: number;
  titulo: string;
  descripcion: string;
  icono: React.ReactNode;
  datosUsados: string[];
  estado: 'pendiente' | 'en-proceso' | 'completado';
  duracion?: string;
  resultados?: { label: string; valor: string; tipo?: 'exito' | 'advertencia' | 'error' }[];
}

const PasoProceso: React.FC<PasoProcesoProps> = ({
  numero,
  titulo,
  descripcion,
  icono,
  datosUsados,
  estado,
  duracion,
  resultados,
}) => {
  const [expandido, setExpandido] = useState(false);

  const colorPorEstado = {
    pendiente: 'border-gray-300 bg-gray-50',
    'en-proceso': 'border-blue-500 bg-blue-50 animate-pulse',
    completado: 'border-green-500 bg-green-50',
  };

  const iconoPorEstado = {
    pendiente: <ClockIcon className="h-5 w-5 text-gray-400" />,
    'en-proceso': <CpuChipIcon className="h-5 w-5 text-blue-600 animate-spin" />,
    completado: <CheckCircleIcon className="h-5 w-5 text-green-600" />,
  };

  return (
    <div className={`border-2 rounded-lg p-4 mb-4 transition-all ${colorPorEstado[estado]}`}>
      <div className="flex items-start gap-4">
        {/* Número del Paso */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
            estado === 'completado'
              ? 'bg-green-600'
              : estado === 'en-proceso'
              ? 'bg-blue-600'
              : 'bg-gray-400'
          }`}
        >
          {estado === 'completado' ? '✓' : numero}
        </div>

        <div className="flex-1">
          {/* Header del Paso */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{icono}</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{titulo}</h3>
                {duracion && estado === 'completado' && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    {duracion}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {iconoPorEstado[estado]}
              <button
                onClick={() => setExpandido(!expandido)}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                {expandido ? 'Ocultar detalles' : 'Ver detalles'}
              </button>
            </div>
          </div>

          {/* Descripción */}
          <p className="text-sm text-gray-700 mb-3">{descripcion}</p>

          {/* Detalles Expandibles */}
          {expandido && (
            <div className="mt-4 space-y-4 border-t pt-4">
              {/* Datos Utilizados */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <TableCellsIcon className="h-4 w-4" />
                  Datos Utilizados
                </h4>
                <div className="flex flex-wrap gap-2">
                  {datosUsados.map((dato, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-blue-100 text-blue-800">
                      {dato}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Resultados */}
              {resultados && resultados.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <ChartBarIcon className="h-4 w-4" />
                    Resultados
                  </h4>
                  <div className="space-y-2">
                    {resultados.map((resultado, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          resultado.tipo === 'exito'
                            ? 'bg-green-100'
                            : resultado.tipo === 'advertencia'
                            ? 'bg-yellow-100'
                            : resultado.tipo === 'error'
                            ? 'bg-red-100'
                            : 'bg-gray-100'
                        }`}
                      >
                        <span className="text-sm font-medium">{resultado.label}</span>
                        <span className="text-sm font-bold">{resultado.valor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Flecha hacia el siguiente paso (excepto el último) */}
      {estado !== 'pendiente' && (
        <div className="flex justify-center mt-3">
          <ArrowRightIcon className="h-6 w-6 text-gray-400 rotate-90" />
        </div>
      )}
    </div>
  );
};

interface DocumentoSubido {
  nombre: string;
  tipo: 'excel' | 'pdf';
  tamaño: string;
  estado: 'procesado' | 'procesando' | 'pendiente';
}

interface ProcesoAuditoriaVisualProps {
  facturaId?: string;
  enEjecucion?: boolean;
  onFinalizar?: (resultado: any) => void;
  documentos?: DocumentoSubido[];
}

export default function ProcesoAuditoriaVisual({
  facturaId,
  enEjecucion = false,
  onFinalizar,
  documentos = [],
}: ProcesoAuditoriaVisualProps) {
  const [pasoActual, setPasoActual] = useState(0);
  const [resultadosAuditoria, setResultadosAuditoria] = useState<any>(null);
  const [documentosProcesados, setDocumentosProcesados] = useState<DocumentoSubido[]>(
    documentos.length > 0
      ? documentos
      : [
          { nombre: 'RIPS_Factura_2024.xlsx', tipo: 'excel', tamaño: '245 KB', estado: 'pendiente' },
          { nombre: 'Autorizaciones_Pacientes.pdf', tipo: 'pdf', tamaño: '1.2 MB', estado: 'pendiente' },
          { nombre: 'Soportes_Medicos.pdf', tipo: 'pdf', tamaño: '3.5 MB', estado: 'pendiente' },
        ]
  );

  const pasos: PasoProcesoProps[] = [
    {
      numero: 1,
      titulo: 'Carga y Validación de Datos',
      descripcion:
        'Se cargan y validan todos los documentos de la factura: atenciones, procedimientos, diagnósticos y soportes.',
      icono: <DocumentTextIcon className="h-6 w-6 text-blue-600" />,
      datosUsados: [
        'Factura',
        'Atenciones',
        'Procedimientos',
        'Diagnósticos CIE-10',
        'Autorizaciones',
        'Soportes PDF',
      ],
      estado: pasoActual > 0 ? 'completado' : pasoActual === 0 ? 'en-proceso' : 'pendiente',
      duracion: '0.5s',
      resultados:
        pasoActual > 0
          ? [
              { label: 'Atenciones cargadas', valor: '15', tipo: 'exito' },
              { label: 'Procedimientos cargados', valor: '47', tipo: 'exito' },
              { label: 'Documentos validados', valor: '3/3', tipo: 'exito' },
            ]
          : undefined,
    },
    {
      numero: 2,
      titulo: 'Consulta de Tarifarios',
      descripcion:
        'Se consultan los tarifarios contractuales (SOAT, ISS, Manual Tarifario) y se comparan con las tarifas facturadas por la IPS.',
      icono: <CalculatorIcon className="h-6 w-6 text-purple-600" />,
      datosUsados: [
        'Código CUPS',
        'Tarifario SOAT',
        'Tarifario ISS',
        'Manual Tarifario EPS',
        'Valor Facturado IPS',
      ],
      estado: pasoActual > 1 ? 'completado' : pasoActual === 1 ? 'en-proceso' : 'pendiente',
      duracion: '1.2s',
      resultados:
        pasoActual > 1
          ? [
              { label: 'Tarifas consultadas', valor: '47/47', tipo: 'exito' },
              { label: 'Diferencias detectadas', valor: '8', tipo: 'advertencia' },
            ]
          : undefined,
    },
    {
      numero: 3,
      titulo: 'Validación de Autorizaciones',
      descripcion:
        'Verifica que cada procedimiento cuente con autorización vigente y que los datos coincidan (número, vigencia, cantidad).',
      icono: <ShieldCheckIcon className="h-6 w-6 text-green-600" />,
      datosUsados: [
        'Número de Autorización',
        'Fecha de Vigencia',
        'Cantidad Autorizada',
        'Procedimientos Solicitados',
      ],
      estado: pasoActual > 2 ? 'completado' : pasoActual === 2 ? 'en-proceso' : 'pendiente',
      duracion: '0.8s',
      resultados:
        pasoActual > 2
          ? [
              { label: 'Con autorización', valor: '42', tipo: 'exito' },
              { label: 'Sin autorización', valor: '5', tipo: 'error' },
              { label: 'Autorizaciones vencidas', valor: '2', tipo: 'error' },
            ]
          : undefined,
    },
    {
      numero: 4,
      titulo: 'Detección de Duplicidades',
      descripcion:
        'Identifica procedimientos duplicados para el mismo paciente en la misma fecha, evitando facturación doble.',
      icono: <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />,
      datosUsados: [
        'Código CUPS',
        'Documento Paciente',
        'Fecha del Procedimiento',
        'Número de Autorización',
      ],
      estado: pasoActual > 3 ? 'completado' : pasoActual === 3 ? 'en-proceso' : 'pendiente',
      duracion: '0.4s',
      resultados:
        pasoActual > 3
          ? [
              { label: 'Duplicados encontrados', valor: '3', tipo: 'error' },
              { label: 'Valor duplicado', valor: '$2,450,000', tipo: 'error' },
            ]
          : undefined,
    },
    {
      numero: 5,
      titulo: 'Validación de Pertinencia Médica',
      descripcion:
        'Verifica que los procedimientos sean coherentes con los diagnósticos según guías de práctica clínica y normativa vigente.',
      icono: <CpuChipIcon className="h-6 w-6 text-indigo-600" />,
      datosUsados: [
        'Diagnóstico CIE-10',
        'Código CUPS',
        'Guías de Práctica Clínica',
        'Normativa Vigente',
      ],
      estado: pasoActual > 4 ? 'completado' : pasoActual === 4 ? 'en-proceso' : 'pendiente',
      duracion: '1.5s',
      resultados:
        pasoActual > 4
          ? [
              { label: 'Procedimientos pertinentes', valor: '44', tipo: 'exito' },
              { label: 'Incoherencias detectadas', valor: '3', tipo: 'advertencia' },
            ]
          : undefined,
    },
    {
      numero: 6,
      titulo: 'Generación de Glosas',
      descripcion:
        'Se generan automáticamente las glosas basadas en las inconsistencias encontradas, calculando el valor a glosar.',
      icono: <ChartBarIcon className="h-6 w-6 text-red-600" />,
      datosUsados: [
        'Diferencias de Tarifa',
        'Procedimientos sin Autorización',
        'Duplicidades',
        'Incoherencias Médicas',
      ],
      estado: pasoActual > 5 ? 'completado' : pasoActual === 5 ? 'en-proceso' : 'pendiente',
      duracion: '0.6s',
      resultados:
        pasoActual > 5
          ? [
              { label: 'Glosas generadas', valor: '18', tipo: 'advertencia' },
              { label: 'Total glosado', valor: '$15,750,000', tipo: 'error' },
              { label: 'Valor aceptado', valor: '$84,250,000', tipo: 'exito' },
            ]
          : undefined,
    },
  ];

  useEffect(() => {
    if (enEjecucion && pasoActual < pasos.length) {
      // Marcar documento como procesando en el paso 0
      if (pasoActual === 0) {
        setDocumentosProcesados((prev) =>
          prev.map((doc) => ({ ...doc, estado: 'procesando' as const }))
        );
      }

      // Marcar documentos como procesados después del paso 0
      if (pasoActual === 1) {
        setDocumentosProcesados((prev) =>
          prev.map((doc) => ({ ...doc, estado: 'procesado' as const }))
        );
      }

      const timer = setTimeout(() => {
        setPasoActual((prev) => prev + 1);
      }, 2000); // Simular tiempo de procesamiento

      return () => clearTimeout(timer);
    }

    if (enEjecucion && pasoActual === pasos.length && onFinalizar) {
      // Auditoría completada
      const resultado = {
        totalGlosas: 15750000,
        valorAceptado: 84250000,
        glosas: 18,
      };
      setResultadosAuditoria(resultado);
      onFinalizar(resultado);
    }
  }, [enEjecucion, pasoActual, pasos.length, onFinalizar]);

  return (
    <div className="space-y-6">
      {/* Header del Proceso */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl text-white flex items-center gap-3">
            <CpuChipIcon className="h-8 w-8" />
            Proceso de Auditoría Automática
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/90">
            Sigue el proceso paso a paso para entender cómo funciona el motor de auditoría con
            inteligencia artificial.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1 bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: `${(pasoActual / pasos.length) * 100}%` }}
              ></div>
            </div>
            <span className="font-bold text-white">
              {pasoActual}/{pasos.length} pasos
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Documentos Cargados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            Documentos Cargados ({documentosProcesados.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {documentosProcesados.map((doc, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  doc.estado === 'procesado'
                    ? 'bg-green-50 border-green-500'
                    : doc.estado === 'procesando'
                    ? 'bg-blue-50 border-blue-500 animate-pulse'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {doc.tipo === 'excel' ? (
                    <TableCellsIcon className="h-8 w-8 text-green-600" />
                  ) : (
                    <DocumentTextIcon className="h-8 w-8 text-red-600" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{doc.nombre}</p>
                    <p className="text-sm text-gray-600">
                      {doc.tipo === 'excel' ? 'Excel RIPS/Factura' : 'PDF Soportes'} • {doc.tamaño}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.estado === 'procesado' && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Procesado
                    </Badge>
                  )}
                  {doc.estado === 'procesando' && (
                    <Badge className="bg-blue-100 text-blue-800">
                      <CpuChipIcon className="h-4 w-4 mr-1 animate-spin" />
                      Procesando...
                    </Badge>
                  )}
                  {doc.estado === 'pendiente' && (
                    <Badge className="bg-gray-100 text-gray-800">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      Pendiente
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pasos */}
      <div className="space-y-1">
        {pasos.map((paso, idx) => (
          <PasoProceso key={idx} {...paso} />
        ))}
      </div>

      {/* Resumen Final */}
      {pasoActual === pasos.length && resultadosAuditoria && (
        <Card className="border-2 border-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center gap-2">
              <CheckCircleIcon className="h-6 w-6" />
              Auditoría Completada Exitosamente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Glosas Generadas</p>
                <p className="text-2xl font-bold text-orange-600">{resultadosAuditoria.glosas}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Glosado</p>
                <p className="text-2xl font-bold text-red-600">
                  ${resultadosAuditoria.totalGlosas.toLocaleString('es-CO')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Valor Aceptado</p>
                <p className="text-2xl font-bold text-green-600">
                  ${resultadosAuditoria.valorAceptado.toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
