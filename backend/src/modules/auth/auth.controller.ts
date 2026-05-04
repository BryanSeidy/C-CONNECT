import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import * as authService from './auth.service';
import { sendError, sendSuccess } from '../../utils/http';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role = Role.buyer } = req.body;

    if (!email || !password) {
      return sendError(res, 'email and password are required', 400);
    }

    if (!Object.values(Role).includes(role)) {
      return sendError(res, 'role must be buyer, seller or admin', 400);
    }

    const user = await authService.register({ email, password, role });
    return sendSuccess(res, user, 'User created successfully', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    const statusCode = 'statusCode' in (error as object) ? (error as { statusCode: number }).statusCode : 400;
    return sendError(res, message, statusCode);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'email and password are required', 400);
    }

    const payload = await authService.login(email, password);
    return sendSuccess(res, payload, 'Login successful');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    const statusCode = 'statusCode' in (error as object) ? (error as { statusCode: number }).statusCode : 401;
    return sendError(res, message, statusCode);
  }
};
