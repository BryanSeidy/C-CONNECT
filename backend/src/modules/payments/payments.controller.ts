import { Response } from 'express';
import { PaymentStatus } from '@prisma/client';
import { sendError, sendSuccess } from '../../utils/http';
import { createPayment, getPaymentsByUser, updatePaymentStatus } from './payments.service';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const createPaymentController = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Utilisateur non authentifié', 401);
  }

  const { orderId, method = 'BANK_TRANSFER' } = req.body;

  if (!orderId) {
    return sendError(res, 'orderId est obligatoire', 400);
  }

  try {
    const payment = await createPayment(Number(orderId), method);
    return sendSuccess(res, payment, 'Paiement initialisé', 201);
  } catch (error) {
    const message = (error as Error).message;
    const code = message.includes('introuvable') ? 404 : message.includes('déjà') ? 409 : 400;
    return sendError(res, message, code);
  }
};

export const updatePaymentController = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Utilisateur non authentifié', 401);
  }

  const { status } = req.body;

  if (!status || !Object.values(PaymentStatus).includes(status)) {
    return sendError(res, 'Status de paiement invalide', 400);
  }

  try {
    const payment = await updatePaymentStatus(Number(req.params.id), status);
    return sendSuccess(res, payment, 'Statut de paiement mis à jour');
  } catch (error) {
    return sendError(res, (error as Error).message, 404);
  }
};

export const getPaymentsController = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Utilisateur non authentifié', 401);
  }

  const payments = await getPaymentsByUser(req.user.userId);
  return sendSuccess(res, payments, 'Paiements récupérés');
};
