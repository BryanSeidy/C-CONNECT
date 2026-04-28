import { Router } from 'express';
import {
  createPaymentController,
  getPaymentsController,
  updatePaymentController
} from './payments.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/', protect, createPaymentController);
router.get('/', protect, getPaymentsController);
router.patch('/:id', protect, updatePaymentController);

export default router;
