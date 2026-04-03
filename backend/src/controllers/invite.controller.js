import Invite from '../models/Invite.model.js';
import Workspace from '../models/Workspace.model.js';
import User from '../models/User.model.js';
import { logActivity } from '../utils/activityLog.utils.js';

// ── CREATE Invite ──────────────────────────────────────────────────────────────
export const createInvite = async (req, res, next) => {
  try {
    const { email, workspaceId, role = 'member' } = req.body;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
    
    // Check if the inviter has admin privileges
    if (!workspace.isAdmin(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Admin access required to invite members' });
    }

    const emailLower = email.toLowerCase();

    // Check if user is already a member
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser && workspace.isMember(existingUser._id)) {
      return res.status(400).json({ success: false, message: 'User is already a member of this workspace' });
    }

    // Check if there is already a pending invite
    const existingInvite = await Invite.findOne({
      email: emailLower,
      workspaceId,
      status: 'pending',
    });

    if (existingInvite) {
      return res.status(400).json({ success: false, message: 'A pending invite already exists for this email in this workspace' });
    }

    // Optionally set an expiry date, e.g., 24 hours from now.
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const invite = await Invite.create({
      email: emailLower,
      workspaceId,
      role,
      invitedBy: req.user._id,
      expiresAt,
    });

    logActivity({
      actor: req.user._id,
      action: 'workspace_member_invited',
      workspace: workspace._id,
      description: `Invited ${emailLower} to workspace via In-App systemic invite`,
    });

    res.status(201).json({ success: true, message: `Invite successfully sent to ${emailLower}`, invite });
  } catch (err) {
    next(err);
  }
};

// ── GET My Invites ────────────────────────────────────────────────────────────
export const getMyInvites = async (req, res, next) => {
  try {
    const invites = await Invite.find({
      email: req.user.email.toLowerCase(),
      status: 'pending',
    })
      .populate('workspaceId', 'name logo slug')
      .populate('invitedBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, invites });
  } catch (err) {
    next(err);
  }
};

// ── ACCEPT Invite ─────────────────────────────────────────────────────────────
export const acceptInvite = async (req, res, next) => {
  try {
    const { inviteId } = req.body;

    const invite = await Invite.findById(inviteId);
    if (!invite) return res.status(404).json({ success: false, message: 'Invite not found' });
    if (invite.status !== 'pending') {
      return res.status(400).json({ success: false, message: `This invite is already ${invite.status}` });
    }
    if (invite.email !== req.user.email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'This invite does not belong to your email' });
    }

    const workspace = await Workspace.findById(invite.workspaceId);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace no longer exists' });

    // Mark as accepted
    invite.status = 'accepted';
    await invite.save();

    // Add user to workspace
    if (!workspace.isMember(req.user._id)) {
      workspace.members.push({ user: req.user._id, role: invite.role });
      await workspace.save();
    }

    logActivity({
      actor: req.user._id,
      action: 'workspace_member_joined',
      workspace: workspace._id,
      description: `${req.user.name} joined workspace via In-App invite`,
    });

    res.json({ success: true, message: 'You successfully joined the workspace!', workspace });
  } catch (err) {
    next(err);
  }
};

// ── REJECT Invite ─────────────────────────────────────────────────────────────
export const rejectInvite = async (req, res, next) => {
  try {
    const { inviteId } = req.body;

    const invite = await Invite.findById(inviteId);
    if (!invite) return res.status(404).json({ success: false, message: 'Invite not found' });
    if (invite.status !== 'pending') {
      return res.status(400).json({ success: false, message: `This invite is already ${invite.status}` });
    }
    if (invite.email !== req.user.email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'This invite does not belong to your email' });
    }

    invite.status = 'rejected';
    await invite.save();

    res.json({ success: true, message: 'Invite rejected successfully' });
  } catch (err) {
    next(err);
  }
};
