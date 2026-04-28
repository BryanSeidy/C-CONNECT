import { Router } from 'express';
import { releaseEscrowController } from './escrow.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();
router.patch('/release/:paymentId', protect, releaseEscrowController);

export default router;
