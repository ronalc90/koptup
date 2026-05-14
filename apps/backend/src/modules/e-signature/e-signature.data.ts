import { Envelope, Signer } from './e-signature.types';

const d = (days: number) => new Date(Date.now() + days * 86400000).toISOString();

export const envelopes: Envelope[] = [
  { id: 'env_001', title: 'Contrato Servicios Globex', documentUrl: '/docs/contrato_globex.pdf', senderEmail: 'legal@koptup.com', status: 'completed', expiresAt: d(-5), signerIds: ['sgn_001', 'sgn_002'], createdAt: d(-20), updatedAt: d(-3) },
  { id: 'env_002', title: 'NDA Initech', documentUrl: '/docs/nda_initech.pdf', senderEmail: 'legal@koptup.com', status: 'partial', expiresAt: d(7), signerIds: ['sgn_003', 'sgn_004'], createdAt: d(-3), updatedAt: d(-1) },
  { id: 'env_003', title: 'MSA Hooli', documentUrl: '/docs/msa_hooli.pdf', senderEmail: 'legal@koptup.com', status: 'sent', expiresAt: d(14), signerIds: ['sgn_005'], createdAt: d(-1), updatedAt: d(-1) },
  { id: 'env_004', title: 'Acuerdo confidencialidad Pied Piper', documentUrl: '/docs/nda_pp.pdf', senderEmail: 'legal@koptup.com', status: 'completed', expiresAt: d(-10), signerIds: ['sgn_006', 'sgn_007'], createdAt: d(-30), updatedAt: d(-15) },
  { id: 'env_005', title: 'Renovación Aperture', documentUrl: '/docs/renovacion_ap.pdf', senderEmail: 'sales@koptup.com', status: 'voided', expiresAt: d(-1), signerIds: ['sgn_008'], createdAt: d(-12), updatedAt: d(-2) },
  { id: 'env_006', title: 'SOW Stark Q2', documentUrl: '/docs/sow_stark.pdf', senderEmail: 'sales@koptup.com', status: 'draft', expiresAt: d(30), signerIds: [], createdAt: d(0), updatedAt: d(0) },
];

export const signers: Signer[] = [
  { id: 'sgn_001', envelopeId: 'env_001', name: 'María Rodríguez', email: 'maria@globex.com', order: 1, status: 'signed', signedAt: d(-4), ipAddress: '190.10.20.5', createdAt: d(-20), updatedAt: d(-4) },
  { id: 'sgn_002', envelopeId: 'env_001', name: 'Sandra Ortega', email: 'sandra@koptup.com', order: 2, status: 'signed', signedAt: d(-3), ipAddress: '190.10.30.7', createdAt: d(-20), updatedAt: d(-3) },
  { id: 'sgn_003', envelopeId: 'env_002', name: 'Andrés Pérez', email: 'andres@initech.com', order: 1, status: 'signed', signedAt: d(-1), ipAddress: '186.20.40.10', createdAt: d(-3), updatedAt: d(-1) },
  { id: 'sgn_004', envelopeId: 'env_002', name: 'Sandra Ortega', email: 'sandra@koptup.com', order: 2, status: 'pending', createdAt: d(-3), updatedAt: d(-3) },
  { id: 'sgn_005', envelopeId: 'env_003', name: 'Carlos Ruiz', email: 'carlos@hooli.com', order: 1, status: 'viewed', createdAt: d(-1), updatedAt: d(0) },
  { id: 'sgn_006', envelopeId: 'env_004', name: 'Sofía Mejía', email: 'sofia@pied-piper.io', order: 1, status: 'signed', signedAt: d(-16), createdAt: d(-30), updatedAt: d(-16) },
  { id: 'sgn_007', envelopeId: 'env_004', name: 'Sandra Ortega', email: 'sandra@koptup.com', order: 2, status: 'signed', signedAt: d(-15), createdAt: d(-30), updatedAt: d(-15) },
  { id: 'sgn_008', envelopeId: 'env_005', name: 'Jorge Castro', email: 'jorge@aperture.com', order: 1, status: 'declined', createdAt: d(-12), updatedAt: d(-2) },
];
