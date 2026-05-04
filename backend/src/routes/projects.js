import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  listProjects,
  createProject,
  getProject,
  assignMembers,
  updateProject,
  joinProject,
} from '../controllers/projectController.js';

const router = Router();
router.use(authenticate);

router.get('/', listProjects);

router.post(
  '/',
  authorize('PROJECT_LEAD', 'CEO', 'HR'),
  [
    body('name').trim().notEmpty(),
    body('description').optional().trim(),
    body('expectedAhtSecs').optional().isInt({ min: 30 }),
  ],
  createProject
);

// Tasker self-onboarding: pick a PL + QR, get added to their project
router.post(
  '/join',
  authorize('TAKER'),
  [
    body('leadId').notEmpty(),
    body('qrId').notEmpty(),
  ],
  joinProject
);

router.get('/:id', [param('id').notEmpty()], getProject);

router.patch(
  '/:id',
  authorize('PROJECT_LEAD', 'CEO', 'HR'),
  [param('id').notEmpty()],
  updateProject
);

router.patch(
  '/:id/assign',
  authorize('PROJECT_LEAD', 'CEO', 'HR'),
  [
    param('id').notEmpty(),
    body('qrId').optional().isString(),
    body('taskerIds').optional().isArray(),
  ],
  assignMembers
);

export default router;
