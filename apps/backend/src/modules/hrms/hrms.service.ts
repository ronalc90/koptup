import { applyPatch, Filterable, findOrThrow, nextId, nowIso, paginate, softDelete } from '../_shared/crud';
import { DomainError, ListResult } from '../_shared/types';
import { candidates as seedCandidates, employees as seedEmployees } from './hrms.data';
import { Candidate, CandidateStage, Employee } from './hrms.types';

export interface HrmsService {
  list(q: Filterable & { department?: string }): ListResult<Employee>;
  get(id: string): Employee;
  create(input: Partial<Employee>): Employee;
  update(id: string, patch: Partial<Employee>): Employee;
  remove(id: string): { id: string };
  listCandidates(q: Filterable & { stage?: string }): ListResult<Candidate>;
  advanceCandidate(id: string, stage: CandidateStage): Candidate;
}

export class InMemoryHrmsService implements HrmsService {
  private employees: Employee[] = [...seedEmployees];
  private candidates: Candidate[] = [...seedCandidates];

  list(q: Filterable & { department?: string }): ListResult<Employee> {
    const base = paginate(this.employees, q, (e, n) => e.name.toLowerCase().includes(n) || e.email.toLowerCase().includes(n));
    const items = q.department ? base.items.filter((e) => e.department === q.department) : base.items;
    return { ...base, items };
  }
  get(id: string): Employee { return findOrThrow(this.employees, id, 'Employee'); }

  create(input: Partial<Employee>): Employee {
    if (!input.name || !input.email || !input.position) throw new DomainError('VALIDATION', 'name, email, position requeridos');
    const e: Employee = {
      id: nextId('emp'),
      name: input.name,
      email: input.email,
      position: input.position,
      department: input.department ?? 'General',
      status: input.status ?? 'active',
      hireDate: input.hireDate ?? nowIso().slice(0, 10),
      salary: input.salary ?? 0,
      managerId: input.managerId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.employees.push(e);
    return e;
  }

  update(id: string, patch: Partial<Employee>): Employee {
    const idx = this.employees.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Employee ${id}`);
    this.employees[idx] = applyPatch(this.employees[idx], patch);
    return this.employees[idx];
  }
  remove(id: string): { id: string } {
    const idx = this.employees.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Employee ${id}`);
    this.employees[idx] = softDelete(this.employees[idx]);
    return { id };
  }

  listCandidates(q: Filterable & { stage?: string }): ListResult<Candidate> {
    const base = paginate(this.candidates, q, (c, n) => c.name.toLowerCase().includes(n) || c.position.toLowerCase().includes(n));
    const items = q.stage ? base.items.filter((c) => c.stage === q.stage) : base.items;
    return { ...base, items };
  }

  advanceCandidate(id: string, stage: CandidateStage): Candidate {
    const idx = this.candidates.findIndex((c) => c.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Candidate ${id}`);
    this.candidates[idx] = { ...this.candidates[idx], stage, updatedAt: nowIso() };
    return this.candidates[idx];
  }
}

export const hrmsService: HrmsService = new InMemoryHrmsService();
