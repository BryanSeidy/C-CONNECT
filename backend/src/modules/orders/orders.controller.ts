import { Response } from 'express';
import { OrderStatus } from '@prisma/client';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { createOrder, getOrders, updateOrderStatus } from './orders.service';
import { sendError, sendSuccess } from '../../utils/http';

export const createOrderController = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Utilisateur non authentifié', 401);
  }

  const { productId, quantity } = req.body;

  if (!productId || !quantity) {
    return sendError(res, 'productId et quantity sont obligatoires', 400);
  }

  try {
    const order = await createOrder(req.user.userId, Number(productId), Number(quantity));
    return sendSuccess(res, order, 'Commande créée avec succès', 201);
  } catch (error) {
    const message = (error as Error).message;
    const code = message.includes('autorisée') ? 403 : message.includes('introuvable') ? 404 : 400;
    return sendError(res, message, code);
  }
};

export const getOrdersController = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Utilisateur non authentifié', 401);
  }

  const orders = await getOrders(req.user.userId);
  return sendSuccess(res, orders, 'Commandes récupérées');
};

export const updateOrderStatusController = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Utilisateur non authentifié', 401);
  }

  const { status } = req.body;

  if (!status || !Object.values(OrderStatus).includes(status)) {
    return sendError(res, 'Status invalide', 400);
  }

  try {
    const order = await updateOrderStatus(Number(req.params.id), req.user.userId, status);
    return sendSuccess(res, order, 'Statut de commande mis à jour');
  } catch (error) {
    const message = (error as Error).message;
    const code = message.includes('autorisée') ? 403 : 404;
    return sendError(res, message, code);
  }
};
