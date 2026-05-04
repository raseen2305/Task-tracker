import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getAhtReport, getDashboardStats } from '../controllers/analyticsController.js';

const router = Router();
router.use(authenticate);

router.get(
  '/aht-report',
  authorize('CEO', 'HR', 'PROJECT_LEAD', 'QUALITY_REVIEWER'),
  getAhtReport
);

router.get('/dashboard', getDashboardStats);

export default router;
