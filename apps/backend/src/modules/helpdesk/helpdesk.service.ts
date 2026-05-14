import { applyPatch, Filterable, findOrThrow, nextId, nowIso, paginate, softDelete } from '../_shared/crud';
import { DomainError, ListResult } from '../_shared/types';
import { agents as seedAgents, tickets as seedTickets } from './helpdesk.data';
import { Agent, Ticket } from './helpdesk.types';

export interface HelpdeskService {
  list(q: Filterable & { priority?: string; agentId?: string }): ListResult<Ticket>;
  get(id: string): Ticket;
  create(input: Partial<Ticket>): Ticket;
  update(id: string, patch: Partial<Ticket>): Ticket;
  remove(id: string): { id: string };
  listAgents(q: Filterable): ListResult<Agent>;
  assign(ticketId: string, agentId: string): Ticket;
}

export class InMemoryHelpdeskService implements HelpdeskService {
  private tickets: Ticket[] = [...seedTickets];
  private agents: Agent[] = [...seedAgents];

  list(q: Filterable & { priority?: string; agentId?: string }): ListResult<Ticket> {
    const base = paginate(this.tickets, q, (t, n) => t.subject.toLowerCase().includes(n) || t.requesterEmail.toLowerCase().includes(n));
    let items = base.items;
    if (q.priority) items = items.filter((t) => t.priority === q.priority);
    if (q.agentId) items = items.filter((t) => t.agentId === q.agentId);
    return { ...base, items };
  }
  get(id: string): Ticket { return findOrThrow(this.tickets, id, 'Ticket'); }

  create(input: Partial<Ticket>): Ticket {
    if (!input.subject || !input.requesterEmail) {
      throw new DomainError('VALIDATION', 'subject y requesterEmail requeridos');
    }
    const t: Ticket = {
      id: nextId('tk'),
      subject: input.subject,
      description: input.description ?? '',
      requesterEmail: input.requesterEmail,
      agentId: input.agentId,
      status: input.status ?? 'open',
      priority: input.priority ?? 'normal',
      channel: input.channel ?? 'web',
      slaDueAt: input.slaDueAt ?? new Date(Date.now() + 86400000 * 2).toISOString(),
      tags: input.tags ?? [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.tickets.push(t);
    return t;
  }

  update(id: string, patch: Partial<Ticket>): Ticket {
    const idx = this.tickets.findIndex((t) => t.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Ticket ${id}`);
    this.tickets[idx] = applyPatch(this.tickets[idx], patch);
    return this.tickets[idx];
  }
  remove(id: string): { id: string } {
    const idx = this.tickets.findIndex((t) => t.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Ticket ${id}`);
    this.tickets[idx] = softDelete(this.tickets[idx]);
    return { id };
  }

  listAgents(q: Filterable): ListResult<Agent> {
    return paginate(this.agents, q, (a, n) => a.name.toLowerCase().includes(n));
  }

  assign(ticketId: string, agentId: string): Ticket {
    const t = findOrThrow(this.tickets, ticketId, 'Ticket');
    const a = this.agents.find((x) => x.id === agentId);
    if (!a) throw new DomainError('NOT_FOUND', `Agent ${agentId}`);
    return this.update(ticketId, { agentId, status: 'pending' });
  }
}

export const helpdeskService: HelpdeskService = new InMemoryHelpdeskService();
