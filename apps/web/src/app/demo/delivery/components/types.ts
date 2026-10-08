// Tipos de la demo de domicilios (canal propio de una marca con sedes).
// Todo vive en el navegador: no hay backend ni datos reales.

/** Punto en la nomenclatura de Bogotá: número de calle (negativo = sur) y de carrera. */
export interface Place {
  calle: number;
  carrera: number;
}

export type SedeId = 'chapinero' | 'usaquen' | 'cedritos';
export type ZoneId = 'chapinero' | 'usaquen' | 'cedritos' | 'suba' | 'teusaquillo' | 'kennedy' | 'fontibon';
export type CategoryId = 'platos' | 'sopas' | 'antojos' | 'bebidas' | 'postres';
export type PaymentId = 'nequi' | 'daviplata' | 'pse' | 'card' | 'cash' | 'dataphone';
export type Vehicle = 'moto' | 'bici';

export interface Sede {
  id: SedeId;
  zone: ZoneId;
  address: string;
  place: Place;
}

export interface MenuOption {
  id: string;
  delta: number;
}

export interface MenuItem {
  id: string;
  cat: CategoryId;
  price: number;
  popular?: boolean;
  /** Elección obligatoria de una opción (p. ej. término de la carne). */
  choice?: { id: string; options: MenuOption[] };
  /** Adiciones o cambios opcionales. */
  extras?: MenuOption[];
}

export interface Driver {
  id: string;
  name: string;
  vehicle: Vehicle;
  plate: string;
  /** Dónde está cuando no lleva pedidos. */
  place: Place;
  online: boolean;
}

export type DocStatus = 'valid' | 'expiring' | 'expired' | 'review';

export interface DriverDoc {
  id: 'cedula' | 'licencia' | 'soat' | 'tecnomecanica' | 'tarjetaPropiedad' | 'seguridadSocial';
  /** AAAA-MM-DD; sin fecha = no vence. */
  expires?: string;
  fileName?: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  place: Place;
  zone: ZoneId;
}

export interface CartLine {
  key: string;
  itemId: string;
  qty: number;
  unit: number;
  options: string[];
}

export interface Pricing {
  subtotal: number;
  fee: number;
  rainFee: number;
  discount: number;
  tip: number;
  total: number;
}

export type Stage = 'pending' | 'preparing' | 'ready' | 'pickedUp' | 'delivered' | 'rejected' | 'cancelled';

export interface ChatMsg {
  from: 'customer' | 'driver' | 'ops';
  /** Clave de texto rápido (se traduce) o texto libre. */
  key?: string;
  text?: string;
  at: number;
}

export interface Order {
  id: string;
  seq: number;
  /** Lo creó el visitante en esta demo. */
  own: boolean;
  sedeId: SedeId;
  customer: {
    id: string;
    name: string;
    phone: string;
    address: string;
    place: Place;
    zone: ZoneId;
    isNew: boolean;
  };
  lines: CartLine[];
  note?: string;
  pricing: Pricing;
  payment: PaymentId;
  cashWith?: number;
  pointsUsed?: number;
  driverBonus: number;
  code: string;
  stage: Stage;
  prepMin?: number;
  /** Minutos prometidos al cliente desde que se creó el pedido. */
  promisedMin?: number;
  driverId?: string;
  driverStatus?: 'offered' | 'accepted';
  /** Marcas de tiempo en segundos del día de la demo. */
  t: {
    created: number;
    accepted?: number;
    ready?: number;
    assigned?: number;
    pickedUp?: number;
    delivered?: number;
    closed?: number;
  };
  rejectReason?: string;
  cancelReason?: string;
  rating?: { stars: number; comment?: string; commentKey?: string };
  pod?: { method: 'code' | 'photoSignature'; distanceM: number; photoName?: string };
  chat: ChatMsg[];
  /** Veces que un repartidor rechazó la oferta. */
  driverRejections: number;
  lateNotified?: boolean;
}

export interface LogEntry {
  at: number;
  app: 'customer' | 'merchant' | 'ops' | 'driver' | 'system';
  key: string;
  params?: Record<string, string | number>;
}

export type AlertResolution = 'dismissed' | 'blocked';
