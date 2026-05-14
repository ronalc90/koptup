import { Pick, Warehouse } from './wms.types';

export const warehouses: Warehouse[] = [
  { id: 'wh_001', code: 'BOG-01', name: 'CD Bogotá', location: 'Bogotá, CO', capacity: 10000, occupancy: 6800, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
  { id: 'wh_002', code: 'MED-01', name: 'CD Medellín', location: 'Medellín, CO', capacity: 5000, occupancy: 3200, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
  { id: 'wh_003', code: 'CLO-01', name: 'CD Cali', location: 'Cali, CO', capacity: 4000, occupancy: 1500, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
  { id: 'wh_004', code: 'BAQ-01', name: 'CD Barranquilla', location: 'Barranquilla, CO', capacity: 3000, occupancy: 2700, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
];

const t = (d: number) => new Date(Date.now() - d * 3600000).toISOString();

export const picks: Pick[] = [
  { id: 'pk_001', warehouseId: 'wh_001', orderId: 'ord_5001', status: 'pending', items: [{ sku: 'SKU-A1', qty: 3, location: 'A-01-03' }, { sku: 'SKU-B2', qty: 1, location: 'B-02-01' }], createdAt: t(2), updatedAt: t(2) },
  { id: 'pk_002', warehouseId: 'wh_001', orderId: 'ord_5002', status: 'picking', pickerId: 'usr_picker_01', items: [{ sku: 'SKU-C3', qty: 5, location: 'C-03-04' }], startedAt: t(1), createdAt: t(3), updatedAt: t(1) },
  { id: 'pk_003', warehouseId: 'wh_002', orderId: 'ord_5003', status: 'packed', pickerId: 'usr_picker_02', items: [{ sku: 'SKU-A1', qty: 2, location: 'A-01-03' }], startedAt: t(5), completedAt: t(4), createdAt: t(6), updatedAt: t(4) },
  { id: 'pk_004', warehouseId: 'wh_002', orderId: 'ord_5004', status: 'shipped', pickerId: 'usr_picker_02', items: [{ sku: 'SKU-D4', qty: 10, location: 'D-04-02' }], startedAt: t(10), completedAt: t(8), createdAt: t(12), updatedAt: t(8) },
  { id: 'pk_005', warehouseId: 'wh_003', orderId: 'ord_5005', status: 'pending', items: [{ sku: 'SKU-E5', qty: 1, location: 'E-05-01' }], createdAt: t(1), updatedAt: t(1) },
  { id: 'pk_006', warehouseId: 'wh_001', orderId: 'ord_5006', status: 'cancelled', items: [{ sku: 'SKU-F6', qty: 4, location: 'F-06-03' }], createdAt: t(20), updatedAt: t(18) },
  { id: 'pk_007', warehouseId: 'wh_004', orderId: 'ord_5007', status: 'picking', pickerId: 'usr_picker_03', items: [{ sku: 'SKU-G7', qty: 2, location: 'G-07-02' }, { sku: 'SKU-H8', qty: 6, location: 'H-08-04' }], startedAt: t(2), createdAt: t(4), updatedAt: t(2) },
  { id: 'pk_008', warehouseId: 'wh_001', orderId: 'ord_5008', status: 'packed', pickerId: 'usr_picker_01', items: [{ sku: 'SKU-I9', qty: 1, location: 'I-09-01' }], startedAt: t(8), completedAt: t(7), createdAt: t(9), updatedAt: t(7) },
];
