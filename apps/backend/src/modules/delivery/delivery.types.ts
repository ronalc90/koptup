import { BaseEntity } from '../_shared/types';

export type DeliveryStatus = 'created' | 'assigned' | 'picked-up' | 'in-transit' | 'delivered' | 'cancelled';
export type DriverStatus = 'available' | 'on-delivery' | 'off-duty';

export interface DeliveryOrder extends BaseEntity {
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  status: DeliveryStatus;
  driverId?: string;
  estimatedTime: number;
  amount: number;
  pickedUpAt?: string;
  deliveredAt?: string;
}

export interface Driver extends BaseEntity {
  name: string;
  phone: string;
  vehicle: 'motorbike' | 'car' | 'bicycle';
  plate?: string;
  status: DriverStatus;
  rating: number;
  totalDeliveries: number;
  currentLocation?: { lat: number; lng: number };
}
