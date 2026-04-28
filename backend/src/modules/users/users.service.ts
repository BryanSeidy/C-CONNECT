import { prisma } from '../../config/prisma';

export const listUsers = () => prisma.user.findMany({ select: { id: true, email: true, role: true } });
