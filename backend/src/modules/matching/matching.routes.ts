import { Router } from 'express';
import { matchingController } from './matching.controller';

const router = Router();
router.get('/', matchingController);

export default router;
