import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';

export const registerUser = async (email: string, password: string, role: string) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('Email déjà utilisé');

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, role }
  });

  return { id: user.id, email: user.email, role: user.role };
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new Error('Identifiants invalides');

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) throw new Error('Identifiants invalides');

  const token = jwt.sign({ userId: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: '1d'
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  };
};
