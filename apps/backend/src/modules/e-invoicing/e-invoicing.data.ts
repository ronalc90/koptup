import { CountryRegistry, EDocument } from './e-invoicing.types';

export const countries: CountryRegistry[] = [
  { code: 'CO', name: 'Colombia', authority: 'DIAN', format: 'UBL', active: true },
  { code: 'MX', name: 'México', authority: 'SAT', format: 'CFDI', active: true },
  { code: 'BR', name: 'Brasil', authority: 'SEFAZ', format: 'NF-e', active: true },
  { code: 'PE', name: 'Perú', authority: 'SUNAT', format: 'UBL', active: true },
  { code: 'CL', name: 'Chile', authority: 'SII', format: 'UBL', active: true },
  { code: 'PT', name: 'Portugal', authority: 'AT', format: 'SAF-T', active: false },
];

export const documents: EDocument[] = [
  { id: 'edoc_001', type: 'invoice', documentNumber: 'FE-001-2026', country: 'CO', taxAuthority: 'DIAN', issuer: 'KopTup S.A.S', receiver: 'Globex', amount: 15000, currency: 'COP', status: 'accepted', cufe: 'a1b2c3d4e5f6', xmlUrl: '/files/edoc_001.xml', pdfUrl: '/files/edoc_001.pdf', createdAt: '2026-04-30T10:00:00Z', updatedAt: '2026-04-30T10:05:00Z' },
  { id: 'edoc_002', type: 'invoice', documentNumber: 'FE-002-2026', country: 'CO', taxAuthority: 'DIAN', issuer: 'KopTup S.A.S', receiver: 'Initech', amount: 4500, currency: 'COP', status: 'transmitted', createdAt: '2026-05-01T10:00:00Z', updatedAt: '2026-05-01T10:02:00Z' },
  { id: 'edoc_003', type: 'credit-note', documentNumber: 'NC-001-2026', country: 'CO', taxAuthority: 'DIAN', issuer: 'KopTup S.A.S', receiver: 'Globex', amount: -500, currency: 'COP', status: 'accepted', createdAt: '2026-05-05T10:00:00Z', updatedAt: '2026-05-05T10:03:00Z' },
  { id: 'edoc_004', type: 'invoice', documentNumber: 'CFDI-101', country: 'MX', taxAuthority: 'SAT', issuer: 'KopTup MX', receiver: 'Hooli MX', amount: 25000, currency: 'MXN', status: 'signed', createdAt: '2026-05-08T10:00:00Z', updatedAt: '2026-05-08T10:01:00Z' },
  { id: 'edoc_005', type: 'invoice', documentNumber: 'NF-202', country: 'BR', taxAuthority: 'SEFAZ', issuer: 'KopTup BR', receiver: 'Stark BR', amount: 8000, currency: 'BRL', status: 'rejected', createdAt: '2026-05-09T10:00:00Z', updatedAt: '2026-05-09T10:10:00Z' },
  { id: 'edoc_006', type: 'invoice', documentNumber: 'FE-003-2026', country: 'CO', taxAuthority: 'DIAN', issuer: 'KopTup S.A.S', receiver: 'Pied Piper', amount: 7500, currency: 'COP', status: 'draft', createdAt: '2026-05-10T10:00:00Z', updatedAt: '2026-05-10T10:00:00Z' },
  { id: 'edoc_007', type: 'receipt', documentNumber: 'RC-501', country: 'PE', taxAuthority: 'SUNAT', issuer: 'KopTup PE', receiver: 'Umbrella PE', amount: 1200, currency: 'PEN', status: 'accepted', createdAt: '2026-05-11T10:00:00Z', updatedAt: '2026-05-11T10:02:00Z' },
  { id: 'edoc_008', type: 'invoice', documentNumber: 'FE-CL-301', country: 'CL', taxAuthority: 'SII', issuer: 'KopTup CL', receiver: 'Aperture CL', amount: 6000, currency: 'CLP', status: 'transmitted', createdAt: '2026-05-12T10:00:00Z', updatedAt: '2026-05-12T10:01:00Z' },
];
