/**
 * Tipos de datos para el Sistema Experto de Auditoría de Cuentas Médicas
 *
 * Este archivo define la estructura completa de datos para generar el Excel
 * con las 5 hojas requeridas.
 */

// ============================================================================
// HOJA 1 - RADICACIÓN / FACTURA GENERAL
// ============================================================================

export interface RadicacionFacturaGeneral {
  nroRadicacion: string;
  fechaRadicacion: Date;
  tipoCuenta: 'Servicios' | 'Medicamentos' | 'Insumos' | 'Mixto';
  auditoriaEnfermeria: 'Auditoría' | 'Enfermería' | 'Mixto';
  regimen: 'Contributivo' | 'Subsidiado' | 'Especial';
  producto: 'POS' | 'PBS' | 'NO_PBS' | 'Complementario';
  convenio: string; // Tipo de convenio contractual
  ips: string; // Nombre de la IPS
  nroFactura: string;
  fechaFactura: Date;
  nroAtenciones: number;
  valorBrutoFactura: number;
  valorIVA: number;
  valorNetoFactura: number;
  observacionFactura: string;
  estadoFactura: 'EST' | 'LIQ' | 'DEV' | 'PAG' | 'ANU';
  regional: string;
  tipoDocumentoIPS: string;
  radicacionPIC?: string; // Si aplica a PIC
}

// ============================================================================
// HOJA 2 - DETALLE DE LA FACTURA
// ============================================================================

export interface DetalleFactura {
  lineaConsecutivo: number;
  autoriza?: string; // Número de autorización
  tipoDoc: string; // CC, TI, RC, etc.
  identificacion: string; // Documento del paciente
  nombre: string; // Nombre del paciente
  fechaInicio: Date;
  fechaFin: Date;
  regimen: 'Contributivo' | 'Subsidiado' | 'Especial';
  ipsPrimaria?: string; // IPS primaria del usuario
  documentoSoporte?: string; // Historia clínica, etc.
  valorIPS: number;
  copagoIPS: number;
  cmoIPS: number; // Cuota moderadora
  descuento: number;
  totales: number; // Valor neto
  estado: 'LIQ' | 'PAG' | 'DEV' | 'ANU';
  usuario?: string; // Usuario que gestionó
  plan: 'POS' | 'PBS' | 'Complementario' | 'NO_PBS';
}

// ============================================================================
// HOJA 3 - REGISTRO DE ATENCIONES
// ============================================================================

export interface RegistroAtencion {
  nroRadicacion: string;
  nroAtencion: string;
  autorizacion?: string;
  pai?: string; // Código PAI si aplica
  formaPago: 'NORMAL' | 'CAPITADO' | 'EVENTO' | 'OTRO';
  observacionAutorizacion?: string;
  diagnostico: string; // Código CIE-10
  dxNombre: string;
  dxClase: 'Ingreso' | 'Egreso' | 'Principal' | 'Secundario' | 'Relacionado';
}

// ============================================================================
// HOJA 4 - PROCEDIMIENTOS POR ATENCIÓN
// ============================================================================

export interface ProcedimientoAtencion {
  nroRadicacion: string;
  nroAtencion: string;
  codigoManual: 'ISS2001' | 'ISS2004' | 'SOAT' | 'OTRO'; // Manual Tarifario
  codigoProcedimiento: string; // Código CUPS
  nombreProcedimiento: string;
  mapiiss?: string; // Código MAPIISS si aplica
  cantidad: number;
  valorIPS: number; // Valor que cobra la IPS
  valorEPS: number; // Valor que reconoce la EPS (contratado)
  valorAPagar: number; // Valor final
  valorNotaCredito: number; // Ajustes posteriores
  gestion?: string; // Campo de auditoría
  glosas: boolean; // Tiene glosas?
  valorGlosaAdmisiva: number; // Glosa aceptada por IPS
  valorGlosaAuditoria: number; // Glosa por auditoría
  estado: 'AUT' | 'UNILA' | 'GLOS' | 'AUDI';
  tipoLiquidacion: 'UNIL' | 'BILA' | 'OTRO';
  valorContratadoEPS: number;
  subservicio?: string; // Clasificación interna
}

// ============================================================================
// HOJA 5 - GLOSAS
// ============================================================================

export interface GlosaDetalle {
  codigoDevolucion: string; // Código de glosa (ej: "202")
  cantidadGlosada: number;
  vrUnitGlosado: number;
  valorTotalDevolucion: number;
  observacionesGlosa: string;
  origen: 'Facturación' | 'Auditoría' | 'Clínica' | 'Administrativa';
  valorGlosaFinal: number;

  // Campos adicionales para trazabilidad
  nroRadicacion?: string;
  nroAtencion?: string;
  codigoProcedimiento?: string;
  nombreProcedimiento?: string;
}

// ============================================================================
// CÓDIGOS DE GLOSA DEL SISTEMA EXPERTO
// ============================================================================

export enum CodigoGlosa {
  // FACTURACIÓN (100-199)
  FALTA_AUTORIZACION = '101',
  DIFERENCIA_TARIFA = '102',
  SERVICIO_NO_CUBIERTO = '103',
  VALOR_SUPERIOR_AUTORIZADO = '104',

  // ADMINISTRATIVA (200-299)
  CUPS_INVALIDO = '201',
  AUTORIZACION_INCOMPLETA = '202',
  DOCUMENTACION_INCOMPLETA = '203',
  DATOS_PACIENTE_INCOMPLETOS = '204',
  AUTORIZACION_VENCIDA = '205',

