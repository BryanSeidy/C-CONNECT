import { Router } from 'express';
import { getMyProfile, getUsers, updateMyProfile } from './users.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', protect, getUsers);
router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateMyProfile);

export default router;
