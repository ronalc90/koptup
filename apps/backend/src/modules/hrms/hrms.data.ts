import { Candidate, Employee } from './hrms.types';

export const employees: Employee[] = [
  { id: 'emp_001', name: 'Sandra Ortega', email: 'sandra@koptup.com', position: 'CEO', department: 'Ejecutivo', status: 'active', hireDate: '2024-01-01', salary: 15000, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'emp_002', name: 'Mateo Acosta', email: 'mateo@koptup.com', position: 'CTO', department: 'Tecnología', status: 'active', hireDate: '2024-02-01', salary: 12000, managerId: 'emp_001', createdAt: '2024-02-01T00:00:00Z', updatedAt: '2024-02-01T00:00:00Z' },
  { id: 'emp_003', name: 'Juliana Henao', email: 'juliana@koptup.com', position: 'Senior Engineer', department: 'Tecnología', status: 'active', hireDate: '2024-03-15', salary: 7500, managerId: 'emp_002', createdAt: '2024-03-15T00:00:00Z', updatedAt: '2024-03-15T00:00:00Z' },
  { id: 'emp_004', name: 'Tomás Bedoya', email: 'tomas@koptup.com', position: 'Engineer', department: 'Tecnología', status: 'active', hireDate: '2025-01-10', salary: 5000, managerId: 'emp_002', createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },
  { id: 'emp_005', name: 'Natalia Pérez', email: 'natalia@koptup.com', position: 'HR Manager', department: 'RRHH', status: 'on-leave', hireDate: '2024-05-01', salary: 6500, managerId: 'emp_001', createdAt: '2024-05-01T00:00:00Z', updatedAt: '2026-04-01T00:00:00Z' },
  { id: 'emp_006', name: 'Rafael Castaño', email: 'rafael@koptup.com', position: 'Sales Lead', department: 'Ventas', status: 'active', hireDate: '2024-06-01', salary: 7000, managerId: 'emp_001', createdAt: '2024-06-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z' },
  { id: 'emp_007', name: 'Lucas Murillo', email: 'lucas@koptup.com', position: 'Designer', department: 'Producto', status: 'active', hireDate: '2025-03-01', salary: 4500, managerId: 'emp_002', createdAt: '2025-03-01T00:00:00Z', updatedAt: '2025-03-01T00:00:00Z' },
  { id: 'emp_008', name: 'Andrea Quiñones', email: 'andrea@koptup.com', position: 'QA Engineer', department: 'Tecnología', status: 'terminated', hireDate: '2024-08-15', salary: 4200, managerId: 'emp_002', createdAt: '2024-08-15T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' },
];

export const candidates: Candidate[] = [
  { id: 'cand_001', name: 'Alejandro Rivas', email: 'alex.rivas@mail.com', position: 'Senior Engineer', stage: 'interview', source: 'LinkedIn', score: 85, createdAt: '2026-04-01T00:00:00Z', updatedAt: '2026-04-20T00:00:00Z' },
  { id: 'cand_002', name: 'Daniela Castro', email: 'dani.castro@mail.com', position: 'Product Manager', stage: 'screening', source: 'Referral', score: 78, createdAt: '2026-04-15T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
  { id: 'cand_003', name: 'Felipe Echeverri', email: 'felipe.e@mail.com', position: 'Senior Engineer', stage: 'offer', source: 'LinkedIn', score: 92, createdAt: '2026-03-20T00:00:00Z', updatedAt: '2026-05-05T00:00:00Z' },
  { id: 'cand_004', name: 'Mariana Cuesta', email: 'mariana.c@mail.com', position: 'Designer', stage: 'applied', source: 'Indeed', score: 65, createdAt: '2026-05-10T00:00:00Z', updatedAt: '2026-05-10T00:00:00Z' },
  { id: 'cand_005', name: 'Brayan Salgado', email: 'brayan.s@mail.com', position: 'QA Engineer', stage: 'hired', source: 'Referral', score: 88, createdAt: '2026-02-15T00:00:00Z', updatedAt: '2026-04-15T00:00:00Z' },
  { id: 'cand_006', name: 'Valentina Ríos', email: 'vale.rios@mail.com', position: 'Senior Engineer', stage: 'rejected', source: 'LinkedIn', score: 55, createdAt: '2026-03-10T00:00:00Z', updatedAt: '2026-03-25T00:00:00Z' },
  { id: 'cand_007', name: 'Esteban Pulido', email: 'esteban.p@mail.com', position: 'DevOps', stage: 'interview', source: 'Indeed', score: 80, createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-05-08T00:00:00Z' },
];
