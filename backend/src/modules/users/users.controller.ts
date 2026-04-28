import { Request, Response } from 'express';
import { listUsers } from './users.service';
import { sendSuccess } from '../../utils/http';

export const getUsers = async (_req: Request, res: Response) => {
  const users = await listUsers();
  return sendSuccess(res, users);
};
