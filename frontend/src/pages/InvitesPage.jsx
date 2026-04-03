import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { inviteAPI } from '@api/index';
import { useWorkspaceStore } from '@store/workspace.store';

export default function InvitesPage() {
  const navigate = useNavigate();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { fetchWorkspaces } = useWorkspaceStore();

  const loadInvites = async () => {
    setLoading(true);
    try {
      const res = await inviteAPI.getMyInvites();
      if (res?.success) {
        setInvites(res.invites);
      }
    } catch (error) {
      toast.error('Failed to load invitations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  const handleAccept = async (inviteId) => {
    try {
      const res = await inviteAPI.accept(inviteId);
      if (res?.success) {
        toast.success('Successfully joined workspace!');
        setInvites((prev) => prev.filter((i) => i._id !== inviteId));
        fetchWorkspaces();
        // Redirect to the accepted workspace
        navigate(`/workspace/${res.workspace._id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept invitation');
    }
  };

  const handleReject = async (inviteId) => {
    try {
      const res = await inviteAPI.reject(inviteId);
      if (res?.success) {
        toast.success('Invitation declined');
        setInvites((prev) => prev.filter((i) => i._id !== inviteId));
      }
    } catch (error) {
      toast.error('Failed to decline invitation');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6 lg:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Workspace Invitations</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your pending invitations to join workspaces.</p>
      </div>

      {invites.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 mb-4">
            <Building2 size={24} />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">No pending invitations</h3>
          <p className="mt-1 text-sm text-gray-500">When you receive an invite to a workspace, it will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {invites.map((invite) => (
            <div
              key={invite._id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                {invite.workspaceId?.logo ? (
                  <img
                    src={invite.workspaceId.logo}
                    alt={invite.workspaceId.name}
                    className="h-12 w-12 rounded-xl object-cover ring-1 ring-gray-100"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 font-bold text-white shadow-inner">
                    {invite.workspaceId?.name?.charAt(0).toUpperCase() || 'W'}
                  </div>
                )}
                <div className="flex-1 space-y-1 overflow-hidden">
                  <h3 className="truncate font-semibold text-gray-900" title={invite.workspaceId?.name}>
                    {invite.workspaceId?.name || 'Workspace'}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="truncate">Invited by user</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-1 rounded-lg bg-gray-50 px-3 py-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Role</span>
                  <span className="font-medium text-gray-900 capitalize">{invite.role.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleReject(invite._id)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                  <X size={14} /> Decline
                </button>
                <button
                  onClick={() => handleAccept(invite._id)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow"
                >
                  <Check size={14} /> Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
