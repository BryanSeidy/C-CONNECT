import { Router } from 'express';
import {
  addProduct,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct
} from './products.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', getProducts);
router.post('/', protect, addProduct);
router.get('/:id', getProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

export default router;
