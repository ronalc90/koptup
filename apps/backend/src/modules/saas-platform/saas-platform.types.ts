import { BaseEntity } from '../_shared/types';

export type TenantStatus = 'active' | 'suspended' | 'trial' | 'cancelled';

export interface Tenant extends BaseEntity {
  name: string;
  subdomain: string;
  planId: string;
  status: TenantStatus;
  seats: number;
  region: string;
  ownerEmail: string;
}

export interface Plan {
  id: string;
  name: string;
  pricePerMonth: number;
  currency: string;
  features: ReadonlyArray<string>;
  seatLimit: number;
}
