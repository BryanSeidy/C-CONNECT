import { getAllProducts } from '../products/products.service';

export const getMatchingProducts = (country?: string, category?: string) =>
  getAllProducts(country, category);
