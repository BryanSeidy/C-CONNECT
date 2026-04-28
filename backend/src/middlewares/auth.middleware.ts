import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { env } from '../config/env';
import { sendError } from '../utils/http';

export interface AuthRequest extends Request {
  user?: { userId: number; email: string; role: UserRole };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return sendError(res, 'Token manquant', 401);
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as {
      userId: number;
      email: string;
      role: UserRole;
    };

    req.user = payload;
    return next();
  } catch {
    return sendError(res, 'Token invalide', 401);
  }
};
