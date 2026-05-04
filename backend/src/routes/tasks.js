import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getTaskHistory,
  submitTask,
  startTask,
  getTask,
  approveTask,
  rejectTask,
  getMyFeedback,
  checkGrammar,
  getSubmittedTasks,
  getOnboardingStatus,
  getReviewedTasks,
} from '../controllers/taskController.js';

const router = Router();

// All task routes require authentication
router.use(authenticate);

// Tasker routes
router.get('/history/5-days', authorize('TAKER', 'PROJECT_LEAD'), getTaskHistory);
router.get('/feedback', authorize('TAKER'), getMyFeedback);
router.get('/onboarding-status', authorize('TAKER'), getOnboardingStatus);

// QR / PL: submitted queue
router.get('/submitted', authorize('QUALITY_REVIEWER', 'PROJECT_LEAD', 'CEO', 'HR'), getSubmittedTasks);

// PL: reviewed tasks (approved + rejected) to monitor QR performance
router.get('/reviewed', authorize('PROJECT_LEAD', 'CEO', 'HR'), getReviewedTasks);

router.post(
  '/start',
  authorize('TAKER'),
  [body('projectId').notEmpty()],
  startTask
);

router.post(
  '/check-grammar',
  authorize('TAKER'),
  [body('text').trim().isLength({ min: 1 })],
  checkGrammar
);

router.post(
  '/submit',
  authorize('TAKER'),
  [
    body('taskId').notEmpty(),
    body('response').trim().isLength({ min: 10, max: 50000 }),
  ],
  submitTask
);

// QR / PL routes
router.get(
  '/:id',
  authorize('QUALITY_REVIEWER', 'PROJECT_LEAD', 'CEO', 'HR'),
  [param('id').notEmpty()],
  getTask
);

router.patch(
  '/:id/approve',
  authorize('QUALITY_REVIEWER'),
  [param('id').notEmpty()],
  approveTask
);

router.patch(
  '/:id/reject',
  authorize('QUALITY_REVIEWER'),
  [
    param('id').notEmpty(),
    body('comment').trim().isLength({ min: 5 }),
    body('errorTags').optional().isArray(),
  ],
  rejectTask
);

export default router;
