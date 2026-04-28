import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/app-error';

export const listUsers = () =>
  prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      companyName: true,
      country: true,
      createdAt: true
    }
  });

export const getUserById = async (id: number) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      companyName: true,
      country: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw new AppError('Utilisateur introuvable', 404);
  }

  return user;
};

export const updateUserProfile = async (
  id: number,
  payload: { fullName?: string; companyName?: string; country?: string }
) =>
  prisma.user.update({
    where: { id },
    data: payload,
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      companyName: true,
      country: true,
      updatedAt: true
    }
  });
