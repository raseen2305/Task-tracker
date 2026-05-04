import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  listBatches,
  getBatch,
  createBatch,
  updateBatch,
  addMembers,
  removeMember,
  deleteBatch,
  getMyBatches,
} from '../controllers/batchController.js';

const router = Router();
router.use(authenticate);

// QR can see their own batch
router.get('/mine', authorize('QUALITY_REVIEWER'), getMyBatches);

// HR/CEO only for management
router.use(authorize('CEO', 'HR'));

router.get('/', listBatches);
router.get('/:id', [param('id').notEmpty()], getBatch);
router.post('/', [body('name').trim().notEmpty(), body('qrId').notEmpty()], createBatch);
router.patch('/:id', [param('id').notEmpty()], updateBatch);
router.post('/:id/members', [param('id').notEmpty(), body('userIds').isArray({ min: 1 })], addMembers);
router.delete('/:id/members/:userId', removeMember);
router.delete('/:id', deleteBatch);

export default router;
