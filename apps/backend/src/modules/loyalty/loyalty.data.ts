import { Member, Reward } from './loyalty.types';

const d = (days: number) => new Date(Date.now() + days * 86400000).toISOString();

export const members: Member[] = [
  { id: 'mem_001', name: 'Camila Forero', email: 'camila.f@mail.com', tier: 'platinum', points: 8540, totalSpent: 12500, joinedAt: '2024-03-15T00:00:00Z', lastActivityAt: d(-2), createdAt: '2024-03-15T00:00:00Z', updatedAt: d(-2) },
  { id: 'mem_002', name: 'Andrés Lozano', email: 'andres.l@mail.com', tier: 'gold', points: 3200, totalSpent: 5400, joinedAt: '2024-08-01T00:00:00Z', lastActivityAt: d(-5), createdAt: '2024-08-01T00:00:00Z', updatedAt: d(-5) },
  { id: 'mem_003', name: 'Valentina Castaño', email: 'valentina.c@mail.com', tier: 'silver', points: 1450, totalSpent: 2100, joinedAt: '2025-01-10T00:00:00Z', lastActivityAt: d(-1), createdAt: '2025-01-10T00:00:00Z', updatedAt: d(-1) },
  { id: 'mem_004', name: 'Jhon Castiblanco', email: 'jhon.c@mail.com', tier: 'bronze', points: 320, totalSpent: 450, joinedAt: '2025-09-01T00:00:00Z', lastActivityAt: d(-10), createdAt: '2025-09-01T00:00:00Z', updatedAt: d(-10) },
  { id: 'mem_005', name: 'Ana María Acevedo', email: 'ana.a@mail.com', tier: 'gold', points: 4800, totalSpent: 6900, joinedAt: '2024-05-20T00:00:00Z', lastActivityAt: d(0), createdAt: '2024-05-20T00:00:00Z', updatedAt: d(0) },
  { id: 'mem_006', name: 'Sebastián Quiñones', email: 'sebas.q@mail.com', tier: 'platinum', points: 12300, totalSpent: 18900, joinedAt: '2023-11-15T00:00:00Z', lastActivityAt: d(-3), createdAt: '2023-11-15T00:00:00Z', updatedAt: d(-3) },
  { id: 'mem_007', name: 'Laura Beltrán', email: 'laura.b@mail.com', tier: 'silver', points: 1850, totalSpent: 2800, joinedAt: '2024-12-01T00:00:00Z', lastActivityAt: d(-7), createdAt: '2024-12-01T00:00:00Z', updatedAt: d(-7) },
  { id: 'mem_008', name: 'Cristian Méndez', email: 'cris.m@mail.com', tier: 'bronze', points: 580, totalSpent: 720, joinedAt: '2025-07-15T00:00:00Z', lastActivityAt: d(-14), createdAt: '2025-07-15T00:00:00Z', updatedAt: d(-14) },
];

export const rewards: Reward[] = [
  { id: 'rw_001', memberId: 'mem_001', name: 'Descuento 20%', description: '20% en próxima compra', pointsCost: 2000, status: 'active', expiresAt: d(30), createdAt: d(-2), updatedAt: d(-2) },
  { id: 'rw_002', memberId: 'mem_001', name: 'Cena gratis', description: 'Cena para dos personas', pointsCost: 5000, status: 'redeemed', redeemedAt: d(-10), expiresAt: d(-5), createdAt: d(-30), updatedAt: d(-10) },
  { id: 'rw_003', memberId: 'mem_002', name: 'Envío gratis', description: 'Envío gratis x3', pointsCost: 800, status: 'active', expiresAt: d(60), createdAt: d(-5), updatedAt: d(-5) },
  { id: 'rw_004', memberId: 'mem_005', name: 'Producto regalo', description: 'Café premium 250g', pointsCost: 1200, status: 'active', expiresAt: d(45), createdAt: d(-1), updatedAt: d(-1) },
  { id: 'rw_005', memberId: 'mem_003', name: 'Descuento 10%', description: '10% en cualquier compra', pointsCost: 500, status: 'expired', expiresAt: d(-3), createdAt: d(-60), updatedAt: d(-3) },
  { id: 'rw_006', memberId: 'mem_006', name: 'Acceso VIP', description: 'Acceso evento exclusivo', pointsCost: 8000, status: 'redeemed', redeemedAt: d(-20), expiresAt: d(-15), createdAt: d(-45), updatedAt: d(-20) },
  { id: 'rw_007', memberId: 'mem_007', name: 'Doble puntos', description: '2x puntos por 7 días', pointsCost: 1000, status: 'active', expiresAt: d(20), createdAt: d(-7), updatedAt: d(-7) },
];
