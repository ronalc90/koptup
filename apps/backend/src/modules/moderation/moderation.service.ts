import { applyPatch, Filterable, findOrThrow, nextId, nowIso, paginate, softDelete } from '../_shared/crud';
import { DomainError, ListResult } from '../_shared/types';
import { decisions as seedDecisions, items as seedItems } from './moderation.data';
import { Decision, ModerationItem } from './moderation.types';

export interface ModerationService {
  list(q: Filterable & { severity?: string }): ListResult<ModerationItem>;
  get(id: string): ModerationItem;
  create(input: Partial<ModerationItem>): ModerationItem;
  update(id: string, patch: Partial<ModerationItem>): ModerationItem;
  remove(id: string): { id: string };
  listDecisions(q: Filterable): ListResult<Decision>;
  decide(itemId: string, moderatorId: string, verdict: Decision['verdict'], reason: string): Decision;
}

export class InMemoryModerationService implements ModerationService {
  private items: ModerationItem[] = [...seedItems];
  private decisions: Decision[] = [...seedDecisions];

  list(q: Filterable & { severity?: string }): ListResult<ModerationItem> {
    const base = paginate(this.items, q, (i, n) => (i.contentExcerpt?.toLowerCase().includes(n) ?? false) || i.sourceUser.toLowerCase().includes(n));
    const items = q.severity ? base.items.filter((i) => i.severity === q.severity) : base.items;
    return { ...base, items };
  }
  get(id: string): ModerationItem { return findOrThrow(this.items, id, 'ModerationItem'); }

  create(input: Partial<ModerationItem>): ModerationItem {
    if (!input.contentType || !input.sourceUser) throw new DomainError('VALIDATION', 'contentType y sourceUser requeridos');
    const aiScore = input.aiScore ?? Math.random();
    const i: ModerationItem = {
      id: nextId('mod'),
      contentType: input.contentType,
      contentUrl: input.contentUrl,
      contentExcerpt: input.contentExcerpt,
      sourceUser: input.sourceUser,
      aiScore,
      flags: input.flags ?? [],
      status: 'pending',
      severity: aiScore > 0.9 ? 'critical' : aiScore > 0.7 ? 'high' : aiScore > 0.4 ? 'medium' : 'low',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.items.push(i);
    return i;
  }

  update(id: string, patch: Partial<ModerationItem>): ModerationItem {
    const idx = this.items.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `ModerationItem ${id}`);
    this.items[idx] = applyPatch(this.items[idx], patch);
    return this.items[idx];
  }
  remove(id: string): { id: string } {
    const idx = this.items.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `ModerationItem ${id}`);
    this.items[idx] = softDelete(this.items[idx]);
    return { id };
  }

  listDecisions(q: Filterable): ListResult<Decision> {
    return paginate(this.decisions, q, (d, n) => d.reason.toLowerCase().includes(n));
  }

  decide(itemId: string, moderatorId: string, verdict: Decision['verdict'], reason: string): Decision {
    const item = findOrThrow(this.items, itemId, 'ModerationItem');
    if (item.status !== 'pending') throw new DomainError('CONFLICT', `Item en estado ${item.status}`);
    const d: Decision = {
      id: nextId('dec'),
      itemId,
      moderatorId,
      verdict,
      reason,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.decisions.push(d);
    const status: ModerationItem['status'] = verdict === 'approve' ? 'approved' : verdict === 'reject' ? 'rejected' : 'escalated';
    this.update(itemId, { status });
    return d;
  }
}

export const moderationService: ModerationService = new InMemoryModerationService();
