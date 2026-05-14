import { Run, Workflow } from './automation.types';

const t = (d: number) => new Date(Date.now() - d * 60000).toISOString();

export const workflows: Workflow[] = [
  { id: 'wf_001', name: 'Sync CRM → ERP diariamente', description: 'Pasa deals cerrados a invoicing', trigger: 'schedule', status: 'enabled', steps: [{ name: 'fetch-deals', type: 'http' }, { name: 'create-invoice', type: 'http' }, { name: 'notify', type: 'slack' }], lastRunAt: t(120), createdAt: '2026-01-15T00:00:00Z', updatedAt: t(120) },
  { id: 'wf_002', name: 'Notificar tickets urgentes', description: 'Slack al equipo si P1', trigger: 'webhook', status: 'enabled', steps: [{ name: 'check-priority', type: 'filter' }, { name: 'notify-slack', type: 'slack' }], lastRunAt: t(15), createdAt: '2026-02-01T00:00:00Z', updatedAt: t(15) },
  { id: 'wf_003', name: 'Backup BD semanal', description: 'Snapshot domingos 02:00', trigger: 'schedule', status: 'enabled', steps: [{ name: 'snapshot', type: 'shell' }, { name: 'upload-s3', type: 'aws' }], lastRunAt: t(60 * 24 * 3), createdAt: '2026-01-01T00:00:00Z', updatedAt: t(60 * 24 * 3) },
  { id: 'wf_004', name: 'Onboarding empleado', description: 'Crear cuentas en SaaS', trigger: 'manual', status: 'enabled', steps: [{ name: 'create-gsuite', type: 'http' }, { name: 'create-slack', type: 'http' }, { name: 'create-github', type: 'http' }], lastRunAt: t(60 * 24), createdAt: '2026-02-15T00:00:00Z', updatedAt: t(60 * 24) },
  { id: 'wf_005', name: 'Generar reporte mensual', description: 'PDF + email', trigger: 'schedule', status: 'disabled', steps: [{ name: 'gen-report', type: 'script' }, { name: 'send-email', type: 'email' }], createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-03-10T00:00:00Z' },
  { id: 'wf_006', name: 'Procesar pagos fallidos', description: 'Reintento automático', trigger: 'schedule', status: 'enabled', steps: [{ name: 'find-failed', type: 'db' }, { name: 'retry-charge', type: 'http' }], lastRunAt: t(30), createdAt: '2026-03-15T00:00:00Z', updatedAt: t(30) },
];

export const runs: Run[] = [
  { id: 'run_001', workflowId: 'wf_001', status: 'success', startedAt: t(120), finishedAt: t(118), durationMs: 120000, output: { deals: 3, invoices: 3 }, createdAt: t(120), updatedAt: t(118) },
  { id: 'run_002', workflowId: 'wf_002', status: 'success', startedAt: t(15), finishedAt: t(15), durationMs: 2400, output: { notified: 1 }, createdAt: t(15), updatedAt: t(15) },
  { id: 'run_003', workflowId: 'wf_002', status: 'failed', startedAt: t(45), finishedAt: t(44), durationMs: 30000, error: 'Slack API timeout', createdAt: t(45), updatedAt: t(44) },
  { id: 'run_004', workflowId: 'wf_001', status: 'success', startedAt: t(60 * 24), finishedAt: t(60 * 24 - 2), durationMs: 120000, output: { deals: 5, invoices: 5 }, createdAt: t(60 * 24), updatedAt: t(60 * 24 - 2) },
  { id: 'run_005', workflowId: 'wf_004', status: 'running', startedAt: t(2), createdAt: t(2), updatedAt: t(2) },
  { id: 'run_006', workflowId: 'wf_006', status: 'queued', startedAt: t(0), createdAt: t(0), updatedAt: t(0) },
  { id: 'run_007', workflowId: 'wf_003', status: 'success', startedAt: t(60 * 24 * 3), finishedAt: t(60 * 24 * 3 - 30), durationMs: 1800000, output: { sizeGb: 12.5 }, createdAt: t(60 * 24 * 3), updatedAt: t(60 * 24 * 3 - 30) },
];
