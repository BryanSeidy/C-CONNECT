import { OrderStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/app-error';

export const createOrder = async (buyerId: number, productId: number, quantity: number) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product || !product.isActive) {
    throw new AppError('Produit indisponible', 404);
  }

  if (quantity <= 0) {
    throw new AppError('La quantité doit être supérieure à 0', 400);
  }

  if (product.stock < quantity) {
    throw new AppError('Stock insuffisant', 400);
  }

  const total = product.price * quantity;

  const order = await prisma.order.create({
    data: {
      buyerId,
      sellerId: product.producerId,
      productId,
      quantity,
      unitPrice: product.price,
      total,
      status: OrderStatus.PENDING
    },
    include: { product: true }
  });

  await prisma.product.update({
    where: { id: product.id },
    data: { stock: { decrement: quantity } }
  });

  return order;
};

export const getOrders = (userId: number) =>
  prisma.order.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }]
    },
    include: {
      payment: true,
      product: {
        select: { id: true, name: true, category: true, country: true }
      }
    }
  });

export const updateOrderStatus = async (id: number, userId: number, status: OrderStatus) => {
  const order = await prisma.order.findUnique({ where: { id } });

  if (!order) {
    throw new AppError('Commande introuvable', 404);
  }

  if (order.buyerId !== userId && order.sellerId !== userId) {
    throw new AppError('Action non autorisée sur cette commande', 403);
  }

  return prisma.order.update({ where: { id }, data: { status } });
};
