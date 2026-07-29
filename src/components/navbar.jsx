import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlanBadge } from './PlanBadge';
import { useUser } from '../context/UserContext';
import { resolveAvatarUrl, fetchUnreadCount } from '../services/api';
import { AnimatedBell } from '../assets/icon';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop';

const headerStyle = { borderBottom: '1px solid rgba(255,255,255,0.06)' };
const avatarStyle = {
  width: 38,
  height: 38,
  border: '2px solid rgba(124,90,240,0.6)',
  boxShadow: '0 0 10px rgba(124,90,240,0.3)',
};
const bellBtnStyle = {
  width: 36,
  height: 36,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.6)',
  cursor: 'pointer',
  borderRadius: 10,
  position: 'relative',
};

export function Navbar() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [currentAvatar, setCurrentAvatar] = useState(resolveAvatarUrl(user?.avatar) || DEFAULT_AVATAR);
  const [unreadCount, setUnreadCount] = useState(0);
  const pollRef = useRef(null);

  
  // User ma'lumoti localStorage dan yoki serverdan kelganda avatar URL ni yangilaymiz
  useEffect(() => {
    if (user?.avatar) {
      setCurrentAvatar(resolveAvatarUrl(user.avatar));
    }
  }, [user?.avatar]);

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

  const handleImgError = () => {
    setCurrentAvatar(DEFAULT_AVATAR);
  };

  const handleBellClick = () => {
    navigate('/notifications');
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
        <img
          src={currentAvatar}
          alt={user.name}
          key={currentAvatar}
          onError={handleImgError}
          className="rounded-full object-cover flex-shrink-0"
          style={avatarStyle}
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
        {/* Notification bell */}
        <button
          onClick={handleBellClick}
          style={bellBtnStyle}
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
