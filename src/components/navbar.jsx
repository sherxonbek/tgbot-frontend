import { useState, useEffect, useRef, useCallback } from 'react';
import { PlanBadge } from './PlanBadge';
import { useUser } from '../context/UserContext';
import { resolveAvatarUrl, fetchNotifications, fetchUnreadCount, markNotificationsRead } from '../services/api';
import { CheckIcon, AnimatedBell } from '../assets/icon';

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

function NotificationDropdown({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications(1);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async () => {
    try {
      await markNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      className="absolute right-0 top-full mt-2 z-50 origin-top-right animate-fade-in-up"
      style={{ width: 320, maxWidth: 'calc(100vw - 32px)', maxHeight: 400 }}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: '#15151f',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-sm font-semibold" style={{ color: '#f0effc' }}>
            Bildirishnomalar
            {unreadCount > 0 && (
              <span className="ml-1.5 text-xs" style={{ color: '#a78bfa' }}>({unreadCount})</span>
            )}
          </span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkRead}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-all"
              style={{
                background: 'rgba(124,90,240,0.12)',
                color: '#a78bfa',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <CheckIcon />
              Hammasini o'qish
            </button>
          )}
        </div>

        {/* List */}
        <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
          {loading ? (
            <div className="flex justify-center py-8">
              <div
                className="animate-spin rounded-full"
                style={{
                  width: 20,
                  height: 20,
                  border: '2px solid rgba(255,255,255,0.1)',
                  borderTopColor: '#a78bfa',
                }}
              />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <span style={{ fontSize: 32 }}>🔔</span>
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Bildirishnomalar yo'q
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((n, i) => (
                <div
                  key={n._id}
                  className="px-4 py-3 transition-colors"
                  style={{
                    background: n.read ? 'transparent' : 'rgba(124,90,240,0.06)',
                    borderBottom: i < notifications.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                      {n.type === 'broadcast' ? '📢' : '🔔'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium" style={{ color: '#f0effc' }}>
                        {n.title}
                      </div>
                      <div className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)', wordBreak: 'break-word' }}>
                        {n.message}
                      </div>
                      <div className="text-2xs mt-1" style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {!n.read && (
                          <span
                        className="flex-shrink-0 rounded-full"
                        style={{
                          width: 8,
                          height: 8,
                          background: '#a78bfa',
                          marginTop: 4,
                          boxShadow: '0 0 6px rgba(124,90,240,0.5)',
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Navbar() {
  const { user } = useUser();
  const [currentAvatar, setCurrentAvatar] = useState(resolveAvatarUrl(user?.avatar) || DEFAULT_AVATAR);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const bellRef = useRef(null);
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
    setShowNotifications(prev => !prev);
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
    // Yopganda unread count ni yangilaymiz
    loadUnreadCount();
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

      <div className="flex items-center gap-2" ref={bellRef}>
        {/* Notification bell */}
        <div className="relative">
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

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={handleCloseNotifications} />
              <div className="relative z-50" onClick={e => e.stopPropagation()}>
                <NotificationDropdown />
              </div>
            </>
          )}
        </div>

        <PlanBadge plan={user.plan} />
      </div>
    </header>
  );
}

export default Navbar;
