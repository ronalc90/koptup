'use client';

import { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { auditoriaAPI } from './api';
import toast from 'react-hot-toast';
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

interface DatoExtraido {
  campo: string;
  valor: string;
  origen: string; // De qué archivo sale
  ubicacion: string; // Qué sección/hoja del archivo
  explicacion: string; // Por qué se necesita este dato
}

interface PasoProcesoProps {
  numero: number;
  titulo: string;
  descripcion: string;
  icono: React.ReactNode;
  datosUsados: string[];
  estado: 'pendiente' | 'en-proceso' | 'completado';
  duracion?: string;
  resultados?: { label: string; valor: string; tipo?: 'exito' | 'advertencia' | 'error' }[];
  datosExtraidos?: DatoExtraido[];
  procesoDetallado?: string[]; // Pasos detallados de qué hace
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
  datosExtraidos,
  procesoDetallado,
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
              {/* Datos Extraídos de Archivos */}
              {datosExtraidos && datosExtraidos.length > 0 && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                    Datos Extraídos de los Archivos
                  </h4>
                  <div className="space-y-3">
                    {datosExtraidos.map((dato, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-3 border border-blue-300">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900">{dato.campo}:</span>
                              <span className="text-blue-700 font-bold">{dato.valor}</span>
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div className="flex items-center gap-1">
                                <TableCellsIcon className="h-3 w-3" />
                                <span className="font-medium">Origen:</span>
                                <span className="text-blue-600">{dato.origen}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <ArrowRightIcon className="h-3 w-3" />
                                <span className="font-medium">Ubicación:</span>
                                <span>{dato.ubicacion}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs bg-yellow-50 border-l-2 border-yellow-400 p-2 rounded">
                          <span className="font-medium text-yellow-800">💡 Por qué:</span>
                          <span className="text-yellow-900 ml-1">{dato.explicacion}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proceso Detallado */}
              {procesoDetallado && procesoDetallado.length > 0 && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CpuChipIcon className="h-5 w-5 text-purple-600" />
                    ¿Qué hace este paso?
                  </h4>
                  <ol className="space-y-2 list-decimal list-inside">
                    {procesoDetallado.map((paso, idx) => (
                      <li key={idx} className="text-sm text-gray-700 bg-white p-2 rounded border border-purple-200">
                        {paso}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

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
  usarBackend?: boolean; // Nueva prop para controlar si usa backend real o datos estáticos
}

export default function ProcesoAuditoriaVisual({
  facturaId,
  enEjecucion = false,
  onFinalizar,
  documentos = [],
  usarBackend = false, // Por defecto usa datos estáticos para compatibilidad
}: ProcesoAuditoriaVisualProps) {
  const [pasoActual, setPasoActual] = useState(0);
  const [resultadosAuditoria, setResultadosAuditoria] = useState<any>(null);
  const [sesionId, setSesionId] = useState<string | null>(null);
  const [pasosBackend, setPasosBackend] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentosProcesados, setDocumentosProcesados] = useState<DocumentoSubido[]>(
    documentos.length > 0
      ? documentos
      : [
          { nombre: 'RIPS_Factura_2024.xlsx', tipo: 'excel', tamaño: '245 KB', estado: 'pendiente' },
          { nombre: 'Autorizaciones_Pacientes.pdf', tipo: 'pdf', tamaño: '1.2 MB', estado: 'pendiente' },
          { nombre: 'Soportes_Medicos.pdf', tipo: 'pdf', tamaño: '3.5 MB', estado: 'pendiente' },
        ]
  );

  // Definir pasos estáticos (estructura base)
  const pasosEstaticos: PasoProcesoProps[] = [
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
      datosExtraidos: pasoActual > 0 ? [
        {
          campo: 'Número de Factura',
          valor: 'FAC-2024-001',
          origen: 'RIPS_Factura_2024.xlsx',
          ubicacion: 'Hoja "AF" (Factura), Columna "num_fac", Fila 2',
          explicacion: 'Identificador único de la factura para rastreo y auditoría',
        },
        {
          campo: 'NIT IPS',
          valor: '900.123.456-7',
          origen: 'RIPS_Factura_2024.xlsx',
          ubicacion: 'Hoja "AF", Columna "cod_ips", Fila 2',
          explicacion: 'Identifica la IPS que factura para validar contratos y tarifas',
        },
        {
          campo: 'Código EPS',
          valor: 'EPS001',
          origen: 'RIPS_Factura_2024.xlsx',
          ubicacion: 'Hoja "AF", Columna "cod_eps", Fila 2',
          explicacion: 'Identifica la EPS pagadora para aplicar el tarifario correcto',
        },
        {
          campo: 'Documento Paciente',
          valor: '1234567890',
          origen: 'RIPS_Factura_2024.xlsx',
          ubicacion: 'Hoja "US" (Usuarios), Columna "num_doc", Fila 3',
          explicacion: 'Identifica al paciente para validar autorización y duplicidades',
        },
        {
          campo: 'Código CUPS',
          valor: '890201',
          origen: 'RIPS_Factura_2024.xlsx',
          ubicacion: 'Hoja "AP" (Procedimientos), Columna "cod_cups", Fila 5',
          explicacion: 'Código del procedimiento para consultar tarifario y pertinencia',
        },
        {
          campo: 'Valor Facturado',
          valor: '$250.000',
          origen: 'RIPS_Factura_2024.xlsx',
          ubicacion: 'Hoja "AP", Columna "valor_total", Fila 5',
          explicacion: 'Valor cobrado por la IPS a comparar contra tarifario contractual',
        },
        {
          campo: 'Número de Autorización',
          valor: 'AUT-20240115-001',
          origen: 'Autorizaciones_Pacientes.pdf',
          ubicacion: 'Página 1, Campo "N° Autorización"',
          explicacion: 'Valida que el procedimiento esté autorizado por la EPS',
        },
        {
          campo: 'Diagnóstico CIE-10',
          valor: 'J18.9',
          origen: 'RIPS_Factura_2024.xlsx',
          ubicacion: 'Hoja "AC" (Consultas), Columna "diag_prin", Fila 4',
          explicacion: 'Diagnóstico principal para validar pertinencia del procedimiento',
        },
      ] : undefined,
      procesoDetallado: pasoActual > 0 ? [
        'Se lee el archivo Excel RIPS en todas sus hojas (AF=Factura, US=Usuarios, AC=Consultas, AP=Procedimientos)',
        'Se extraen los datos principales: identificadores, códigos, valores y fechas',
        'Se leen los archivos PDF de autorizaciones usando OCR para extraer números de autorización',
        'Se valida que cada dato requerido esté presente y tenga el formato correcto',
        'Se cruzan los datos entre hojas para asegurar coherencia (ej: paciente en US debe existir en AP)',
        'Se genera un registro estructurado con todos los datos listos para las validaciones',
      ] : undefined,
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
      datosExtraidos: pasoActual > 1 ? [
        {
          campo: 'Código CUPS',
          valor: '890201 - Consulta Medicina General',
          origen: 'Del paso anterior (RIPS_Factura_2024.xlsx)',
          ubicacion: 'Previamente extraído de Hoja "AP", Fila 5',
          explicacion: 'Se usa para buscar el valor en el tarifario contractual',
        },
        {
          campo: 'Tarifa Contrato EPS',
          valor: '$220.000',
          origen: 'Base de Datos - Tarifario EPS001',
          ubicacion: 'Tabla "tarifarios", Campo "valor_contrato" para CUPS 890201',
          explicacion: 'Valor máximo que la EPS debe pagar según contrato con la IPS',
        },
        {
          campo: 'Valor Facturado IPS',
          valor: '$250.000',
          origen: 'Del paso anterior (RIPS_Factura_2024.xlsx)',
          ubicacion: 'Previamente extraído de Hoja "AP", Fila 5',
          explicacion: 'Valor que la IPS está cobrando por el procedimiento',
        },
        {
          campo: 'Diferencia (Posible Glosa)',
          valor: '$30.000 (12% de sobrecosto)',
          origen: 'Calculado: Valor Facturado - Tarifa Contrato',
          ubicacion: 'Cálculo: $250.000 - $220.000 = $30.000',
          explicacion: 'La IPS cobra más de lo permitido, se marca para posible glosa',
        },
      ] : undefined,
      procesoDetallado: pasoActual > 1 ? [
        'Para cada procedimiento extraído (código CUPS), se consulta en la base de datos de tarifarios',
        'Se identifica el contrato vigente entre la IPS y la EPS en la fecha de facturación',
        'Se obtiene el valor contractual para ese código CUPS específico',
        'Se compara el valor facturado vs el valor del contrato',
        'Si hay diferencia, se calcula el porcentaje de sobrecosto o descuento',
        'Se marca para glosa si el valor facturado excede el contractual en más del 5%',
      ] : undefined,
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
      titulo: 'Validación de Medicamentos SISMED - Nueva EPS',
      descripcion:
        'Valida precios de medicamentos contra tarifario SISMED y específicamente contra precios negociados con Nueva EPS. Verifica PBS, autorizaciones CTC y cantidades prescritas.',
      icono: <ShieldCheckIcon className="h-6 w-6 text-pink-600" />,
      datosUsados: [
        'Nombre Medicamento (DCI)',
        'Cantidad Prescrita',
        'Precio Facturado',
        'Precio SISMED',
        'Precio Nueva EPS',
        'Estado PBS',
        'Autorización CTC',
      ],
      estado: pasoActual > 2 ? 'completado' : pasoActual === 2 ? 'en-proceso' : 'pendiente',
      duracion: '1.2s',
      datosExtraidos: pasoActual > 2 ? [
        {
          campo: 'Medicamento',
          valor: 'Amoxicilina 500mg x 21 tabletas',
          origen: 'RIPS_Factura_2024.xlsx',
          ubicacion: 'Hoja "AM" (Medicamentos), Columna "medicamento", Fila 5',
          explicacion: 'Antibiótico prescrito para tratamiento de infección respiratoria',
        },
        {
          campo: 'Precio Facturado',
          valor: '$11,340 ($540/tableta)',
          origen: 'RIPS_Factura_2024.xlsx',
          ubicacion: 'Hoja "AM", Columna "valor_total", Fila 5',
          explicacion: 'Precio total cobrado por la IPS por el medicamento',
        },
        {
          campo: 'Precio SISMED Máximo',
          valor: '$450/tableta = $9,450 total',
          origen: 'Base de Datos SISMED',
          ubicacion: 'Tabla "medicamentos_sismed", medicamento_id="AMX500"',
          explicacion: 'Precio máximo regulado por el gobierno para este medicamento',
        },
        {
          campo: 'Precio Nueva EPS',
          valor: '$390/tableta = $8,190 total',
          origen: 'Contrato Nueva EPS-IPS 2024',
          ubicacion: 'Tabla "tarifario_medicamentos_nueva_eps", medicamento_id="AMX500"',
          explicacion: 'Precio negociado entre Nueva EPS y proveedores (13% menor que SISMED)',
        },
        {
          campo: 'Glosa por Sobrecosto',
          valor: '$3,150 (Facturado $11,340 - Nueva EPS $8,190)',
          origen: 'Calculado por el sistema',
          ubicacion: 'Se genera glosa automática',
          explicacion: 'La IPS facturó $540/tab cuando Nueva EPS solo autoriza $390/tab',
        },
        {
          campo: 'Medicamento Alto Costo',
          valor: 'Enoxaparina 40mg x 7 jeringas',
          origen: 'RIPS_Factura_2024.xlsx',
          ubicacion: 'Hoja "AM", Fila 12',
          explicacion: 'Anticoagulante para prevención de trombosis post-quirúrgica',
        },
        {
          campo: 'Autorización CTC',
          valor: 'NO REQUERIDA (PBS: SÍ)',
          origen: 'Base de Datos PBS',
          ubicacion: 'Tabla "pbs_medicamentos", medicamento_id="ENOX40"',
          explicacion: 'Este medicamento está en el PBS, no requiere autorización especial',
        },
      ] : undefined,
      procesoDetallado: pasoActual > 2 ? [
        'Se extraen todos los medicamentos del RIPS hoja "AM" (Medicamentos)',
        'Para cada medicamento se identifica el nombre genérico (DCI) y presentación',
        'Se consulta el precio máximo SISMED en la base de datos del gobierno',
        'Se consulta el precio específico negociado con Nueva EPS',
        'Se compara: Precio Facturado vs Precio Nueva EPS (prioritario) vs Precio SISMED (máximo)',
        'Si Precio Facturado > Precio Nueva EPS: Se calcula glosa por diferencia',
        'Si Precio Facturado > Precio SISMED: Se marca como glosa automática 100%',
        'Se verifica si el medicamento está en PBS (Plan de Beneficios en Salud)',
        'Si NO está en PBS, se verifica que exista autorización del CTC',
        'Se valida que la cantidad prescrita no exceda la cantidad autorizada',
        'Medicamentos de alto costo (>$1,000,000) requieren CTC obligatorio',
      ] : undefined,
      resultados:
        pasoActual > 2
          ? [
              { label: 'Medicamentos validados', valor: '23/23', tipo: 'exito' },
              { label: 'Sobrecosto vs Nueva EPS', valor: '5 medicamentos', tipo: 'advertencia' },
              { label: 'Sobrecosto vs SISMED', valor: '2 medicamentos', tipo: 'error' },
              { label: 'Sin autorización CTC', valor: '1 medicamento', tipo: 'error' },
              { label: 'Total glosas medicamentos', valor: '$4,850,000', tipo: 'error' },
            ]
          : undefined,
    },
    {
      numero: 4,
      titulo: 'Validación de Autorizaciones',
      descripcion:
        'Verifica que cada procedimiento y medicamento cuente con autorización vigente y que los datos coincidan (número, vigencia, cantidad).',
      icono: <ShieldCheckIcon className="h-6 w-6 text-green-600" />,
      datosUsados: [
        'Número de Autorización',
        'Fecha de Vigencia',
        'Cantidad Autorizada',
        'Procedimientos Solicitados',
        'Medicamentos Autorizados',
      ],
      estado: pasoActual > 3 ? 'completado' : pasoActual === 3 ? 'en-proceso' : 'pendiente',
      duracion: '0.8s',
      resultados:
        pasoActual > 3
          ? [
              { label: 'Procedimientos con autorización', valor: '42/47', tipo: 'exito' },
              { label: 'Procedimientos sin autorización', valor: '5', tipo: 'error' },
              { label: 'Medicamentos con autorización', valor: '22/23', tipo: 'exito' },
              { label: 'Medicamentos sin autorización', valor: '1', tipo: 'error' },
              { label: 'Autorizaciones vencidas', valor: '2', tipo: 'error' },
            ]
          : undefined,
    },
    {
      numero: 5,
      titulo: 'Detección de Duplicidades',
      descripcion:
        'Identifica procedimientos y medicamentos duplicados para el mismo paciente en la misma fecha, evitando facturación doble.',
      icono: <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />,
      datosUsados: [
        'Código CUPS',
        'Medicamentos',
        'Documento Paciente',
        'Fecha del Procedimiento',
        'Número de Autorización',
      ],
      estado: pasoActual > 4 ? 'completado' : pasoActual === 4 ? 'en-proceso' : 'pendiente',
      duracion: '0.4s',
      resultados:
        pasoActual > 4
          ? [
              { label: 'Duplicados CUPS encontrados', valor: '3', tipo: 'error' },
              { label: 'Duplicados medicamentos', valor: '1', tipo: 'error' },
              { label: 'Valor duplicado total', valor: '$2,850,000', tipo: 'error' },
            ]
          : undefined,
    },
    {
      numero: 6,
      titulo: 'Validación de Pertinencia Médica',
      descripcion:
        'Verifica que los procedimientos y medicamentos sean coherentes con los diagnósticos según guías de práctica clínica y normativa vigente.',
      icono: <CpuChipIcon className="h-6 w-6 text-indigo-600" />,
      datosUsados: [
        'Diagnóstico CIE-10',
        'Código CUPS',
        'Medicamentos Prescritos',
        'Guías de Práctica Clínica',
        'Normativa Vigente',
      ],
      estado: pasoActual > 5 ? 'completado' : pasoActual === 5 ? 'en-proceso' : 'pendiente',
      duracion: '1.5s',
      resultados:
        pasoActual > 5
          ? [
              { label: 'Procedimientos pertinentes', valor: '44/47', tipo: 'exito' },
              { label: 'Medicamentos pertinentes', valor: '21/23', tipo: 'exito' },
              { label: 'Incoherencias detectadas', valor: '5', tipo: 'advertencia' },
            ]
          : undefined,
    },
    {
      numero: 7,
      titulo: 'Generación de Glosas y Excel Final',
      descripcion:
        'Se generan automáticamente las glosas basadas en todas las inconsistencias encontradas (tarifas, medicamentos, autorizaciones, pertinencia), y se construye el archivo Excel con el reporte completo.',
      icono: <ChartBarIcon className="h-6 w-6 text-red-600" />,
      datosUsados: [
        'Diferencias de Tarifa CUPS',
        'Diferencias de Tarifa Medicamentos',
        'Procedimientos sin Autorización',
        'Medicamentos sin Autorización',
        'Duplicidades',
        'Incoherencias Médicas',
      ],
      estado: pasoActual > 6 ? 'completado' : pasoActual === 6 ? 'en-proceso' : 'pendiente',
      duracion: '0.6s',
      datosExtraidos: pasoActual > 5 ? [
        {
          campo: 'Glosa #1 - Sobrecosto CUPS',
          valor: 'CUPS 890201: $30.000',
          origen: 'Resultado del Paso 2 (Consulta de Tarifarios)',
          ubicacion: 'Se escribe en Excel → Hoja "Glosas CUPS", Fila 2',
          explicacion: 'La IPS facturó $250.000 pero el contrato permite máximo $220.000',
        },
        {
          campo: 'Glosa #2 - Medicamento Amoxicilina',
          valor: 'Amoxicilina 500mg: $3.150',
          origen: 'Resultado del Paso 3 (Validación Medicamentos SISMED - Nueva EPS)',
          ubicacion: 'Se escribe en Excel → Hoja "Glosas Medicamentos", Fila 2',
          explicacion: 'IPS facturó $540/tab vs $390/tab Nueva EPS (21 tabs = $3.150 de glosa)',
        },
        {
          campo: 'Glosa #3 - Medicamento Sin CTC',
          valor: 'Rituximab 500mg: $4.200.000',
          origen: 'Resultado del Paso 3 (Validación Medicamentos)',
          ubicacion: 'Se escribe en Excel → Hoja "Glosas Medicamentos", Fila 3',
          explicacion: 'Medicamento de alto costo NO PBS sin autorización CTC requerida',
        },
        {
          campo: 'Glosa #4 - Sin Autorización',
          valor: 'CUPS 890301: $450.000',
          origen: 'Resultado del Paso 4 (Validación de Autorizaciones)',
          ubicacion: 'Se escribe en Excel → Hoja "Glosas CUPS", Fila 3',
          explicacion: 'Procedimiento no tiene autorización vigente de la EPS',
        },
        {
          campo: 'Glosa #5 - Duplicidad',
          valor: 'CUPS 890201 (2da vez mismo día): $250.000',
          origen: 'Resultado del Paso 5 (Detección de Duplicidades)',
          ubicacion: 'Se escribe en Excel → Hoja "Glosas CUPS", Fila 4',
          explicacion: 'Mismo procedimiento facturado 2 veces para el mismo paciente el mismo día',
        },
        {
          campo: 'Valor Total Facturado',
          valor: '$100.000.000 (CUPS: $65M + Medicamentos: $35M)',
          origen: 'Suma de todos los procedimientos y medicamentos (Paso 1)',
          ubicacion: 'Se escribe en Excel → Hoja "Resumen", Celda B2',
          explicacion: 'Suma total de todos los procedimientos y medicamentos de la factura',
        },
        {
          campo: 'Total Glosas',
          valor: '$20.600.000 (CUPS: $15.75M + Medicamentos: $4.85M)',
          origen: 'Suma de todas las glosas generadas (CUPS + Medicamentos)',
          ubicacion: 'Se escribe en Excel → Hoja "Resumen", Celda B3',
          explicacion: 'Suma de todos los valores objetados (procedimientos y medicamentos)',
        },
        {
          campo: 'Valor Aceptado',
          valor: '$79.400.000',
          origen: 'Calculado: Total Facturado - Total Glosas',
          ubicacion: 'Se escribe en Excel → Hoja "Resumen", Celda B4',
          explicacion: 'Valor que Nueva EPS debe pagar después de aplicar las glosas',
        },
      ] : undefined,
      procesoDetallado: pasoActual > 5 ? [
        'Se recopilan todas las inconsistencias detectadas en los pasos 2-6',
        'Para cada inconsistencia se crea una glosa con: tipo, código, descripción, valor y justificación',
        'GLOSAS CUPS: Sobrecostos tarifarios, sin autorizaciones, duplicidades, incoherencias médicas',
        'GLOSAS MEDICAMENTOS: Sobrecostos vs Nueva EPS, sobrecostos vs SISMED, sin autorizaciones CTC, NO PBS',
        'Se crea un nuevo archivo Excel con múltiples hojas: "Resumen", "Glosas CUPS", "Glosas Medicamentos", "Detalle Procedimientos", "Detalle Medicamentos", "Facturas Originales"',
        'Hoja "Resumen": Se escriben totales por categoría (CUPS vs Medicamentos), estadísticas y gráficos de la auditoría',
        'Hoja "Glosas CUPS": Todas las glosas de procedimientos CUPS con tarifas Nueva EPS',
        'Hoja "Glosas Medicamentos": Todas las glosas de medicamentos con precios Nueva EPS y SISMED',
        'Hoja "Detalle Procedimientos": RIPS original + columnas de validación (tarifa Nueva EPS, diferencia, estado)',
        'Hoja "Detalle Medicamentos": Medicamentos RIPS + validación (precio Nueva EPS, precio SISMED, PBS, CTC)',
        'Hoja "Facturas Originales": Copia de los datos originales del RIPS sin modificaciones',
        'Se aplican formatos, colores y filtros para facilitar la lectura (rojo=glosa, verde=aprobado, amarillo=advertencia)',
        'Se generan gráficos automáticos: distribución de glosas por tipo, CUPS vs Medicamentos, valor glosado vs aceptado',
        'Se guarda el archivo con nombre: "Auditoria_NuevaEPS_[NumFactura]_[Fecha].xlsx"',
      ] : undefined,
      resultados:
        pasoActual > 5
          ? [
              { label: 'Glosas CUPS generadas', valor: '13', tipo: 'advertencia' },
              { label: 'Glosas Medicamentos generadas', valor: '5', tipo: 'advertencia' },
              { label: 'Total glosas', valor: '18', tipo: 'advertencia' },
              { label: 'Glosado CUPS', valor: '$15,750,000', tipo: 'error' },
              { label: 'Glosado Medicamentos', valor: '$4,850,000', tipo: 'error' },
              { label: 'Total glosado', valor: '$20,600,000', tipo: 'error' },
              { label: 'Valor aceptado Nueva EPS', valor: '$79,400,000', tipo: 'exito' },
            ]
          : undefined,
    },
  ];

  // Iconos para cada paso
  const iconosPorPaso: { [key: number]: React.ReactNode } = {
    1: <DocumentTextIcon className="h-6 w-6 text-blue-600" />,
    2: <CalculatorIcon className="h-6 w-6 text-purple-600" />,
    3: <ShieldCheckIcon className="h-6 w-6 text-pink-600" />,
    4: <ShieldCheckIcon className="h-6 w-6 text-green-600" />,
    5: <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />,
    6: <CpuChipIcon className="h-6 w-6 text-indigo-600" />,
    7: <ChartBarIcon className="h-6 w-6 text-red-600" />,
  };

  // Fusionar pasos del backend con la estructura estática
  const pasos: PasoProcesoProps[] = usarBackend && pasosBackend.length > 0
    ? pasosBackend.map((pasoBackend: any, idx: number) => {
        // Usar el paso estático como base
        const pasoEstatico = pasosEstaticos[idx] || {};

        // Fusionar con datos del backend
        return {
          ...pasoEstatico,
          numero: pasoBackend.numero,
          titulo: pasoBackend.titulo || pasoEstatico.titulo,
          descripcion: pasoBackend.descripcion || pasoEstatico.descripcion,
          estado: pasoBackend.estado,
          icono: iconosPorPaso[pasoBackend.numero] || pasoEstatico.icono,
          datosUsados: pasoBackend.datosUsados || pasoEstatico.datosUsados,
          datosExtraidos: pasoBackend.datosExtraidos,
          procesoDetallado: pasoBackend.procesoDetallado,
          resultados: pasoBackend.resultados,
          duracion: pasoBackend.duracion ? `${(pasoBackend.duracion / 1000).toFixed(1)}s` : undefined,
        };
      })
    : pasosEstaticos;

  // Iniciar sesión cuando se monta el componente con backend
  useEffect(() => {
    const iniciarSesion = async () => {
      if (usarBackend && facturaId && enEjecucion && !sesionId) {
        try {
          setLoading(true);
          const response = await auditoriaAPI.iniciarAuditoriaPasoPaso(facturaId);
          setSesionId(response.data._id);
          setError(null);
        } catch (err: any) {
          console.error('Error iniciando sesión:', err);
          setError(err.message);
          toast.error('Error al iniciar auditoría paso a paso');
        } finally {
          setLoading(false);
        }
      }
    };

    iniciarSesion();
  }, [usarBackend, facturaId, enEjecucion, sesionId]);

  const avanzarPaso = async () => {
    if (usarBackend && sesionId) {
      // Modo con backend real
      try {
        setLoading(true);

        // Marcar documentos como procesando en el primer paso
        if (pasoActual === 0) {
          setDocumentosProcesados((prev) =>
            prev.map((doc) => ({ ...doc, estado: 'procesando' as const }))
          );
        }

        // Llamar al backend para avanzar el paso
        const response = await auditoriaAPI.avanzarPaso(sesionId);
        const sesionData = response.data;

        // Actualizar el paso actual basado en la respuesta del servidor
        setPasoActual(sesionData.pasoActual);

        // Actualizar los pasos del backend para mostrar datos reales
        setPasosBackend(sesionData.pasos || []);

        // Marcar documentos como procesados después del primer paso
        if (sesionData.pasoActual >= 1) {
          setDocumentosProcesados((prev) =>
            prev.map((doc) => ({ ...doc, estado: 'procesado' as const }))
          );
        }

        // Si la auditoría está completada, guardar resultado final
        if (sesionData.estado === 'completada' && sesionData.resultadoFinal) {
          const resultado = {
            totalGlosas: sesionData.resultadoFinal.totalGlosas,
            valorAceptado: sesionData.resultadoFinal.valorAceptado,
            glosas: sesionData.resultadoFinal.cantidadGlosas,
          };
          setResultadosAuditoria(resultado);
          if (onFinalizar) {
            onFinalizar(resultado);
          }
        }

        setError(null);
      } catch (err: any) {
        console.error('Error avanzando paso:', err);
        setError(err.message);
        toast.error('Error al avanzar paso');
      } finally {
        setLoading(false);
      }
    } else {
      // Modo estático original (para demos)
      if (pasoActual < pasos.length) {
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

        setPasoActual((prev) => prev + 1);
      }

      if (pasoActual === pasos.length - 1) {
        // Auditoría completada
        const resultado = {
          totalGlosas: 20600000, // 15.75M CUPS + 4.85M Medicamentos
          valorAceptado: 79400000, // 100M - 20.6M
          glosas: 18, // 13 CUPS + 5 Medicamentos
        };
        setResultadosAuditoria(resultado);
        if (onFinalizar) {
          onFinalizar(resultado);
        }
      }
    }
  };

  useEffect(() => {
    // Ya no avanza automáticamente, solo prepara el estado inicial
    if (enEjecucion && pasoActual === 0) {
      setDocumentosProcesados((prev) =>
        prev.map((doc) => ({ ...doc, estado: 'pendiente' as const }))
      );
    }
  }, [enEjecucion]);

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

      {/* Botón Siguiente - Solo visible cuando hay un paso en proceso o completado y no ha terminado */}
      {enEjecucion && pasoActual < pasos.length && (
        <div className="flex justify-center">
          <button
            onClick={avanzarPaso}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105 flex items-center gap-3 text-lg"
          >
            {pasoActual === 0 ? 'Iniciar Auditoría' : 'Continuar al Siguiente Paso'}
            <ArrowRightIcon className="h-6 w-6" />
          </button>
        </div>
      )}

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
