import { Contact, Deal } from './crm.types';

export const contacts: Contact[] = [
  { id: 'ctc_001', name: 'María Rodríguez', email: 'maria@globex.com', phone: '+57 300 111 2233', company: 'Globex', tags: ['vip', 'enterprise'], createdAt: '2026-01-10T10:00:00Z', updatedAt: '2026-01-10T10:00:00Z' },
  { id: 'ctc_002', name: 'Andrés Pérez', email: 'andres@initech.com', phone: '+57 311 222 3344', company: 'Initech', tags: ['mid-market'], createdAt: '2026-01-12T11:00:00Z', updatedAt: '2026-01-12T11:00:00Z' },
  { id: 'ctc_003', name: 'Laura Gómez', email: 'laura@umbrella.co', company: 'Umbrella Co', tags: ['lead'], createdAt: '2026-02-01T09:00:00Z', updatedAt: '2026-02-01T09:00:00Z' },
  { id: 'ctc_004', name: 'Carlos Ruiz', email: 'carlos@hooli.com', phone: '+57 320 555 6677', company: 'Hooli', tags: ['enterprise', 'tech'], createdAt: '2026-02-05T14:00:00Z', updatedAt: '2026-02-05T14:00:00Z' },
  { id: 'ctc_005', name: 'Sofía Mejía', email: 'sofia@pied-piper.io', company: 'Pied Piper', tags: ['startup'], createdAt: '2026-02-10T08:00:00Z', updatedAt: '2026-02-10T08:00:00Z' },
  { id: 'ctc_006', name: 'Jorge Castro', email: 'jorge@aperture.com', company: 'Aperture', tags: ['vip'], createdAt: '2026-03-01T10:00:00Z', updatedAt: '2026-03-01T10:00:00Z' },
  { id: 'ctc_007', name: 'Camila Torres', email: 'camila@wonka.com', company: 'Wonka Industries', tags: [], createdAt: '2026-03-15T12:00:00Z', updatedAt: '2026-03-15T12:00:00Z' },
  { id: 'ctc_008', name: 'Daniel Vargas', email: 'daniel@stark.com', phone: '+57 312 999 8877', company: 'Stark Inc', tags: ['enterprise'], createdAt: '2026-04-01T09:30:00Z', updatedAt: '2026-04-01T09:30:00Z' },
];

export const deals: Deal[] = [
  { id: 'dl_001', title: 'Implementación ERP Globex', contactId: 'ctc_001', amount: 120000, currency: 'USD', stage: 'negotiation', status: 'open', expectedClose: '2026-06-30', ownerId: 'usr_001', createdAt: '2026-02-01T10:00:00Z', updatedAt: '2026-04-10T11:00:00Z' },
  { id: 'dl_002', title: 'Suite SaaS Initech', contactId: 'ctc_002', amount: 45000, currency: 'USD', stage: 'proposal', status: 'open', expectedClose: '2026-05-30', ownerId: 'usr_001', createdAt: '2026-02-10T10:00:00Z', updatedAt: '2026-04-12T11:00:00Z' },
  { id: 'dl_003', title: 'POC Umbrella', contactId: 'ctc_003', amount: 8000, currency: 'USD', stage: 'qualified', status: 'open', expectedClose: '2026-07-15', ownerId: 'usr_002', createdAt: '2026-02-20T10:00:00Z', updatedAt: '2026-04-15T11:00:00Z' },
  { id: 'dl_004', title: 'Migración Hooli', contactId: 'ctc_004', amount: 250000, currency: 'USD', stage: 'won', status: 'closed', expectedClose: '2026-04-01', ownerId: 'usr_001', createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-04-01T11:00:00Z' },
  { id: 'dl_005', title: 'Pilot Pied Piper', contactId: 'ctc_005', amount: 15000, currency: 'USD', stage: 'lead', status: 'open', expectedClose: '2026-08-01', ownerId: 'usr_002', createdAt: '2026-03-01T10:00:00Z', updatedAt: '2026-04-01T11:00:00Z' },
  { id: 'dl_006', title: 'Renovación Aperture', contactId: 'ctc_006', amount: 90000, currency: 'USD', stage: 'negotiation', status: 'open', expectedClose: '2026-05-15', ownerId: 'usr_003', createdAt: '2026-03-05T10:00:00Z', updatedAt: '2026-04-20T11:00:00Z' },
  { id: 'dl_007', title: 'Onboarding Wonka', contactId: 'ctc_007', amount: 32000, currency: 'USD', stage: 'proposal', status: 'open', expectedClose: '2026-06-01', ownerId: 'usr_002', createdAt: '2026-03-20T10:00:00Z', updatedAt: '2026-04-22T11:00:00Z' },
  { id: 'dl_008', title: 'Expansión Stark', contactId: 'ctc_008', amount: 180000, currency: 'USD', stage: 'qualified', status: 'open', expectedClose: '2026-09-01', ownerId: 'usr_001', createdAt: '2026-04-05T10:00:00Z', updatedAt: '2026-05-01T11:00:00Z' },
  { id: 'dl_009', title: 'Servicios Globex Q2', contactId: 'ctc_001', amount: 22000, currency: 'USD', stage: 'lost', status: 'closed', expectedClose: '2026-03-01', ownerId: 'usr_003', createdAt: '2026-01-20T10:00:00Z', updatedAt: '2026-03-01T11:00:00Z' },
  { id: 'dl_010', title: 'Soporte Initech', contactId: 'ctc_002', amount: 12000, currency: 'USD', stage: 'won', status: 'closed', expectedClose: '2026-04-15', ownerId: 'usr_002', createdAt: '2026-02-15T10:00:00Z', updatedAt: '2026-04-15T11:00:00Z' },
];
