import mongoose from 'mongoose';

const inviteSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'project_manager', 'member'],
      default: 'member',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expiresAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Prevent multiple pending invitations for the same user in a single workspace.
inviteSchema.index({ email: 1, workspaceId: 1, status: 1 });

const Invite = mongoose.model('Invite', inviteSchema);
export default Invite;
