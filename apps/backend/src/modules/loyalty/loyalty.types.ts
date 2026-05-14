import { BaseEntity } from '../_shared/types';

export type Tier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type RewardStatus = 'active' | 'redeemed' | 'expired';

export interface Member extends BaseEntity {
  name: string;
  email: string;
  tier: Tier;
  points: number;
  totalSpent: number;
  joinedAt: string;
  lastActivityAt?: string;
}

export interface Reward extends BaseEntity {
  memberId: string;
  name: string;
  description: string;
  pointsCost: number;
  status: RewardStatus;
  redeemedAt?: string;
  expiresAt: string;
}
