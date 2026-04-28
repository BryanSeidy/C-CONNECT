import { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../utils/http';
import { createProduct, getAllProducts, getProductById } from './products.service';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const getProducts = async (req: Request, res: Response) => {
  const { country, category } = req.query;
  const products = await getAllProducts(country as string, category as string);
  return sendSuccess(res, products);
};

export const addProduct = async (req: AuthRequest, res: Response) => {
  const { name, price, country, category, stock } = req.body;
  if (!req.user) return sendError(res, 'Utilisateur non authentifié', 401);

  const product = await createProduct({
    name,
    price: Number(price),
    country,
    category,
    stock: Number(stock),
    userId: req.user.userId
  });

  return sendSuccess(res, product, 201);
};

export const getProduct = async (req: Request, res: Response) => {
  const product = await getProductById(Number(req.params.id));
  if (!product) return sendError(res, 'Produit introuvable', 404);
  return sendSuccess(res, product);
};
