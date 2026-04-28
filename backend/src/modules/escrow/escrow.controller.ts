import { Request, Response } from 'express';
import { releaseEscrow } from './escrow.service';
import { sendSuccess } from '../../utils/http';

export const releaseEscrowController = async (req: Request, res: Response) => {
  const payment = await releaseEscrow(Number(req.params.paymentId));
  return sendSuccess(res, payment);
};
