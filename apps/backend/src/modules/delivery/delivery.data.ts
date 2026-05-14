import { Driver, DeliveryOrder } from './delivery.types';

const t = (m: number) => new Date(Date.now() - m * 60000).toISOString();

export const drivers: Driver[] = [
  { id: 'drv_001', name: 'Carlos Mendoza', phone: '+57 311 100 2200', vehicle: 'motorbike', plate: 'ABC12A', status: 'available', rating: 4.8, totalDeliveries: 342, currentLocation: { lat: 4.7110, lng: -74.0721 }, createdAt: '2025-08-01T00:00:00Z', updatedAt: t(5) },
  { id: 'drv_002', name: 'Andrea Cifuentes', phone: '+57 312 200 3300', vehicle: 'motorbike', plate: 'XYZ34B', status: 'on-delivery', rating: 4.9, totalDeliveries: 511, currentLocation: { lat: 4.6533, lng: -74.0836 }, createdAt: '2025-06-15T00:00:00Z', updatedAt: t(2) },
  { id: 'drv_003', name: 'Diego Patiño', phone: '+57 313 300 4400', vehicle: 'car', plate: 'JKL56C', status: 'available', rating: 4.6, totalDeliveries: 198, currentLocation: { lat: 4.6097, lng: -74.0817 }, createdAt: '2026-01-20T00:00:00Z', updatedAt: t(10) },
  { id: 'drv_004', name: 'Yesenia Gómez', phone: '+57 314 400 5500', vehicle: 'bicycle', status: 'off-duty', rating: 4.7, totalDeliveries: 89, createdAt: '2026-02-10T00:00:00Z', updatedAt: t(60 * 8) },
  { id: 'drv_005', name: 'Iván Restrepo', phone: '+57 315 500 6600', vehicle: 'motorbike', plate: 'MNO78D', status: 'on-delivery', rating: 4.5, totalDeliveries: 267, currentLocation: { lat: 4.6855, lng: -74.0481 }, createdAt: '2025-11-05T00:00:00Z', updatedAt: t(8) },
];

export const orders: DeliveryOrder[] = [
  { id: 'dlv_001', customerName: 'Laura Buitrago', customerPhone: '+57 300 111 9999', pickupAddress: 'Cra 11 #82-15, Bogotá', dropoffAddress: 'Calle 100 #15-32, Bogotá', status: 'in-transit', driverId: 'drv_002', estimatedTime: 25, amount: 45000, pickedUpAt: t(15), createdAt: t(30), updatedAt: t(15) },
  { id: 'dlv_002', customerName: 'Roberto Acosta', customerPhone: '+57 311 222 8888', pickupAddress: 'Av 19 #120-45, Bogotá', dropoffAddress: 'Cl 72 #10-08, Bogotá', status: 'assigned', driverId: 'drv_001', estimatedTime: 35, amount: 28000, createdAt: t(8), updatedAt: t(5) },
  { id: 'dlv_003', customerName: 'Mónica Suárez', customerPhone: '+57 320 333 7777', pickupAddress: 'Cl 53 #79-30, Bogotá', dropoffAddress: 'Cl 134 #7-83, Bogotá', status: 'delivered', driverId: 'drv_002', estimatedTime: 30, amount: 52000, pickedUpAt: t(120), deliveredAt: t(90), createdAt: t(150), updatedAt: t(90) },
  { id: 'dlv_004', customerName: 'Felipe Roa', customerPhone: '+57 312 444 6666', pickupAddress: 'Cl 26 #92-32, Bogotá', dropoffAddress: 'Av Caracas #46-22, Bogotá', status: 'created', estimatedTime: 40, amount: 18000, createdAt: t(2), updatedAt: t(2) },
  { id: 'dlv_005', customerName: 'Sandra Ríos', customerPhone: '+57 313 555 5555', pickupAddress: 'Cl 80 #11-42, Bogotá', dropoffAddress: 'Cl 116 #19-22, Bogotá', status: 'in-transit', driverId: 'drv_005', estimatedTime: 28, amount: 35000, pickedUpAt: t(10), createdAt: t(40), updatedAt: t(10) },
  { id: 'dlv_006', customerName: 'Jaime Cárdenas', customerPhone: '+57 314 666 4444', pickupAddress: 'Cl 67 #11-33, Bogotá', dropoffAddress: 'Cra 7 #50-22, Bogotá', status: 'cancelled', estimatedTime: 22, amount: 0, createdAt: t(180), updatedAt: t(178) },
  { id: 'dlv_007', customerName: 'Patricia Vélez', customerPhone: '+57 315 777 3333', pickupAddress: 'Cl 140 #19-22, Bogotá', dropoffAddress: 'Cl 100 #50-44, Bogotá', status: 'delivered', driverId: 'drv_001', estimatedTime: 32, amount: 41000, pickedUpAt: t(240), deliveredAt: t(210), createdAt: t(270), updatedAt: t(210) },
  { id: 'dlv_008', customerName: 'Hernán Bonilla', customerPhone: '+57 316 888 2222', pickupAddress: 'Av 68 #80-12, Bogotá', dropoffAddress: 'Cl 26 Sur #23-44, Bogotá', status: 'created', estimatedTime: 45, amount: 60000, createdAt: t(1), updatedAt: t(1) },
];
