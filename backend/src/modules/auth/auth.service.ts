import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { AppError } from '../../utils/app-error';

interface RegisterInput {
  email: string;
  password: string;
  role: Role;
}

export const register = async ({ email, password, role }: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new AppError('Email already exists', 409);

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hashedPassword, role } });

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    companyName: user.companyName,
    country: user.country
  };
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('Invalid credentials', 401);

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) throw new AppError('Invalid credentials', 401);

  const token = jwt.sign({ userId: user.id, role: user.role }, env.jwtSecret, { expiresIn: '1d' });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      companyName: user.companyName,
      country: user.country
    }
  };
};
