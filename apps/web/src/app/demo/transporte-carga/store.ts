import { useSyncExternalStore } from 'react';
import {
  Cliente,
  Conductor,
  Vehiculo,
  OrdenServicio,
  GuiaRemision,
  Factura,
  User,
} from './types';
import {
  seedClientes,
  seedConductores,
  seedVehiculos,
  seedOrdenes,
  seedGuias,
  seedFacturas,
  seedUsuarios,
} from './mockData';

// Interfaz del estado
interface TransporteState {
  clientes: Cliente[];
  conductores: Conductor[];
  vehiculos: Vehiculo[];
  ordenes: OrdenServicio[];
  guias: GuiaRemision[];
  facturas: Factura[];
  usuarios: User[];
  currentUserId: string;
}

// Estado inicial vacío
const initialState: TransporteState = {
  clientes: [],
  conductores: [],
  vehiculos: [],
  ordenes: [],
  guias: [],
  facturas: [],
  usuarios: [],
  currentUserId: 'user-001',
};

// Estado interno del módulo
let state: TransporteState = { ...initialState };

// Lista de listeners para cambios de estado
const listeners = new Set<() => void>();

// Flag para controlar inicialización
let initialized = false;

// Función para obtener el estado actual
export const getState = (): TransporteState => {
  // Inicializar con seed data si no se ha hecho
  if (!initialized) {
    init();
  }
  return state;
};

// Función para actualizar el estado (con mutaciones)
export const setState = (updater: (state: TransporteState) => void): void => {
  updater(state);
  // Notificar a todos los listeners
  listeners.forEach((listener) => listener());
};

// Función de inicialización que carga seed data
export const init = (): void => {
  if (initialized) return;

  // Intentar cargar del localStorage
  const STORAGE_KEY = 'koptup-transporte-demo-v1';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      state = { ...initialState, ...parsed };
      initialized = true;
      return;
    }
  } catch (e) {
    // localStorage no disponible o error en parse, continuar con seed
  }

  // Cargar seed data
  state = {
    clientes: [...seedClientes],
    conductores: [...seedConductores],
    vehiculos: [...seedVehiculos],
    ordenes: [...seedOrdenes],
    guias: [...seedGuias],
    facturas: [...seedFacturas],
    usuarios: [...seedUsuarios],
    currentUserId: 'user-001',
  };

  initialized = true;

  // Opcionalmente, guardar en localStorage para persistencia
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // localStorage no disponible, no hacer nada
  }
};

// Función para obtener snapshot del estado (para useSyncExternalStore)
const getSnapshot = (): TransporteState => {
  return state;
};

// Función para suscribirse a cambios (para useSyncExternalStore)
const subscribe = (callback: () => void): (() => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

// Hook de React para usar el store
export const useTransporteStore = <T,>(
  selector: (state: TransporteState) => T
): T => {
  // Asegurar inicialización
  if (!initialized) {
    init();
  }

  const snapshot = useSyncExternalStore(subscribe, getSnapshot);
  return selector(snapshot);
};

// Inicialización automática al importar el módulo en SSR-safe way
if (typeof window !== 'undefined') {
  init();
}
