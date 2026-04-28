import { Router } from 'express';
import { getUsers } from './users.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();
router.get('/', protect, getUsers);

export default router;
