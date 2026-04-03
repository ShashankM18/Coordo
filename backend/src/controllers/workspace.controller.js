import crypto from 'crypto';
import Workspace from '../models/Workspace.model.js';
import User from '../models/User.model.js';
import Project from '../models/Project.model.js';
import { sendWorkspaceInviteEmail } from '../utils/email.utils.js';
import { logActivity } from '../utils/activityLog.utils.js';
import slugify from 'slugify';

// ── GET all workspaces for current user ────────────────────────────────────────
export const getMyWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({
      'members.user': req.user._id,
      isActive: true,
    }).populate('owner', 'name email avatar').lean({ virtuals: true });

    res.json({ success: true, workspaces });
  } catch (err) { next(err); }
};

// ── GET single workspace ───────────────────────────────────────────────────────
export const getWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar lastSeen');

    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
    if (!workspace.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, workspace });
  } catch (err) { next(err); }
};

// ── CREATE workspace ───────────────────────────────────────────────────────────
export const createWorkspace = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    // Generate unique slug
    let slug = slugify(name, { lower: true, strict: true });
    const existing = await Workspace.countDocuments({ slug: new RegExp(`^${slug}`) });
    if (existing) slug = `${slug}-${existing}`;

    const workspace = await Workspace.create({
      name,
      description,
      slug,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });

    logActivity({ actor: req.user._id, action: 'workspace_created', workspace: workspace._id,
      description: `Created workspace "${name}"` });

    res.status(201).json({ success: true, workspace });
  } catch (err) { next(err); }
};

// ── UPDATE workspace ───────────────────────────────────────────────────────────
export const updateWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
    if (!workspace.isAdmin(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const allowed = ['name', 'description', 'settings'];
    allowed.forEach(f => { if (req.body[f] !== undefined) workspace[f] = req.body[f]; });
    await workspace.save();

    res.json({ success: true, workspace });
  } catch (err) { next(err); }
};

// ── INVITE AND ACCEPT EXPUNGED IN FAVOR OF IN-APP SYSTEM ──────────────

// ── UPDATE member role ────────────────────────────────────────────────────────
export const updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
    if (!workspace.isAdmin(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const member = workspace.members.find(m => m.user.toString() === req.params.userId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    member.role = role;
    await workspace.save();
    res.json({ success: true, message: 'Role updated' });
  } catch (err) { next(err); }
};

// ── REMOVE member ─────────────────────────────────────────────────────────────
export const removeMember = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });

    const isSelf = req.params.userId === req.user._id.toString();
    if (!isSelf && !workspace.isAdmin(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    workspace.members = workspace.members.filter(m => m.user.toString() !== req.params.userId);
    await workspace.save();
    res.json({ success: true, message: 'Member removed' });
  } catch (err) { next(err); }
};
