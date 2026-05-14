import { BaseEntity } from '../_shared/types';

export type OrderStatus = 'open' | 'paid' | 'refunded' | 'voided';
export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'transfer';

export interface PosOrder extends BaseEntity {
  cashierId: string;
  terminalId: string;
  total: number;
  currency: string;
  status: OrderStatus;
  items: ReadonlyArray<{ sku: string; name: string; qty: number; price: number }>;
  paymentId?: string;
}

export interface Payment extends BaseEntity {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  currency: string;
  reference?: string;
  authorized: boolean;
}
