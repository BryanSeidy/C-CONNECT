import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/app-error';

export const getAllProducts = (country?: string, category?: string) =>
  prisma.product.findMany({
    where: {
      isActive: true,
      ...(country ? { country } : {}),
      ...(category ? { category } : {})
    },
    include: {
      producer: {
        select: {
          id: true,
          email: true,
          fullName: true,
          companyName: true,
          country: true
        }
      }
    }
  });

export const createProduct = (data: {
  name: string;
  description?: string;
  price: number;
  country: string;
  category: string;
  stock: number;
  producerId: number;
}) => prisma.product.create({ data });

export const getProductById = async (id: number) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      producer: {
        select: {
          id: true,
          email: true,
          fullName: true,
          companyName: true,
          country: true
        }
      }
    }
  });

  if (!product || !product.isActive) {
    throw new AppError('Produit introuvable', 404);
  }

  return product;
};

export const updateProductById = async (
  id: number,
  producerId: number,
  payload: {
    name?: string;
    description?: string;
    price?: number;
    country?: string;
    category?: string;
    stock?: number;
  }
) => {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product || !product.isActive) {
    throw new AppError('Produit introuvable', 404);
  }

  if (product.producerId !== producerId) {
    throw new AppError('Action non autorisée sur ce produit', 403);
  }

  return prisma.product.update({ where: { id }, data: payload });
};

export const deleteProductById = async (id: number, producerId: number) => {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product || !product.isActive) {
    throw new AppError('Produit introuvable', 404);
  }

  if (product.producerId !== producerId) {
    throw new AppError('Action non autorisée sur ce produit', 403);
  }

  return prisma.product.update({
    where: { id },
    data: { isActive: false }
  });
};
