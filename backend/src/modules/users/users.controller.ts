import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { sendError, sendSuccess } from '../../utils/http';
import { getUserById, listUsers, updateUserProfile } from './users.service';

export const getUsers = async (_req: AuthRequest, res: Response) => {
  const users = await listUsers();
  return sendSuccess(res, users, 'Liste des utilisateurs récupérée');
};

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Utilisateur non authentifié', 401);
  }

  try {
    const user = await getUserById(req.user.userId);
    return sendSuccess(res, user, 'Profil récupéré');
  } catch (error) {
    return sendError(res, (error as Error).message, 404);
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Utilisateur non authentifié', 401);
  }

  const { fullName, companyName, country } = req.body;

  const updatedUser = await updateUserProfile(req.user.userId, {
    fullName,
    companyName,
    country
  });

  return sendSuccess(res, updatedUser, 'Profil mis à jour');
};
