import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlanBadge } from './PlanBadge';
import { UserAvatar } from './Avatar';
import { ChatRequestPanel } from './ChatRequestPanel';
import { useUser } from '../context/UserContext';
import { fetchUnreadCount } from '../services/api';
import { AnimatedBell } from '../assets/icon';
import { UserPlus } from 'lucide-react';
import { socket } from '../services/socket';

const headerStyle = { borderBottom: '1px solid rgba(255,255,255,0.06)' };
const iconBtnStyle = {
  width: 36,
  height: 36,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.6)',
  cursor: 'pointer',
  borderRadius: 10,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export function Navbar() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [showRequests, setShowRequests] = useState(false);
  const pollRef = useRef(null);

  // O'qilmagan bildirishnomalar sonini olish
  const loadUnreadCount = useCallback(async () => {
    try {
      const data = await fetchUnreadCount();
      setUnreadCount(data.count || 0);
    } catch (e) {
      // silent
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      // Har 30 sekundda polling
      pollRef.current = setInterval(loadUnreadCount, 30000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user, loadUnreadCount]);

  const handleBellClick = () => {
    navigate('/notifications');
  };

  // Yangi so'rov kelganda sonni oshirish
  useEffect(() => {
    const onConnect = () => {
      socket.emit('get_pending_requests');
    };
    const onNewRequest = () => {
      setPendingCount(prev => prev + 1);
    };
    const onRequestsUpdate = ({ requests }) => {
      setPendingCount(requests?.length || 0);
    };

    if (socket.connected) {
      socket.emit('get_pending_requests');
    }

    socket.on('connect', onConnect);
    socket.on('chat_request_received', onNewRequest);
    socket.on('pending_requests', onRequestsUpdate);

    return () => {
      socket.off('connect', onConnect);
      socket.off('chat_request_received', onNewRequest);
      socket.off('pending_requests', onRequestsUpdate);
    };
  }, []);

  const handleRequestsClick = () => {
    setShowRequests(!showRequests);
    if (!showRequests) {
      setPendingCount(0);
    }
  };

  if (!user) {
    return (
      <header className="flex items-center justify-between px-4 pt-4 pb-3" style={headerStyle}>
        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
          Yuklanmoqda... (Yoki botdan /start bosing)
        </div>
      </header>
    );
  }

  return (
    <header className="flex items-center justify-between px-4 pt-4 pb-3" style={headerStyle}>
      <div className="flex items-center gap-3">
        <UserAvatar
          name={user.name}
          avatar={user.avatar}
          size={38}
        />
        <div>
          <div className="text-sm font-semibold leading-tight" style={{ color: '#f0effc' }}>
            {user.name}
          </div>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
            {user.username}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Chat requests icon (hamma userlar uchun) */}
        <div className="relative">
          <button
            onClick={handleRequestsClick}
            style={iconBtnStyle}
            className="flex items-center justify-center transition-all"
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            aria-label="Chat requests"
          >
            <UserPlus size={18} style={{ color: showRequests ? '#a78bfa' : 'rgba(255,255,255,0.6)' }} />
            {pendingCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-2xs font-bold"
                style={{
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                  background: 'linear-gradient(135deg, #a78bfa, #7c5af0)',
                  color: '#fff',
                  fontSize: 9,
                  boxShadow: '0 0 8px rgba(167,139,250,0.5)',
                  animation: 'bounce 1s ease-in-out infinite',
                }}
              >
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </button>
          <ChatRequestPanel
            currentUser={user}
            isOpen={showRequests}
            onClose={() => setShowRequests(false)}
          />
        </div>

        {/* Notification bell */}
        <button
          onClick={handleBellClick}
          style={iconBtnStyle}
          className="flex items-center justify-center transition-all"
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          aria-label="Notifications"
        >
          <AnimatedBell size={20} ring={unreadCount > 0} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-2xs font-bold"
              style={{
                minWidth: 16,
                height: 16,
                padding: '0 4px',
                background: 'linear-gradient(135deg, #f87171, #ef4444)',
                color: '#fff',
                fontSize: 9,
                boxShadow: '0 0 8px rgba(248,113,113,0.5)',
                animation: unreadCount > 0 ? 'bounce 1s ease-in-out infinite' : 'none',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <PlanBadge plan={user.plan} />
      </div>
    </header>
  );
}

export default Navbar;
