import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
  /** Lo llena `requireStaffOrDemoAccess`: por qué se permitió el acceso. */
  demoAccess?: {
    slug: string;
    reason: 'staff' | 'public' | 'grant' | 'login_required' | 'no_access';
    grantId?: string;
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
