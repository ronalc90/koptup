import { Plan, Tenant } from './saas-platform.types';

export const plans: Plan[] = [
  { id: 'plan_starter', name: 'Starter', pricePerMonth: 29, currency: 'USD', features: ['basic-crud', 'email-support'], seatLimit: 5 },
  { id: 'plan_pro', name: 'Pro', pricePerMonth: 99, currency: 'USD', features: ['basic-crud', 'priority-support', 'integrations', 'api-access'], seatLimit: 25 },
  { id: 'plan_enterprise', name: 'Enterprise', pricePerMonth: 499, currency: 'USD', features: ['basic-crud', 'sla-99.99', 'integrations', 'api-access', 'sso', 'dedicated-csm'], seatLimit: 250 },
  { id: 'plan_trial', name: 'Trial 14d', pricePerMonth: 0, currency: 'USD', features: ['basic-crud'], seatLimit: 3 },
];

export const tenants: Tenant[] = [
  { id: 'tnt_001', name: 'Globex', subdomain: 'globex', planId: 'plan_enterprise', status: 'active', seats: 120, region: 'us-east-1', ownerEmail: 'admin@globex.com', createdAt: '2025-06-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'tnt_002', name: 'Initech', subdomain: 'initech', planId: 'plan_pro', status: 'active', seats: 18, region: 'us-east-1', ownerEmail: 'admin@initech.com', createdAt: '2025-08-01T00:00:00Z', updatedAt: '2026-02-15T00:00:00Z' },
  { id: 'tnt_003', name: 'Umbrella Co', subdomain: 'umbrella', planId: 'plan_starter', status: 'trial', seats: 3, region: 'eu-west-1', ownerEmail: 'admin@umbrella.co', createdAt: '2026-05-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
  { id: 'tnt_004', name: 'Hooli', subdomain: 'hooli', planId: 'plan_enterprise', status: 'active', seats: 450, region: 'us-west-2', ownerEmail: 'admin@hooli.com', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z' },
  { id: 'tnt_005', name: 'Pied Piper', subdomain: 'piedpiper', planId: 'plan_pro', status: 'active', seats: 22, region: 'us-east-1', ownerEmail: 'admin@pied-piper.io', createdAt: '2025-11-01T00:00:00Z', updatedAt: '2026-04-01T00:00:00Z' },
  { id: 'tnt_006', name: 'Aperture', subdomain: 'aperture', planId: 'plan_pro', status: 'suspended', seats: 15, region: 'eu-central-1', ownerEmail: 'admin@aperture.com', createdAt: '2025-04-01T00:00:00Z', updatedAt: '2026-04-15T00:00:00Z' },
  { id: 'tnt_007', name: 'Wonka Industries', subdomain: 'wonka', planId: 'plan_starter', status: 'active', seats: 4, region: 'us-east-1', ownerEmail: 'admin@wonka.com', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-04-20T00:00:00Z' },
  { id: 'tnt_008', name: 'Stark Inc', subdomain: 'stark', planId: 'plan_enterprise', status: 'active', seats: 200, region: 'us-west-2', ownerEmail: 'admin@stark.com', createdAt: '2024-09-01T00:00:00Z', updatedAt: '2026-05-01T00:00:00Z' },
  { id: 'tnt_009', name: 'Cyberdyne', subdomain: 'cyberdyne', planId: 'plan_trial', status: 'cancelled', seats: 0, region: 'us-east-1', ownerEmail: 'admin@cyberdyne.com', createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-03-20T00:00:00Z' },
];
