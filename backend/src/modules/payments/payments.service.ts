import { prisma } from '../../config/prisma';

export const createPayment = (orderId: number) =>
  prisma.payment.create({ data: { orderId, status: 'PENDING' } });

export const updatePaymentStatus = (id: number, status: 'PENDING' | 'PAID' | 'RELEASED') =>
  prisma.payment.update({ where: { id }, data: { status } });
