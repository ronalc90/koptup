import { Payment, PosOrder } from './pos.types';

const t = (d: number) => new Date(Date.now() - d * 60000).toISOString();

export const orders: PosOrder[] = [
  { id: 'pos_001', cashierId: 'csh_01', terminalId: 'trm_01', total: 45.5, currency: 'USD', status: 'paid', items: [{ sku: 'PROD-A', name: 'Café Americano', qty: 2, price: 3.5 }, { sku: 'PROD-B', name: 'Sandwich Pollo', qty: 1, price: 8.5 }, { sku: 'PROD-C', name: 'Postre', qty: 3, price: 10 }], paymentId: 'pay_001', createdAt: t(5), updatedAt: t(4) },
  { id: 'pos_002', cashierId: 'csh_01', terminalId: 'trm_01', total: 12, currency: 'USD', status: 'paid', items: [{ sku: 'PROD-A', name: 'Café Americano', qty: 1, price: 3.5 }, { sku: 'PROD-D', name: 'Croissant', qty: 1, price: 8.5 }], paymentId: 'pay_002', createdAt: t(10), updatedAt: t(9) },
  { id: 'pos_003', cashierId: 'csh_02', terminalId: 'trm_02', total: 30, currency: 'USD', status: 'open', items: [{ sku: 'PROD-E', name: 'Pizza Margherita', qty: 1, price: 30 }], createdAt: t(2), updatedAt: t(2) },
  { id: 'pos_004', cashierId: 'csh_01', terminalId: 'trm_01', total: 8.5, currency: 'USD', status: 'refunded', items: [{ sku: 'PROD-B', name: 'Sandwich Pollo', qty: 1, price: 8.5 }], paymentId: 'pay_004', createdAt: t(30), updatedAt: t(25) },
  { id: 'pos_005', cashierId: 'csh_02', terminalId: 'trm_02', total: 65, currency: 'USD', status: 'paid', items: [{ sku: 'PROD-F', name: 'Combo Familiar', qty: 1, price: 65 }], paymentId: 'pay_005', createdAt: t(40), updatedAt: t(39) },
  { id: 'pos_006', cashierId: 'csh_03', terminalId: 'trm_03', total: 22.5, currency: 'USD', status: 'voided', items: [{ sku: 'PROD-G', name: 'Ensalada', qty: 1, price: 12.5 }, { sku: 'PROD-A', name: 'Café', qty: 2, price: 5 }], createdAt: t(60), updatedAt: t(58) },
  { id: 'pos_007', cashierId: 'csh_01', terminalId: 'trm_01', total: 18, currency: 'USD', status: 'paid', items: [{ sku: 'PROD-H', name: 'Hamburguesa', qty: 1, price: 18 }], paymentId: 'pay_007', createdAt: t(15), updatedAt: t(14) },
];

export const payments: Payment[] = [
  { id: 'pay_001', orderId: 'pos_001', method: 'card', amount: 45.5, currency: 'USD', reference: 'AUTH-123', authorized: true, createdAt: t(4), updatedAt: t(4) },
  { id: 'pay_002', orderId: 'pos_002', method: 'cash', amount: 12, currency: 'USD', authorized: true, createdAt: t(9), updatedAt: t(9) },
  { id: 'pay_004', orderId: 'pos_004', method: 'card', amount: -8.5, currency: 'USD', reference: 'REFUND-456', authorized: true, createdAt: t(25), updatedAt: t(25) },
  { id: 'pay_005', orderId: 'pos_005', method: 'wallet', amount: 65, currency: 'USD', reference: 'WAL-789', authorized: true, createdAt: t(39), updatedAt: t(39) },
  { id: 'pay_007', orderId: 'pos_007', method: 'card', amount: 18, currency: 'USD', reference: 'AUTH-321', authorized: true, createdAt: t(14), updatedAt: t(14) },
];
