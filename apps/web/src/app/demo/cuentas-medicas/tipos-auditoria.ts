// Tipos de las respuestas de /api/auditoria que usa la demo.

export interface Factura {
  _id: string;
  numeroFactura: string;
  fechaEmision: string;
  fechaRadicacion?: string;
  ips: { nit: string; nombre: string; codigo?: string };
  eps: { nit: string; nombre: string; codigo?: string };
  numeroContrato?: string;
  regimen?: string;
  valorBruto: number;
  iva: number;
  valorTotal: number;
  estado: string;
  auditoriaCompletada: boolean;
  fechaAuditoria?: string;
  totalGlosas: number;
  valorAceptado: number;
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Atencion {
  _id: string;
  numeroAtencion?: string;
  numeroAutorizacion?: string;
  fechaAutorizacion?: string;
  paciente?: {
    tipoDocumento?: string;
    numeroDocumento?: string;
    nombres?: string;
    apellidos?: string;
  };
  diagnosticoPrincipal?: { codigoCIE10?: string; descripcion?: string };
  copago?: number;
  cuotaModeradora?: number;
  tieneAutorizacion?: boolean;
}

export interface Procedimiento {
  _id: string;
  codigoCUPS: string;
  descripcion: string;
  cantidad: number;
  valorUnitarioIPS: number;
  valorTotalIPS: number;
  valorUnitarioContrato: number;
  valorTotalContrato: number;
  valorAPagar?: number;
  diferenciaTarifa: number;
  totalGlosas: number;
}

export interface Glosa {
  _id: string;
  procedimientoId?: string;
  facturaId: string;
  codigo: string;
  tipo: string;
  descripcion: string;
  valorGlosado: number;
  observaciones?: string;
  /** 'Pendiente' | 'Aceptada' (confirmada por el auditor) | 'Rechazada' (descartada) | 'En Discusión' */
  estado: string;
  generadaAutomaticamente?: boolean;
  fechaGeneracion?: string;
}

export interface DetalleFactura {
  factura: Factura;
  atenciones: Atencion[];
  procedimientos: Procedimiento[];
  glosas: Glosa[];
}

export interface Estadisticas {
  totalFacturas: number;
  facturasAuditadas: number;
  estadoPorFactura: Array<{ _id: string; count: number; total: number }>;
  totales: { valorTotal: number; totalGlosas: number; valorAceptado: number };
  glosasPorTipo: Array<{ _id: string; count: number; valorTotal: number }>;
}

export interface FiltrosFacturas {
  estado: string;
  desde: string;
  hasta: string;
}

/** Respuesta de POST /api/auditoria/procesar-facturas-pdf (solo los campos que usa la demo). */
export interface ResultadoProcesamiento {
  factura: {
    _id: string;
    numeroFactura: string;
    valorTotal: number;
    totalGlosas: number;
    valorAceptado: number;
    estado: string;
    auditoriaCompletada: boolean;
  };
  glosas: Array<{ codigo: string; tipo: string; valor: number; observacion: string }>;
  archivosProcessed: { total: number; procedimientos: number; metodo: string };
}
