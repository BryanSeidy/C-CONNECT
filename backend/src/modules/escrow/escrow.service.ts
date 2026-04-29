import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/app-error';

export const getEscrowByPaymentId = async (paymentId: number) => {
  const escrow = await prisma.escrow.findUnique({
    where: { paymentId },
    include: { payment: { include: { order: true } } }
  });

  if (!escrow) {
    throw new AppError('Escrow introuvable pour ce paiement', 404);
  }

  return escrow;
};

export const releaseEscrow = async (paymentId: number) => {
  const escrow = await prisma.escrow.findUnique({ where: { paymentId } });

  if (!escrow) {
    throw new AppError('Escrow introuvable pour ce paiement', 404);
  }

  if (escrow.status === 'RELEASED') {
    throw new AppError('Escrow déjà libéré', 400);
  }

  return prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: 'RELEASED' }
    });

    return tx.escrow.update({
      where: { paymentId },
      data: {
        status: 'RELEASED',
        releasedAt: new Date()
      },
      include: { payment: true }
    });
  });
};
