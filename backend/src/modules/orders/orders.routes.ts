import { Router } from 'express';
import {
  createOrderController,
  getOrdersController,
  updateOrderStatusController
} from './orders.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/', protect, createOrderController);
router.get('/', protect, getOrdersController);
router.patch('/:id/status', protect, updateOrderStatusController);

export default router;
