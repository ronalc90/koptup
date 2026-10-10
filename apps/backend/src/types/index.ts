import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string;
    /** Sesión (dispositivo) del token de acceso; ver services/session.service.ts. */
    sid?: string;
  };
  /** Lo llena `requireStaffOrDemoAccess`: por qué se permitió el acceso. */
  demoAccess?: {
    slug: string;
    reason: 'staff' | 'public' | 'grant' | 'login_required' | 'no_access';
    grantId?: string;
  };
  /** Lo llena `aiGate` (middleware/ai-gate.ts): si la petición puede usar la IA. */
  aiGate?: {
    allowed: boolean;
    code?: 'budget_exhausted' | 'ai_unavailable' | 'ai_user_limit';
    message?: string;
  };
}

export interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
