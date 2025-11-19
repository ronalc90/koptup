// Tipos para el sistema de auditoría de cuentas médicas

export interface Factura {
  _id: string;
  numeroFactura: string;
  fechaEmision: string;
  fechaRadicacion?: string;
  ips: {
    nit: string;
    nombre: string;
    codigo?: string;
  };
  eps: {
    nit: string;
    nombre: string;
    codigo?: string;
  };
  numeroContrato?: string;
  convenio?: string;
  regimen: 'Contributivo' | 'Subsidiado' | 'Particular' | 'Otro';
  valorBruto: number;
  iva: number;
  valorTotal: number;
  estado: 'Radicada' | 'En Auditoría' | 'Auditada' | 'Glosada' | 'Aceptada' | 'Pagada' | 'Rechazada';
  estadoDetalle?: string;
  auditoriaCompletada: boolean;
  fechaAuditoria?: string;
  totalGlosas: number;
  valorAceptado: number;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Atencion {
  _id: string;
  facturaId: string;
  numeroAtencion: string;
  numeroAutorizacion?: string;
  fechaAutorizacion?: string;
  paciente: {
    tipoDocumento: string;
    numeroDocumento: string;
    edad?: number;
    sexo?: 'M' | 'F' | 'Otro';
  };
  diagnosticoPrincipal: {
    codigoCIE10: string;
    descripcion: string;
  };
  diagnosticosSecundarios?: Array<{
    codigoCIE10: string;
    descripcion: string;
  }>;
  fechaInicio: string;
  fechaFin?: string;
  copago: number;
  cuotaModeradora: number;
  tieneAutorizacion: boolean;
  autorizacionValida: boolean;
  pertinenciaValidada: boolean;
}

export interface Procedimiento {
  _id: string;
  atencionId: string;
  facturaId: string;
  codigoCUPS: string;
  descripcion: string;
  tipoManual: 'ISS' | 'CUPS' | 'SOAT' | 'Otro';
  cantidad: number;
  valorUnitarioIPS: number;
  valorTotalIPS: number;
  valorUnitarioContrato: number;
  valorTotalContrato: number;
  valorAPagar: number;
  diferenciaTarifa: number;
  totalGlosas: number;
  glosaAdmitida: boolean;
  tarifaValidada: boolean;
  pertinenciaValidada: boolean;
  duplicado: boolean;
}

export interface Glosa {
  _id: string;
  procedimientoId: string;
  atencionId: string;
  facturaId: string;
  codigo: string;
  tipo: 'Tarifa' | 'Soporte' | 'Pertinencia' | 'Duplicidad' | 'Autorización' | 'Facturación' | 'Otro';
  descripcion: string;
  valorGlosado: number;
  porcentaje?: number;
  observaciones?: string;
  justificacion?: string;
  estado: 'Pendiente' | 'Aceptada' | 'Rechazada' | 'En Discusión';
  respuestaIPS?: string;
  fechaRespuesta?: string;
  generadaAutomaticamente: boolean;
  fechaGeneracion: string;
}

export interface SoporteDocumental {
  _id: string;
  facturaId?: string;
  atencionId?: string;
  procedimientoId?: string;
  tipo: 'Autorización' | 'Orden Médica' | 'Historia Clínica' | 'Fórmula' | 'Consentimiento' | 'Paraclínico' | 'Otro';
  descripcion?: string;
  filename: string;
  originalName: string;
  path: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  validado: boolean;
}

export interface Tarifario {
  _id: string;
  nombre: string;
  tipo: 'ISS' | 'SOAT' | 'Contrato' | 'Personalizado';
  vigenciaInicio: string;
  vigenciaFin?: string;
  eps?: string;
  activo: boolean;
  items: Array<{
    codigoCUPS: string;
    valor: number;
    factorMultiplicador?: number;
    unidad?: string;
  }>;
}

export interface ResultadoAuditoria {
  facturaId: string;
  totalGlosas: number;
  valorFacturaOriginal: number;
  valorAceptado: number;
  glosasPorTipo: Record<string, number>;
  glosas: Glosa[];
  observaciones: string[];
}

export interface Estadisticas {
  totalFacturas: number;
  facturasAuditadas: number;
  estadoPorFactura: Array<{
    _id: string;
    count: number;
    total: number;
  }>;
  totales: {
    valorTotal: number;
    totalGlosas: number;
    valorAceptado: number;
  };
  glosasPorTipo: Array<{
    _id: string;
    count: number;
    valorTotal: number;
  }>;
}
