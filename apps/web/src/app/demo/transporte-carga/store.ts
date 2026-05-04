import { useSyncExternalStore } from 'react';

export interface Cliente {
  id: string;
  tipoDoc: number;
  numeroDoc: string;
  razonSocial: string;
  nombreComercial?: string;
  dirección: string;
  ubigeo: string;
  telefono: string;
  email: string;
  activo: boolean;
  createdAt: Date;
}

export interface Conductor {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  licencia: string;
  categoriaLicencia: string;
  vencimientoLicencia: Date;
  telefono?: string;
  email?: string;
  activo: boolean;
  createdAt: Date;
}

export interface Vehiculo {
  id: string;
  placa: string;
  configuracion: string;
  anio: number;
  capacidadKg: number;
  vencimientoSOAT: Date;
  vencimientoRevision: Date;
  certificadoMTC?: string;
  activo: boolean;
  createdAt: Date;
}

export interface Orden {
  id: string;
  numero: string;
  clienteId: string;
  conductorId: string;
  vehiculoId: string;
  modalidadTransporte: string;
  origen: {
    direccion: string;
    ubigeo: string;
  };
  destino: {
    direccion: string;
    ubigeo: string;
  };
  fechaInicioTraslado: Date;
  pesoTotal: number;
  bultos: number;
  descripcionMercancia: string;
  flete: number;
  igv: number;
  total: number;
  estado: 'borrador' | 'confirmada' | 'en_ruta' | 'entregada' | 'facturada';
  createdAt: Date;
  updatedAt: Date;
}

export interface Guia {
  id: string;
  numero: string;
  ordenId: string;
  remitente: { razonSocial: string; numeroDoc: string };
  destinatario: { razonSocial: string; numeroDoc: string };
  transportista: { razonSocial: string; ruc: string };
  conductor: { nombres: string; dni: string };
  vehiculo: { placa: string };
  hash: string;
  xml: string;
  cdr?: string;
  estado: 'emitida' | 'aceptada' | 'rechazada' | 'anulada';
  createdAt: Date;
}

export interface FacturaItem {
  id: string;
  descripcion: string;
  cantidad: number;
  unitario: number;
  subtotal: number;
}

export interface Factura {
  id: string;
  numero: string;
  ordenId: string;
  clienteId: string;
  clienteRazonSocial: string;
  clienteNumeroDoc: string;
  items: FacturaItem[];
  subtotal: number;
  igv: number;
  detraccion?: number;
  total: number;
  xml: string;
  cdr?: string;
  estado: 'emitida' | 'cancelada' | 'anulada';
  createdAt: Date;
}

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: 'admin' | 'operador' | 'conductor';
  activo: boolean;
}

export interface TransporteState {
  clientes: Cliente[];
  conductores: Conductor[];
  vehiculos: Vehiculo[];
  ordenes: Orden[];
  guias: Guia[];
  facturas: Factura[];
  usuarios: Usuario[];
}

const STORAGE_KEY = 'koptup-transporte-demo-v1';

let state: TransporteState = {
  clientes: [],
  conductores: [],
  vehiculos: [],
  ordenes: [],
  guias: [],
  facturas: [],
  usuarios: [],
};

let listeners: Set<() => void> = new Set();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function getState(): TransporteState {
  return state;
}

export function setState(newState: Partial<TransporteState>) {
  state = { ...state, ...newState };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  notify();
}

export function init(initialState: TransporteState) {
  state = initialState;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  notify();
}

export function loadState(): TransporteState {
  if (typeof window === 'undefined') return state;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      state = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored state', e);
    }
  }
  return state;
}

export function useTransporteStore(): TransporteState {
  return useSyncExternalStore(subscribe, getState);
}
