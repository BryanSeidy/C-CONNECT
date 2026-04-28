import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/http';
import { getMatchingProducts } from './matching.service';

export const matchingController = async (req: Request, res: Response) => {
  const { country, category, limit } = req.query;
  const products = await getMatchingProducts(
    country as string,
    category as string,
    limit ? Number(limit) : 10
  );
  return sendSuccess(res, products, 'Recommandations générées');
};
