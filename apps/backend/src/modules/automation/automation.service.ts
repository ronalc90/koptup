import { applyPatch, Filterable, findOrThrow, nextId, nowIso, paginate, softDelete } from '../_shared/crud';
import { DomainError, ListResult } from '../_shared/types';
import { runs as seedRuns, workflows as seedWorkflows } from './automation.data';
import { Run, Workflow } from './automation.types';

export interface AutomationService {
  list(q: Filterable): ListResult<Workflow>;
  get(id: string): Workflow;
  create(input: Partial<Workflow>): Workflow;
  update(id: string, patch: Partial<Workflow>): Workflow;
  remove(id: string): { id: string };
  listRuns(q: Filterable & { workflowId?: string }): ListResult<Run>;
  triggerRun(workflowId: string): Run;
}

export class InMemoryAutomationService implements AutomationService {
  private workflows: Workflow[] = [...seedWorkflows];
  private runs: Run[] = [...seedRuns];

  list(q: Filterable): ListResult<Workflow> {
    return paginate(this.workflows, q, (w, n) => w.name.toLowerCase().includes(n));
  }
  get(id: string): Workflow { return findOrThrow(this.workflows, id, 'Workflow'); }

  create(input: Partial<Workflow>): Workflow {
    if (!input.name || !input.trigger) throw new DomainError('VALIDATION', 'name y trigger requeridos');
    const w: Workflow = {
      id: nextId('wf'),
      name: input.name,
      description: input.description ?? '',
      trigger: input.trigger,
      status: input.status ?? 'draft',
      steps: input.steps ?? [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.workflows.push(w);
    return w;
  }

  update(id: string, patch: Partial<Workflow>): Workflow {
    const idx = this.workflows.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Workflow ${id}`);
    this.workflows[idx] = applyPatch(this.workflows[idx], patch);
    return this.workflows[idx];
  }
  remove(id: string): { id: string } {
    const idx = this.workflows.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Workflow ${id}`);
    this.workflows[idx] = softDelete(this.workflows[idx]);
    return { id };
  }

  listRuns(q: Filterable & { workflowId?: string }): ListResult<Run> {
    const base = paginate(this.runs, q);
    const items = q.workflowId ? base.items.filter((r) => r.workflowId === q.workflowId) : base.items;
    return { ...base, items };
  }

  triggerRun(workflowId: string): Run {
    const w = findOrThrow(this.workflows, workflowId, 'Workflow');
    if (w.status !== 'enabled') throw new DomainError('CONFLICT', `Workflow ${w.status} no se puede ejecutar`);
    const r: Run = {
      id: nextId('run'),
      workflowId,
      status: 'queued',
      startedAt: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.runs.push(r);
    this.update(workflowId, { lastRunAt: r.startedAt });
    return r;
  }
}

export const automationService: AutomationService = new InMemoryAutomationService();
