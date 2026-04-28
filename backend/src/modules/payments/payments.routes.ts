import { Router } from 'express';
import { createPaymentController, updatePaymentController } from './payments.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/', protect, createPaymentController);
router.patch('/:id', protect, updatePaymentController);

export default router;
