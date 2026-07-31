import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlanBadge } from './PlanBadge';
import { UserAvatar } from './Avatar';
import { useUser } from '../context/UserContext';
import { fetchUnreadCount } from '../services/api';
import { AnimatedBell } from '../assets/icon';
import { UserPlus } from 'lucide-react';
import { socket } from '../services/socket';

const iconBtnStyle = {
  width: 38,
  height: 38,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.6)',
  cursor: 'pointer',
  borderRadius: 12,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(10px)',
  transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
};

export function Navbar() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // O'qilmagan bildirishnomalar sonini olish
  const loadUnreadCount = useCallback(async () => {
    try {
      const data = await fetchUnreadCount();
      setUnreadCount(data.count || 0);
    } catch {
      // silent
    }
  }, []);

  // 🔴 PERF FIX: 30 soniyalik HTTP polling olib tashlandi (10k user → ~333 req/s).
  // Endi faqat sahifa ochilganda yuklaymiz; yangi bildirishnoma kelganda server
  // `notification_count` socket event orqali push qiladi (quyidagi socket effect).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchUnreadCount()
      .then((data) => { if (!cancelled) setUnreadCount(data.count || 0); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  const handleBellClick = () => {
    navigate('/notifications');
  };

  // Yangi so'rov kelganda sonni oshirish + o'qilmagan bildirishnomalar real-time
  useEffect(() => {
    const onConnect = () => {
      socket.emit('get_pending_requests');
      // 🔴 Reconnect'da push'lar o'tib ketgan bo'lsa sinxronlashtiramiz
      loadUnreadCount();
    };
    const onNewRequest = () => {
      setPendingCount(prev => prev + 1);
    };
    const onRequestsUpdate = ({ requests }) => {
      setPendingCount(requests?.length || 0);
    };
    // 🔴 PERF FIX: server `notification_count` push qiladi (chat_request yaratilganda)
    const onNotificationCount = ({ count }) => {
      setUnreadCount(count || 0);
    };
    // Tab yana ko'ringanda (masalan, admin broadcast kelganda) yangilaymiz
    const onVisibility = () => {
      if (!document.hidden) loadUnreadCount();
    };

    if (socket.connected) {
      socket.emit('get_pending_requests');
    }

    socket.on('connect', onConnect);
    socket.on('chat_request_received', onNewRequest);
    socket.on('pending_requests', onRequestsUpdate);
    socket.on('notification_count', onNotificationCount);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);

    return () => {
      socket.off('connect', onConnect);
      socket.off('chat_request_received', onNewRequest);
      socket.off('pending_requests', onRequestsUpdate);
      socket.off('notification_count', onNotificationCount);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
    };
  }, [loadUnreadCount]);

  const handleRequestsClick = () => {
    setPendingCount(0);
    navigate('/requests');
  };

  if (!user) {
    return (
      <header className="glass-strong flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
          Yuklanmoqda... (Yoki botdan /start bosing)
        </div>
      </header>
    );
  }

  return (
    <header className="glass-strong flex items-center justify-between px-4 pt-4 pb-3 sticky top-0 z-20" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-3 min-w-0">
        <UserAvatar
          name={user.name}
          avatar={user.avatar}
          size={40}
        />
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-tight truncate" style={{ color: '#f0effc' }}>
            {user.name}
          </div>
          <div className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.38)' }}>
            @{user.username}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Chat requests icon (hamma userlar uchun) */}
        <button
          onClick={handleRequestsClick}
          style={iconBtnStyle}
          className="flex items-center justify-center"
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.11)'; e.currentTarget.style.borderColor = 'rgba(124,90,240,0.35)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          aria-label="Chat requests"
        >
          <UserPlus size={18} style={{ color: 'rgba(255,255,255,0.6)' }} />
          {pendingCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-2xs font-bold"
              style={{
                minWidth: 17,
                height: 17,
                padding: '0 4px',
                background: 'linear-gradient(135deg, #a78bfa, #7c5af0)',
                color: '#fff',
                fontSize: 9,
                boxShadow: '0 0 10px rgba(167,139,250,0.6)',
                animation: 'bounce 1s ease-in-out infinite',
                border: '1.5px solid #0e0e1a',
              }}
            >
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
        </button>

        {/* Notification bell */}
        <button
          onClick={handleBellClick}
          style={iconBtnStyle}
          className="flex items-center justify-center"
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.11)'; e.currentTarget.style.borderColor = 'rgba(124,90,240,0.35)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          aria-label="Notifications"
        >
          <AnimatedBell size={20} ring={unreadCount > 0} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-2xs font-bold"
              style={{
                minWidth: 17,
                height: 17,
                padding: '0 4px',
                background: 'linear-gradient(135deg, #f87171, #ef4444)',
                color: '#fff',
                fontSize: 9,
                boxShadow: '0 0 10px rgba(248,113,113,0.6)',
                animation: unreadCount > 0 ? 'bounce 1s ease-in-out infinite' : 'none',
                border: '1.5px solid #0e0e1a',
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
