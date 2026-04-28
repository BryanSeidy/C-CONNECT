import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { AppError } from '../../utils/app-error';

interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  companyName?: string;
  country?: string;
}

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });

  if (existingUser) {
    throw new AppError('Email déjà utilisé', 409);
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      fullName: input.fullName,
      role: input.role,
      companyName: input.companyName,
      country: input.country
    }
  });

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    companyName: user.companyName,
    country: user.country
  };
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError('Identifiants invalides', 401);
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new AppError('Identifiants invalides', 401);
  }

  const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, env.jwtSecret, {
    expiresIn: '1d'
  });

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
