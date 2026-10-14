import type { ISODate, ISODateTime } from './dates';

export type WarehouseId = 'fun' | 'ita' | 'baq';
export type Zone = 'A' | 'B' | 'C' | 'Q';
export type ClientId = 'lir' | 'cth' | 'nut';
export type Channel = 'web' | 'meli' | 'wholesale';
export type AbcClass = 'A' | 'B' | 'C';
export type CarrierId = 'ran' | 'con' | 'cei' | 'mac' | 'own';
export type PickStrategy = 'wave' | 'batch' | 'zone' | 'cluster';

export interface Product {
  sku: string;
  client: ClientId;
  barcode: string;
  /** Nombre libre (productos importados por CSV); los de ejemplo usan i18n. */
  name?: string;
  unitCost: number;
  weightKg: number;
  bulky: boolean;
  expires: boolean;
  /** Unidades promedio despachadas por día (todas las bodegas). */
  dailyDemand: number;
  kit?: { sku: string; qty: number }[];
  imported?: boolean;
}

export interface Lot {
  id: string;
  wh: WarehouseId;
  sku: string;
  lot: string;
  expiry: ISODate | null;
  bin: string;
  qty: number;
  reserved: number;
  status: 'available' | 'quarantine';
}

export interface PoLine {
  sku: string;
  expected: number;
  received: number;
  damaged: number;
  lot: string;
  expiry: ISODate | null;
  /** Unidades que trae de verdad el camión (para "Simular descarga"). */
  onTruck: number;
}

export type ScanResult = 'ok' | 'unknown' | 'over';

export interface ScanEvent {
  at: ISODateTime;
  code: string;
  units: number;
  result: ScanResult;
  sku?: string;
}

export type PoStatus = 'expected' | 'receiving' | 'closed' | 'closedIssues';
export type IssueType = 'missing' | 'over' | 'damaged' | 'wrongSku';

export interface PurchaseOrder {
  id: string;
  wh: WarehouseId;
  supplier: string;
  client: ClientId;
  eta: ISODateTime;
  lines: PoLine[];
  status: PoStatus;
  scans: ScanEvent[];
  issues: { type: IssueType; sku?: string; qty: number }[];
  closedAt?: ISODateTime;
  /** Si la OC es cross-dock, el pedido que espera esta mercancía. */
  crossDockOrder?: string;
}

export type PutawayRule = 'sameSku' | 'highRotation' | 'bulky' | 'reserve' | 'overflow' | 'damaged' | 'manual';

export interface PutawayTask {
  id: string;
  wh: WarehouseId;
  sku: string;
  lot: string;
  expiry: ISODate | null;
  qty: number;
  ref: string;
  suggested: string;
  rule: PutawayRule;
  quarantine: boolean;
  status: 'pending' | 'done';
  bin?: string;
}

export interface Allocation {
  lotId: string;
  bin: string;
  lot: string;
  qty: number;
  picked: number;
  short: number;
}

export interface OrderLine {
  sku: string;
  qty: number;
  alloc: Allocation[];
}

export type OrderStatus = 'new' | 'released' | 'picked' | 'shipped' | 'delivered';

export interface StopInfo {
  /** Posición en km respecto a la bodega (este, norte). */
  x: number;
  y: number;
  from: number;
  to: number;
}

export interface Order {
  id: string;
  wh: WarehouseId;
  client: ClientId;
  channel: Channel;
  customer: string;
  city: string;
  address: string;
  createdAt: ISODateTime;
  cutoff: ISODateTime;
  lines: OrderLine[];
  status: OrderStatus;
  wave?: string;
  shipment?: string;
  verified?: Record<string, number>;
  pickedAt?: ISODateTime;
  shippedAt?: ISODateTime;
  deliveredAt?: ISODateTime;
  crossDockPo?: string;
  stop?: StopInfo;
  shortLines?: number;
}

export interface Wave {
  id: string;
  wh: WarehouseId;
  at: ISODateTime;
  orders: string[];
  strategy: PickStrategy;
  status: 'open' | 'done';
}

export type ShipStatus = 'created' | 'pickedUp' | 'inTransit' | 'outForDelivery' | 'arrived' | 'delivered' | 'exception';

export interface Pod {
  name: string;
  at: ISODateTime;
  signature?: string;
  photo?: string;
}

