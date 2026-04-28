import { Router } from 'express';
import { getEscrowController, releaseEscrowController } from './escrow.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/:paymentId', protect, getEscrowController);
router.patch('/release/:paymentId', protect, releaseEscrowController);

export default router;
