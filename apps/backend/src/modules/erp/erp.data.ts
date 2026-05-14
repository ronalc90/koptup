import { Account, Invoice } from './erp.types';

export const accounts: Account[] = [
  { id: 'acc_001', legalName: 'Globex S.A.S', taxId: '900111222-1', country: 'CO', balance: 45000, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'acc_002', legalName: 'Initech Ltda', taxId: '900222333-2', country: 'CO', balance: 12000, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'acc_003', legalName: 'Umbrella Co', taxId: '900333444-3', country: 'CO', balance: 0, createdAt: '2026-01-05T00:00:00Z', updatedAt: '2026-01-05T00:00:00Z' },
  { id: 'acc_004', legalName: 'Hooli Corp', taxId: '900444555-4', country: 'US', balance: 80000, createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z' },
  { id: 'acc_005', legalName: 'Pied Piper Inc', taxId: '900555666-5', country: 'US', balance: 5000, createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-01-15T00:00:00Z' },
];

export const invoices: Invoice[] = [
  { id: 'inv_001', number: 'FE-2026-0001', accountId: 'acc_001', amount: 15000, currency: 'USD', dueDate: '2026-05-30', status: 'issued', lineItems: [{ description: 'Licencia anual', qty: 1, unit: 15000 }], createdAt: '2026-04-30T10:00:00Z', updatedAt: '2026-04-30T10:00:00Z' },
  { id: 'inv_002', number: 'FE-2026-0002', accountId: 'acc_002', amount: 4500, currency: 'USD', dueDate: '2026-05-15', status: 'paid', lineItems: [{ description: 'Soporte', qty: 3, unit: 1500 }], createdAt: '2026-04-15T10:00:00Z', updatedAt: '2026-05-15T10:00:00Z' },
  { id: 'inv_003', number: 'FE-2026-0003', accountId: 'acc_003', amount: 2000, currency: 'USD', dueDate: '2026-04-10', status: 'overdue', lineItems: [{ description: 'Consultoría', qty: 10, unit: 200 }], createdAt: '2026-03-10T10:00:00Z', updatedAt: '2026-04-10T10:00:00Z' },
  { id: 'inv_004', number: 'FE-2026-0004', accountId: 'acc_004', amount: 32000, currency: 'USD', dueDate: '2026-06-01', status: 'issued', lineItems: [{ description: 'Implementación', qty: 1, unit: 32000 }], createdAt: '2026-05-01T10:00:00Z', updatedAt: '2026-05-01T10:00:00Z' },
  { id: 'inv_005', number: 'FE-2026-0005', accountId: 'acc_001', amount: 1200, currency: 'USD', dueDate: '2026-06-15', status: 'draft', lineItems: [{ description: 'Horas extra', qty: 8, unit: 150 }], createdAt: '2026-05-10T10:00:00Z', updatedAt: '2026-05-10T10:00:00Z' },
  { id: 'inv_006', number: 'FE-2026-0006', accountId: 'acc_005', amount: 7500, currency: 'USD', dueDate: '2026-05-25', status: 'issued', lineItems: [{ description: 'POC', qty: 1, unit: 7500 }], createdAt: '2026-04-25T10:00:00Z', updatedAt: '2026-04-25T10:00:00Z' },
  { id: 'inv_007', number: 'FE-2026-0007', accountId: 'acc_002', amount: 900, currency: 'USD', dueDate: '2026-05-20', status: 'paid', lineItems: [{ description: 'Mantenimiento', qty: 1, unit: 900 }], createdAt: '2026-04-20T10:00:00Z', updatedAt: '2026-05-18T10:00:00Z' },
  { id: 'inv_008', number: 'FE-2026-0008', accountId: 'acc_004', amount: 18000, currency: 'USD', dueDate: '2026-07-01', status: 'issued', lineItems: [{ description: 'Migración', qty: 1, unit: 18000 }], createdAt: '2026-05-12T10:00:00Z', updatedAt: '2026-05-12T10:00:00Z' },
  { id: 'inv_009', number: 'FE-2026-0009', accountId: 'acc_003', amount: 500, currency: 'USD', dueDate: '2026-03-15', status: 'void', lineItems: [{ description: 'Cancelada', qty: 1, unit: 500 }], createdAt: '2026-02-15T10:00:00Z', updatedAt: '2026-03-20T10:00:00Z' },
  { id: 'inv_010', number: 'FE-2026-0010', accountId: 'acc_001', amount: 22000, currency: 'USD', dueDate: '2026-06-30', status: 'issued', lineItems: [{ description: 'Q2 Servicios', qty: 1, unit: 22000 }], createdAt: '2026-05-08T10:00:00Z', updatedAt: '2026-05-08T10:00:00Z' },
];
