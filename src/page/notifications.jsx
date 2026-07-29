import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { fetchNotifications, markNotificationsRead } from '../services/api';
import { BackIcon, CheckIcon, AnimatedLoader, BellIcon } from '../assets/icon';

const NOTIF_ICONS = {
  broadcast: '📢',
  system: '🔔',
  warning: '⚠️',
};

function getTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Hozir';
  if (diffMins < 60) return `${diffMins} min oldin`;
  if (diffHours < 24) return `${diffHours} soat oldin`;
  if (diffDays < 7) return `${diffDays} kun oldin`;
  return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
}

function getDateGroup(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffDays = Math.floor((now - date) / 86400000);

  if (diffDays === 0) return 'Bugun';
  if (diffDays === 1) return 'Kecha';
  if (diffDays < 7) return 'Shu hafta';
  return 'Eski';
}

// ─── Notification Card ─────────────────────────────────────────────────────
function NotificationCard({ notification, index, style }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 50);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      className="rounded-2xl transition-all duration-300"
      style={{
        background: notification.read
          ? 'rgba(255,255,255,0.02)'
          : 'linear-gradient(135deg, rgba(124,90,240,0.08) 0%, rgba(124,90,240,0.02) 100%)',
        border: `1px solid ${
          notification.read
            ? 'rgba(255,255,255,0.05)'
            : 'rgba(124,90,240,0.15)'
        }`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'all 0.35s ease',
        transitionDelay: `${index * 50}ms`,
        ...style,
      }}
    >
      <div className="flex items-start gap-3 p-3.5">
        {/* Icon */}
        <div
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{
            width: 40,
            height: 40,
            background: notification.read
              ? 'rgba(255,255,255,0.04)'
              : 'rgba(124,90,240,0.12)',
            fontSize: 18,
          }}
        >
          {NOTIF_ICONS[notification.type] || '🔔'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="text-sm font-semibold truncate"
                style={{
                  color: notification.read
                    ? 'rgba(255,255,255,0.7)'
                    : '#f0effc',
                }}
              >
                {notification.title}
              </span>
              {!notification.read && (
                <span
                  className="flex-shrink-0 rounded-full animate-pulse-glow"
                  style={{
                    width: 8,
                    height: 8,
                    background: '#a78bfa',
                    boxShadow: '0 0 6px rgba(124,90,240,0.5)',
                  }}
                />
              )}
            </div>
            <span
              className="text-2xs flex-shrink-0"
              style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, whiteSpace: 'nowrap' }}
            >
              {getTimeAgo(notification.createdAt)}
            </span>
          </div>

          <div
            className="text-xs mt-1.5 leading-relaxed"
            style={{
              color: notification.read
                ? 'rgba(255,255,255,0.4)'
                : 'rgba(255,255,255,0.6)',
              wordBreak: 'break-word',
            }}
          >
            {notification.message}
          </div>

          <div
            className="text-2xs mt-2"
            style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}
          >
            {new Date(notification.createdAt).toLocaleString('uz-UZ', {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8">
      {/* Bell icon with rings */}
      <div className="relative flex items-center justify-center mb-6">
        <div
          className="absolute rounded-full animate-pulse-glow"
          style={{
            width: 80,
            height: 80,
            background: 'radial-gradient(circle, rgba(124,90,240,0.2) 0%, transparent 70%)',
          }}
        />
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 64,
            height: 64,
            background: 'rgba(124,90,240,0.1)',
            border: '1px solid rgba(124,90,240,0.2)',
            color: 'rgba(167,139,250,0.6)',
          }}
        >
          <BellIcon size={28} />
        </div>
      </div>

      <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Bildirishnomalar yo'q
      </p>
      <p className="text-xs mt-2 text-center" style={{ color: 'rgba(255,255,255,0.25)', maxWidth: 240 }}>
        Sizda hali hech qanday bildirishnoma mavjud emas. Yangi xabarlar kelganda bu yerda ko'rinadi.
      </p>
    </div>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="px-4 py-2 space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="rounded-2xl p-3.5 flex items-start gap-3"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div
            className="rounded-xl flex-shrink-0 animate-pulse"
            style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.06)' }}
          />
          <div className="flex-1 space-y-2">
            <div
              className="h-3 rounded-full animate-pulse"
              style={{ width: '60%', background: 'rgba(255,255,255,0.06)' }}
            />
            <div
              className="h-2.5 rounded-full animate-pulse"
              style={{ width: '90%', background: 'rgba(255,255,255,0.04)' }}
            />
            <div
              className="h-2 rounded-full animate-pulse"
              style={{ width: '30%', background: 'rgba(255,255,255,0.03)' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Notifications Page ────────────────────────────────────────────────────
export function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const listRef = useRef(null);

  const loadNotifications = useCallback(async (pageNum = 1, append = false) => {
    try {
      const data = await fetchNotifications(pageNum);
      if (append) {
        setNotifications(prev => [...prev, ...(data.notifications || [])]);
      } else {
        setNotifications(data.notifications || []);
      }
      setUnreadCount(data.unreadCount || 0);
      setHasMore(data.notifications?.length === 20);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await markNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadNotifications(1);
  };

  const handleScroll = useCallback(() => {
    if (!listRef.current || loading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadNotifications(nextPage, true);
    }
  }, [loading, hasMore, page, loadNotifications]);

  // Group notifications by date
  const grouped = notifications.reduce((acc, n) => {
    const group = getDateGroup(n.createdAt);
    if (!acc[group]) acc[group] = [];
    acc[group].push(n);
    return acc;
  }, {});

  const groupOrder = ['Bugun', 'Kecha', 'Shu hafta', 'Eski'];

  const backBtnStyle = {
    width: 36, height: 36,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer', flexShrink: 0,
  };

  return (
    <div className="slide-in-right flex flex-col" style={{ minHeight: '100dvh', background: '#0a0a12' }}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header
        className="flex items-center gap-3 px-4 pt-4 pb-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center rounded-xl transition-all"
          style={backBtnStyle}
          aria-label="Go back"
        >
          <BackIcon />
        </button>

        <div className="flex-1">
          <span className="text-sm font-semibold" style={{ color: '#f0effc' }}>
            Bildirishnomalar
          </span>
          {unreadCount > 0 && (
            <span className="ml-1.5 text-xs font-medium" style={{ color: '#a78bfa' }}>
              ({unreadCount} ta o'qilmagan)
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{
              background: 'rgba(124,90,240,0.12)',
              color: '#a78bfa',
              border: '1px solid rgba(124,90,240,0.2)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124,90,240,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(124,90,240,0.12)'; }}
          >
            <CheckIcon />
            Hammasini o'qish
          </button>
        )}
      </header>

      {/* ── Refresh indicator ──────────────────────────────────────── */}
      {refreshing && (
        <div className="flex items-center justify-center py-3">
          <AnimatedLoader size={18} style={{ color: '#a78bfa' }} />
          <span className="ml-2 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Yangilanmoqda...
          </span>
        </div>
      )}

      {/* ── Content ────────────────────────────────────────────────── */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
        style={{ paddingBottom: 32 }}
      >
        {loading ? (
          <LoadingSkeleton />
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="px-4 py-4 space-y-5">
            {groupOrder.map((group) => {
              const items = grouped[group];
              if (!items || items.length === 0) return null;

              return (
                <div key={group}>
                  {/* Date group header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {group}
                    </span>
                    <div
                      className="flex-1 h-px"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    />
                    <span className="text-2xs" style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>
                      {items.length} ta
                    </span>
                  </div>

                  {/* Notification cards */}
                  <div className="space-y-2">
                    {items.map((notif, idx) => (
                      <NotificationCard
                        key={notif._id}
                        notification={notif}
                        index={idx}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Load more indicator */}
            {hasMore && !loading && (
              <div className="flex justify-center py-4">
                <button
                  onClick={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    loadNotifications(nextPage, true);
                  }}
                  className="text-xs px-4 py-2 rounded-xl transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                  }}
                >
                  Ko'proq yuklash
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom tab bar ─────────────────────────────────────────── */}
      {user && (
        <div
          className="flex-shrink-0 flex items-center justify-around px-6 py-3"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(10,10,18,0.95)',
            backdropFilter: 'blur(16px)',
            paddingBottom: 'max(6px, env(safe-area-inset-bottom))',
          }}
        >
          {[
            { icon: '🏠', label: 'Bosh sahifa', path: '/' },
            { icon: '💬', label: 'Chat', path: '/chat' },
            { icon: '🔔', label: 'Bildirishnomalar', path: '/notifications', active: true },
            { icon: '⚙️', label: 'Sozlamalar', path: '/settings' },
          ].map((tab) => (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-1 transition-all"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                opacity: tab.active ? 1 : 0.4,
                transform: tab.active ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <span style={{ fontSize: 20 }}>{tab.icon}</span>
              <span className="text-2xs" style={{ color: tab.active ? '#a78bfa' : 'rgba(255,255,255,0.4)', fontSize: 9 }}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
