import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { inviteAPI } from '@api/index';

export default function InviteBell() {
  const navigate = useNavigate();
  const [inviteCount, setInviteCount] = useState(0);

  const fetchInvites = async () => {
    try {
      const res = await inviteAPI.getMyInvites();
      if (res?.success) {
        setInviteCount(res.invites.length);
      }
    } catch (error) {
      console.error('Failed to fetch invites:', error);
    }
  };

  useEffect(() => {
    fetchInvites();
    // Poll every 60 seconds
    const interval = setInterval(fetchInvites, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={() => navigate('/invites')}
      title="Workspace Invitations"
      className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-brand-600 transition-colors"
    >
      <Bell size={18} />
      {inviteCount > 0 && (
        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white ring-2 ring-white">
          {inviteCount > 9 ? '9+' : inviteCount}
        </span>
      )}
    </button>
  );
}
