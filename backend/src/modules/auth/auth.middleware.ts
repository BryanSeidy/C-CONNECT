import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../../config/env';
import { sendError } from '../../utils/http';

export interface AuthRequest extends Request {
  user?: { userId: number; role: Role };
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.split(' ')[1] : null;

  if (!token) {
    return sendError(res, 'Missing token', 401);
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { userId: number; role: Role };
    req.user = { userId: decoded.userId, role: decoded.role };
    return next();
  } catch {
    return sendError(res, 'Invalid token', 401);
  }
};

export const authorizeRole = (role: Role) => (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  if (req.user.role !== role) {
    return sendError(res, 'Forbidden', 403);
  }

  return next();
};
