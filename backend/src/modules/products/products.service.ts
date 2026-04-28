import { prisma } from '../../config/prisma';

export const getAllProducts = (country?: string, category?: string) =>
  prisma.product.findMany({
    where: {
      ...(country ? { country } : {}),
      ...(category ? { category } : {})
    },
    include: { user: { select: { id: true, email: true } } }
  });

export const createProduct = (data: {
  name: string;
  price: number;
  country: string;
  category: string;
  stock: number;
  userId: number;
}) => prisma.product.create({ data });

export const getProductById = (id: number) =>
  prisma.product.findUnique({ where: { id }, include: { user: true } });
