import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { getMyWorkspaces, getWorkspace, createWorkspace, updateWorkspace,
  updateMemberRole, removeMember } from '../controllers/workspace.controller.js';

const router = Router();
router.use(protect);

router.get('/', getMyWorkspaces);
router.post('/', [body('name').trim().isLength({ min: 2, max: 50 })], validate, createWorkspace);
router.get('/:id', getWorkspace);
router.patch('/:id/members/:userId', updateMemberRole);
router.delete('/:id/members/:userId', removeMember);

export default router;
