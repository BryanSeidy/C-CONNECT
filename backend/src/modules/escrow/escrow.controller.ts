import { Request, Response } from 'express';
import { getEscrowByPaymentId, releaseEscrow } from './escrow.service';
import { sendError, sendSuccess } from '../../utils/http';

export const getEscrowController = async (req: Request, res: Response) => {
  try {
    const escrow = await getEscrowByPaymentId(Number(req.params.paymentId));
    return sendSuccess(res, escrow, 'Détails escrow récupérés');
  } catch (error) {
    return sendError(res, (error as Error).message, 404);
  }
};

export const releaseEscrowController = async (req: Request, res: Response) => {
  try {
    const escrow = await releaseEscrow(Number(req.params.paymentId));
    return sendSuccess(res, escrow, 'Escrow libéré avec succès');
  } catch (error) {
    const message = (error as Error).message;
    const code = message.includes('déjà') ? 400 : 404;
    return sendError(res, message, code);
  }
};
