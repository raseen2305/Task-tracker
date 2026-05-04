import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { listUsers, getUser, updateUser, deactivateUser } from '../controllers/userController.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('CEO', 'HR', 'PROJECT_LEAD', 'TAKER', 'QUALITY_REVIEWER'), listUsers);
router.get('/:id', authorize('CEO', 'HR', 'PROJECT_LEAD'), getUser);
router.patch('/:id', authorize('CEO', 'HR'), updateUser);
router.delete('/:id', authorize('CEO', 'HR'), deactivateUser);

export default router;
