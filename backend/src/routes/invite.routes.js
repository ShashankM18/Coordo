import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createInvite,
  getMyInvites,
  acceptInvite,
  rejectInvite,
} from '../controllers/invite.controller.js';

const router = Router();

// All invite matching routes are authenticated
router.use(protect);

router.post(
  '/',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('workspaceId').notEmpty().withMessage('Workspace ID is required'),
  ],
  validate,
  createInvite
);

router.get('/my-invites', getMyInvites);

router.post(
  '/accept-invite',
  [body('inviteId').notEmpty().withMessage('Invite ID is required')],
  validate,
  acceptInvite
);

router.post(
  '/reject-invite',
  [body('inviteId').notEmpty().withMessage('Invite ID is required')],
  validate,
  rejectInvite
);

export default router;