export interface Shipment {
  id: string;
  order: string;
  wh: WarehouseId;
  carrier: CarrierId;
  city: string;
  cost: number;
  weightKg: number;
  box: 'S' | 'M' | 'L' | 'P';
  etaDays: number;
  status: ShipStatus;
  events: { status: ShipStatus; at: ISODateTime; note?: string }[];
  pod?: Pod;
  failReason?: string;
}

export type MoveType =
  | 'receipt'
  | 'putaway'
  | 'pick'
  | 'adjust'
  | 'transferOut'
  | 'transferIn'
  | 'return'
  | 'quarantine'
  | 'release'
  | 'kitConsume'
  | 'kitBuild'
  | 'crossDock';

export interface Movement {
  id: string;
  at: ISODateTime;
  wh: WarehouseId;
  sku: string;
  lot: string;
  bin: string;
  qty: number;
  type: MoveType;
  ref: string;
}

export interface CountTask {
  id: string;
  wh: WarehouseId;
  bin: string;
  lotId: string;
  sku: string;
  due: ISODate;
  assignee: string;
  status: 'scheduled' | 'review' | 'done';
  urgent?: boolean;
  system?: number;
  counted?: number;
  result?: 'match' | 'adjusted';
}

export type RmaReason = 'damaged' | 'wrongItem' | 'withdrawal' | 'defect';
export type RmaStatus = 'requested' | 'approved' | 'rejected' | 'received' | 'closed';

export interface Rma {
  id: string;
  wh: WarehouseId;
  order: string;
  client: ClientId;
  customer: string;
  sku: string;
  qty: number;
  reason: RmaReason;
  comments: string;
  /** Comentario de los datos de ejemplo (se traduce con i18n). */
  commentsKey?: string;
  date: ISODate;
  status: RmaStatus;
  disposition?: 'restock' | 'quarantine';
  rejectReason?: string;
}

export type CrossStep = 'sort' | 'consolidate' | 'dispatch' | 'done';

export interface CrossDockTask {
  id: string;
  wh: WarehouseId;
  po: string;
  order: string;
  units: number;
  step: CrossStep;
}

export interface Tariff {
  storage: number;
  line: number;
  order: number;
  parcel: number;
  rma: number;
}

/** Volúmenes de días anteriores (operación de ejemplo) para la prefactura 3PL. */
export interface BillingHistory {
  prev: { posDays: number; lines: number; orders: number; parcels: number; rmas: number };
  mtd: { posDays: number; lines: number; orders: number; parcels: number; rmas: number };
}

export interface LogEntry {
  id: string;
  at: ISODateTime;
  wh: WarehouseId;
  key: string;
  params: Record<string, string | number>;
}

export interface RoutePlan {
  /** Pedidos por vehículo en el orden de visita. */
  plan: string[][];
  optimized: boolean;
  start: string;
}

export interface WmsState {
  version: number;
  baseDate: ISODate;
  createdAt: ISODateTime;
  seq: number;
  products: Product[];
  lots: Lot[];
  pos: PurchaseOrder[];
  putaway: PutawayTask[];
  orders: Order[];
  waves: Wave[];
  shipments: Shipment[];
  moves: Movement[];
  counts: CountTask[];
  countStats: Record<WarehouseId, { total: number; match: number }>;
  lastCount: Record<WarehouseId, Record<AbcClass, ISODate>>;
  rmas: Rma[];
  crossDock: CrossDockTask[];
  routes: Record<WarehouseId, RoutePlan>;
  preferred: Record<WarehouseId, CarrierId>;
  tariffs: Record<ClientId, Tariff>;
  billing: Record<ClientId, BillingHistory>;
  log: LogEntry[];
  /** Pasos del recorrido sugerido ya completados. */
  milestones: Milestone[];
}

export type Milestone = 'received' | 'putaway' | 'wave' | 'picked' | 'shipped' | 'delivered';

export type ViewId =
  | 'dashboard'
  | 'receiving'
  | 'crossdock'
  | 'map'
  | 'stock'
  | 'counts'
  | 'orders'
  | 'picking'
  | 'packing'
  | 'carriers'
  | 'routes'
  | 'driver'
  | 'tracking'
  | 'returns'
  | 'billing';
