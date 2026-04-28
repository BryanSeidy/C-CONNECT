import { prisma } from '../../config/prisma';

export const getMatchingProducts = async (country?: string, category?: string, limit = 10) => {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(country ? { country } : {}),
      ...(category ? { category } : {})
    },
    include: {
      producer: {
        select: {
          id: true,
          fullName: true,
          companyName: true,
          country: true
        }
      }
    },
    take: limit,
    orderBy: [{ stock: 'desc' }, { createdAt: 'desc' }]
  });

  return products.map((product) => ({
    product,
    score: 1
  }));
};
