import { BaseEntity } from '../_shared/types';

export type PickStatus = 'pending' | 'picking' | 'packed' | 'shipped' | 'cancelled';

export interface Warehouse extends BaseEntity {
  code: string;
  name: string;
  location: string;
  capacity: number;
  occupancy: number;
}

export interface Pick extends BaseEntity {
  warehouseId: string;
  orderId: string;
  status: PickStatus;
  pickerId?: string;
  items: ReadonlyArray<{ sku: string; qty: number; location: string }>;
  startedAt?: string;
  completedAt?: string;
}
