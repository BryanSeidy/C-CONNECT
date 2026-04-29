import { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../utils/http';
import {
  createProduct,
  deleteProductById,
  getAllProducts,
  getProductById,
  updateProductById
} from './products.service';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const getProducts = async (req: Request, res: Response) => {
  const { country, category } = req.query;
  const products = await getAllProducts(country as string, category as string);
  return sendSuccess(res, products, 'Produits récupérés');
};

export const addProduct = async (req: AuthRequest, res: Response) => {
  const { name, description, price, country, category, stock } = req.body;

  if (!req.user) {
    return sendError(res, 'Utilisateur non authentifié', 401);
  }

  if (!name || !price || !country || !category || stock === undefined) {
    return sendError(res, 'name, price, country, category et stock sont obligatoires', 400);
  }

  const product = await createProduct({
    name,
    description,
    price: Number(price),
    country,
    category,
    stock: Number(stock),
    producerId: req.user.userId
  });

  return sendSuccess(res, product, 'Produit créé avec succès', 201);
};

export const getProduct = async (req: Request, res: Response) => {
  try {
    const product = await getProductById(Number(req.params.id));
    return sendSuccess(res, product, 'Produit récupéré');
  } catch (error) {
    return sendError(res, (error as Error).message, 404);
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Utilisateur non authentifié', 401);
  }

  try {
    const updatedProduct = await updateProductById(Number(req.params.id), req.user.userId, {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price !== undefined ? Number(req.body.price) : undefined,
      country: req.body.country,
      category: req.body.category,
      stock: req.body.stock !== undefined ? Number(req.body.stock) : undefined
    });

    return sendSuccess(res, updatedProduct, 'Produit mis à jour');
  } catch (error) {
    const message = (error as Error).message;
    const code = message.includes('autorisée') ? 403 : 404;
    return sendError(res, message, code);
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 'Utilisateur non authentifié', 401);
  }

  try {
    await deleteProductById(Number(req.params.id), req.user.userId);
    return sendSuccess(res, { id: Number(req.params.id) }, 'Produit supprimé');
  } catch (error) {
    const message = (error as Error).message;
    const code = message.includes('autorisée') ? 403 : 404;
    return sendError(res, message, code);
  }
};
