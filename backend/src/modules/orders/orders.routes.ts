import { Router } from 'express';
import { createOrderController, getOrdersController } from './orders.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/', protect, createOrderController);
router.get('/', protect, getOrdersController);

export default router;
