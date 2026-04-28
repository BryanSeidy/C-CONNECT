import { Router } from 'express';
import { addProduct, getProduct, getProducts } from './products.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', getProducts);
router.post('/', protect, addProduct);
router.get('/:id', getProduct);

export default router;
