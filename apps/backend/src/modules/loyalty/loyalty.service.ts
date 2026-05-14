import { applyPatch, Filterable, findOrThrow, nextId, nowIso, paginate, softDelete } from '../_shared/crud';
import { DomainError, ListResult } from '../_shared/types';
import { members as seedMembers, rewards as seedRewards } from './loyalty.data';
import { Member, Reward, Tier } from './loyalty.types';

const TIER_THRESHOLDS: Array<{ tier: Tier; min: number }> = [
  { tier: 'platinum', min: 10000 },
  { tier: 'gold', min: 3000 },
  { tier: 'silver', min: 1000 },
  { tier: 'bronze', min: 0 },
];

export interface LoyaltyService {
  list(q: Filterable & { tier?: string }): ListResult<Member>;
  get(id: string): Member;
  create(input: Partial<Member>): Member;
  update(id: string, patch: Partial<Member>): Member;
  remove(id: string): { id: string };
  listRewards(memberId?: string): ReadonlyArray<Reward>;
  redeem(memberId: string, rewardName: string, pointsCost: number): { member: Member; reward: Reward };
}

export class InMemoryLoyaltyService implements LoyaltyService {
  private members: Member[] = [...seedMembers];
  private rewards: Reward[] = [...seedRewards];

  list(q: Filterable & { tier?: string }): ListResult<Member> {
    const base = paginate(this.members, q, (m, n) => m.name.toLowerCase().includes(n) || m.email.toLowerCase().includes(n));
    const items = q.tier ? base.items.filter((m) => m.tier === q.tier) : base.items;
    return { ...base, items };
  }
  get(id: string): Member { return findOrThrow(this.members, id, 'Member'); }

  create(input: Partial<Member>): Member {
    if (!input.name || !input.email) throw new DomainError('VALIDATION', 'name y email requeridos');
    const m: Member = {
      id: nextId('mem'),
      name: input.name,
      email: input.email,
      tier: 'bronze',
      points: 0,
      totalSpent: 0,
      joinedAt: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.members.push(m);
    return m;
  }

  update(id: string, patch: Partial<Member>): Member {
    const idx = this.members.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Member ${id}`);
    const updated = applyPatch(this.members[idx], patch);
    // Recalcular tier
    const tier = TIER_THRESHOLDS.find((t) => updated.totalSpent >= t.min)?.tier ?? 'bronze';
    this.members[idx] = { ...updated, tier };
    return this.members[idx];
  }
  remove(id: string): { id: string } {
    const idx = this.members.findIndex((x) => x.id === id);
    if (idx < 0) throw new DomainError('NOT_FOUND', `Member ${id}`);
    this.members[idx] = softDelete(this.members[idx]);
    return { id };
  }

  listRewards(memberId?: string): ReadonlyArray<Reward> {
    const all = this.rewards.filter((r) => !r.deletedAt);
    return memberId ? all.filter((r) => r.memberId === memberId) : all;
  }

  redeem(memberId: string, rewardName: string, pointsCost: number): { member: Member; reward: Reward } {
    const member = findOrThrow(this.members, memberId, 'Member');
    if (member.points < pointsCost) throw new DomainError('VALIDATION', 'Puntos insuficientes');
    const reward: Reward = {
      id: nextId('rw'),
      memberId,
      name: rewardName,
      description: rewardName,
      pointsCost,
      status: 'redeemed',
      redeemedAt: nowIso(),
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.rewards.push(reward);
    const updatedMember = this.update(memberId, { points: member.points - pointsCost, lastActivityAt: nowIso() });
    return { member: updatedMember, reward };
  }
}

export const loyaltyService: LoyaltyService = new InMemoryLoyaltyService();
