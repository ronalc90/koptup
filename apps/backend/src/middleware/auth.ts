import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as {
        id: string;
        email: string;
        role: string;
      };

      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          message: 'Token expired',
          code: 'TOKEN_EXPIRED',
        });
        return;
      }

      res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Forbidden - Insufficient permissions',
      });
      return;
    }

    next();
  };
};

export const generateAccessToken = (payload: {
  id: string;
  email: string;
  role: string;
}): string => {
  const jwtSecret = process.env.JWT_SECRET!;
  const expiresIn: string = process.env.JWT_EXPIRES_IN || '15m';

  return jwt.sign(payload, jwtSecret, { expiresIn } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: {
  id: string;
  email: string;
}): string => {
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;
  const expiresIn: string = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  return jwt.sign(payload, jwtRefreshSecret, { expiresIn } as jwt.SignOptions);
};

export const verifyRefreshToken = (token: string): any => {
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;
  return jwt.verify(token, jwtRefreshSecret);
};
