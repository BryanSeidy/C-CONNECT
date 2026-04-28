import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { loginUser, registerUser } from './auth.service';
import { sendError, sendSuccess } from '../../utils/http';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, role = UserRole.BUYER, companyName, country } = req.body;

    if (!email || !password || !fullName) {
      return sendError(res, 'email, password et fullName sont obligatoires', 400);
    }

    const user = await registerUser({
      email,
      password,
      fullName,
      role,
      companyName,
      country
    });

    return sendSuccess(res, user, 'Utilisateur créé avec succès', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur de création de compte';
    const statusCode = 'statusCode' in (error as object) ? (error as { statusCode: number }).statusCode : 400;
    return sendError(res, message, statusCode);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'email et password sont obligatoires', 400);
    }

    const result = await loginUser(email, password);

    return sendSuccess(res, result, 'Connexion réussie');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur de connexion';
    const statusCode = 'statusCode' in (error as object) ? (error as { statusCode: number }).statusCode : 401;
    return sendError(res, message, statusCode);
  }
};
