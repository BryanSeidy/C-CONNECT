import { PaymentStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/app-error';

export const createPayment = async (orderId: number, method: string) => {
  const existingPayment = await prisma.payment.findUnique({ where: { orderId } });

  if (existingPayment) {
    throw new AppError('Un paiement existe déjà pour cette commande', 409);
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) {
    throw new AppError('Commande introuvable', 404);
  }

  return prisma.payment.create({
    data: {
      orderId,
      amount: order.total,
      method,
      status: PaymentStatus.PENDING,
      escrow: {
        create: {
          status: 'HOLDING'
        }
      }
    },
    include: {
      escrow: true
    }
  });
};

export const updatePaymentStatus = async (id: number, status: PaymentStatus) => {
  const payment = await prisma.payment.findUnique({ where: { id } });

  if (!payment) {
    throw new AppError('Paiement introuvable', 404);
  }

  return prisma.payment.update({
    where: { id },
    data: { status },
    include: { escrow: true }
  });
};

export const getPaymentsByUser = (userId: number) =>
  prisma.payment.findMany({
    where: {
      order: {
        OR: [{ buyerId: userId }, { sellerId: userId }]
      }
    },
    include: {
      order: true,
      escrow: true
    }
  });