  // AUDITORÍA CLÍNICA (300-399)
  INCOHERENCIA_DIAGNOSTICO = '301',
  PROCEDIMIENTO_NO_JUSTIFICADO = '302',
  DUPLICIDAD_SERVICIOS = '303',
  COHERENCIA_CLINICA = '304',

  // TARIFAS (400-499)
  VALOR_SUPERIOR_CONTRATADO = '401',
  CANTIDAD_EXCEDE_AUTORIZADO = '402',
  TARIFA_NO_ENCONTRADA = '403',
}

export const GLOSAS_DESCRIPCION: Record<CodigoGlosa, string> = {
  [CodigoGlosa.FALTA_AUTORIZACION]: 'Falta autorización del servicio',
  [CodigoGlosa.DIFERENCIA_TARIFA]: 'Diferencia entre tarifa cobrada y contratada',
  [CodigoGlosa.SERVICIO_NO_CUBIERTO]: 'Servicio no cubierto por el convenio',
  [CodigoGlosa.VALOR_SUPERIOR_AUTORIZADO]: 'Valor cobrado superior al autorizado',

  [CodigoGlosa.CUPS_INVALIDO]: 'Código CUPS inválido o no existe en catálogo',
  [CodigoGlosa.AUTORIZACION_INCOMPLETA]: 'Autorización incompleta o con datos faltantes',
  [CodigoGlosa.DOCUMENTACION_INCOMPLETA]: 'Documentación de soporte incompleta',
  [CodigoGlosa.DATOS_PACIENTE_INCOMPLETOS]: 'Datos del paciente incompletos',
  [CodigoGlosa.AUTORIZACION_VENCIDA]: 'Autorización vencida',

  [CodigoGlosa.INCOHERENCIA_DIAGNOSTICO]: 'Incoherencia entre diagnóstico y procedimiento',
  [CodigoGlosa.PROCEDIMIENTO_NO_JUSTIFICADO]: 'Procedimiento no justificado clínicamente',
  [CodigoGlosa.DUPLICIDAD_SERVICIOS]: 'Duplicidad de servicios en la misma atención',
  [CodigoGlosa.COHERENCIA_CLINICA]: 'Falta de coherencia clínica general',

  [CodigoGlosa.VALOR_SUPERIOR_CONTRATADO]: 'Valor cobrado superior al contratado',
  [CodigoGlosa.CANTIDAD_EXCEDE_AUTORIZADO]: 'Cantidad excede lo autorizado',
  [CodigoGlosa.TARIFA_NO_ENCONTRADA]: 'Tarifa no encontrada en manual tarifario',
};

// ============================================================================
// RESULTADO COMPLETO DEL SISTEMA EXPERTO
// ============================================================================

export interface ResultadoSistemaExperto {
  // Metadatos del procesamiento
  metadata: {
    fechaProcesamiento: Date;
    tiempoMs: number;
    version: string;
    itemsValidados: number;
    itemsConGlosas: number;
    advertencias: string[];
  };

  // Datos para cada hoja del Excel
  hoja1_radicacion: RadicacionFacturaGeneral;
  hoja2_detalles: DetalleFactura[];
  hoja3_atenciones: RegistroAtencion[];
  hoja4_procedimientos: ProcedimientoAtencion[];
  hoja5_glosas: GlosaDetalle[];

  // Resumen ejecutivo
  resumen: {
    totalFacturado: number;
    totalGlosado: number;
    totalAPagar: number;
    cantidadGlosas: number;
    glosasPorTipo: Record<string, number>;
  };
}

// ============================================================================
// REGLAS DEL MOTOR EXPERTO
// ============================================================================

export interface ReglaValidacion {
  codigo: CodigoGlosa;
  nombre: string;
  descripcion: string;
  severidad: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';
  validar: (contexto: ContextoValidacion) => ResultadoRegla;
}

export interface ContextoValidacion {
  procedimiento: any; // Procedimiento extraído
  diagnosticos: any[]; // Diagnósticos de la atención
  autorizacion?: any; // Datos de autorización
  cupsEnBD?: any; // CUPS encontrado en BD
  tarifaContratada?: number; // Tarifa según manual
  convenio?: string; // Convenio aplicable
}

export interface ResultadoRegla {
  cumple: boolean; // ¿Cumple la regla?
  glosa?: {
    codigo: CodigoGlosa;
    descripcion: string;
    valorGlosado: number;
    observaciones: string;
  };
}

// ============================================================================
// CONFIGURACIÓN DEL SISTEMA EXPERTO
// ============================================================================

export interface ConfiguracionSistemaExperto {
  // Tolerancia para diferencias de tarifa (%)
  toleranciaDiferenciaTarifa: number; // Ej: 5 = 5%

  // Manuales tarifarios habilitados
  manualesTarifarios: ('ISS2001' | 'ISS2004' | 'SOAT')[];

  // Manual por defecto si no se especifica
  manualPorDefecto: 'ISS2001' | 'ISS2004' | 'SOAT';

  // Reglas habilitadas
  reglasHabilitadas: CodigoGlosa[];

  // Validación de coherencia clínica
  validarCoherenciaClinica: boolean;

  // Requiere autorización para procedimientos
  requiereAutorizacion: boolean;

  // Cachear resultados de CUPS
  cacheCUPS: boolean;
}
