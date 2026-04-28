import { prisma } from '../../config/prisma';

export const createOrder = (userId: number, total: number) =>
  prisma.order.create({ data: { userId, total, status: 'PENDING' } });

export const getOrders = (userId: number) =>
  prisma.order.findMany({ where: { userId }, include: { payment: true } });
