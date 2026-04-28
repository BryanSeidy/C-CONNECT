import { Request, Response } from 'express';
import { loginUser, registerUser } from './auth.service';
import { sendError, sendSuccess } from '../../utils/http';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role = 'BUYER' } = req.body;
    if (!email || !password) return sendError(res, 'Email et mot de passe obligatoires', 400);

    const user = await registerUser(email, password, role);
    return sendSuccess(res, user, 201);
  } catch (error) {
    return sendError(res, (error as Error).message, 400);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, (error as Error).message, 401);
  }
};
