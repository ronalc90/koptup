// Tipos para el Sistema de Gestión de Transporte de Carga (Perú)

export type DocumentoIdentidad = '1' | '6'; // 1=DNI, 6=RUC
export type EstadoOrden = 'borrador' | 'confirmada' | 'en_ruta' | 'entregada' | 'facturada' | 'anulada';
export type EstadoGuia = 'pendiente' | 'emitida' | 'aceptada' | 'rechazada' | 'anulada';
export type EstadoFactura = 'pendiente' | 'emitida' | 'aceptada' | 'rechazada' | 'anulada';
export type TipoComprobante = '01' | '03'; // 01=Factura, 03=Boleta
export type Rol = 'admin' | 'operador' | 'conductor';

export interface Direccion {
  direccion: string;
  ubigeo: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
}

export interface Cliente {
  id: string;
  tipoDoc: DocumentoIdentidad;
  numeroDoc: string;
  razonSocial: string;
  nombreComercial?: string;
  direccion: string;
  ubigeo?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  createdAt: string;
}

export interface Conductor {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  licencia: string;
  categoriaLicencia: string;
  vencimientoLicencia: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  createdAt: string;
}

export interface Vehiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  capacidadKg: number;
  configuracion: string;
  certificadoMTC?: string;
  vencimientoSOAT: string;
  vencimientoRevision: string;
  activo: boolean;
  createdAt: string;
}

export interface OrdenServicio {
  id: string;
  numero: string;
  fecha: string;
  clienteId: string;
  conductorId: string;
  vehiculoId: string;
  origen: Direccion;
  destino: Direccion;
  fechaInicioTraslado: string;
  pesoTotalKg: number;
  bultos: number;
  descripcionMercancia: string;
  modalidadTransporte: '01' | '02';
  flete: number;
  igv: number;
  total: number;
  estado: EstadoOrden;
  guiaId?: string;
  facturaId?: string;
  observaciones?: string;
  createdAt: string;
}

export interface PartyRef {
  tipoDoc: DocumentoIdentidad;
  numeroDoc: string;
  razonSocial: string;
  direccion: string;
}

export interface Transportista {
  ruc: string;
  razonSocial: string;
  placa: string;
  licencia: string;
  conductorDni: string;
  conductorNombres: string;
}

export interface GuiaRemision {
  id: string;
  serie: string;
  correlativo: string;
  numero: string;
  tipoGuia: 'remitente' | 'transportista';
  fechaEmision: string;
  fechaInicioTraslado: string;
  ordenId: string;
  motivoTraslado: string;
  pesoTotalKg: number;
  bultos: number;
  descripcionMercancia: string;
  remitente: PartyRef;
  destinatario: PartyRef;
  transportista?: Transportista;
  origen: { direccion: string; ubigeo: string };
  destino: { direccion: string; ubigeo: string };
  estado: EstadoGuia;
  xml?: string;
  hash?: string;
  cdr?: string;
  pdfUrl?: string;
  observaciones?: string;
  createdAt: string;
  emitidaAt?: string;
}

export interface FacturaItem {
  id: string;
  codigo?: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  valorUnitario: number;
  precioUnitario: number;
  igv: number;
  total: number;
  afectacionIgv: '10' | '20';
}

export interface DetraccionInfo {
  aplica: boolean;
  porcentaje: number;
  monto: number;
  cuenta: string;
  codigo: string;
}

export interface Factura {
  id: string;
  serie: string;
  correlativo: string;
  numero: string;
  tipoComprobante: TipoComprobante;
  fechaEmision: string;
  fechaVencimiento?: string;
  ordenId: string;
  clienteId: string;
  guiaId?: string;
  moneda: 'PEN';
  subtotal: number;
  igv: number;
  total: number;
  detraccion?: DetraccionInfo;
  items: FacturaItem[];
  observaciones?: string;
  estado: EstadoFactura;
  xml?: string;
  hash?: string;
  cdr?: string;
  pdfUrl?: string;
  createdAt: string;
  emitidaAt?: string;
}

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  conductorId?: string;
}

export interface KPIs {
  ordenesActivas: number;
  ordenesEntregadas: number;
  ordenesMes: number;
  facturacionMesPEN: number;
  facturacionMesAnterior: number;
  detraccionesMes: number;
  topClientes: { clienteId: string; razonSocial: string; total: number }[];
  ordenesPorEstado: { estado: EstadoOrden; count: number }[];
  ingresosUltimos6Meses: { mes: string; total: number }[];
}
