import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { createOrder, getOrders } from './orders.service';
import { sendError, sendSuccess } from '../../utils/http';

export const createOrderController = async (req: AuthRequest, res: Response) => {
  if (!req.user) return sendError(res, 'Utilisateur non authentifié', 401);
  const { total } = req.body;
  const order = await createOrder(req.user.userId, Number(total));
  return sendSuccess(res, order, 201);
};

export const getOrdersController = async (req: AuthRequest, res: Response) => {
  if (!req.user) return sendError(res, 'Utilisateur non authentifié', 401);
  const orders = await getOrders(req.user.userId);
  return sendSuccess(res, orders);
};
