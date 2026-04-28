import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/http';
import { createPayment, updatePaymentStatus } from './payments.service';

export const createPaymentController = async (req: Request, res: Response) => {
  const { orderId } = req.body;
  const payment = await createPayment(Number(orderId));
  return sendSuccess(res, payment, 201);
};

export const updatePaymentController = async (req: Request, res: Response) => {
  const { status } = req.body;
  const payment = await updatePaymentStatus(Number(req.params.id), status);
  return sendSuccess(res, payment);
};
