import { Router } from 'express';
import { body } from 'express-validator';
import { login, register, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/auth.js';

const router = Router();

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ],
  login
);

router.post(
  '/register',
  authenticate,
  authorize('CEO', 'HR'),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().notEmpty(),
    body('role').isIn(['CEO', 'HR', 'PROJECT_LEAD', 'QUALITY_REVIEWER', 'TAKER']),
  ],
  register
);

router.get('/me', authenticate, getMe);

export default router;
