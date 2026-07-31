import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchNotifications, markNotificationsRead, markNotificationRead } from '../services/api';
import { BackIcon, CheckIcon, BellIcon } from '../assets/icon';
import { Check, X } from 'lucide-react';
import { IconButton } from '../components/IconButton';
import { socket } from '../services/socket';
import { savePartnerToLocalStorage } from '../utils/blacklist';

const NOTIF_ICONS = {
  broadcast: '📢',
  system: '🔔',
  warning: '⚠️',
  chat_request: '💬',
};

const NOTIF_TITLES = {
  broadcast: 'Xabar',
  system: 'Bildirishnoma',
  warning: 'Ogohlantirish',
  chat_request: 'Suhbat so\'rovi',
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

// 🔴 8-FIX: broadcast xabarlardagi URL larni avtomatik havolaga aylantirish.
// Ilgari xabar faqat matn sifatida ko'rinardi — linklar bosilmaydigan edi.
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function renderMessageWithLinks(text) {
  if (!text) return text;
  return String(text)
    .split(URL_REGEX)
    .map((part, i) => {
      if (!/^https?:\/\//.test(part)) return part;
      // Greedy regex sababli URL oxiriga tinish belgilari (`.`, `,`, `)` va h.k.)
      // qo'shilib qoladi — ularni havoladan ajratib olamiz.
      const clean = part.replace(/[.,;:!?)\]}-]+$/, '');
      const trailing = part.slice(clean.length);
      return (
        <span key={i}>
          <a
            href={clean}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="transition-colors"
            style={{ color: '#a78bfa', textDecoration: 'underline', textUnderlineOffset: 2 }}
          >
            {clean}
          </a>
          {trailing}
        </span>
      );
    });
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

// ─── Notification Card (with truncation + mark-read on click) ─────────────
function NotificationCard({ notification, index, onReadStatusChange }) {
  const [isVisible, setIsVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isRead, setIsRead] = useState(notification.read);
  const [markedJustNow, setMarkedJustNow] = useState(false);
  const [actionDone, setActionDone] = useState(null); // 'accepted' | 'declined' | null
  const MAX_LINES = 3;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 50);
    return () => clearTimeout(timer);
  }, [index]);

  useEffect(() => {
    if (notification.read && !isRead && !markedJustNow) {
      setIsRead(true);
    }
  }, [notification.read, isRead, markedJustNow]);

  const markAsRead = async () => {
    if (!isRead) {
      setIsRead(true);
      setMarkedJustNow(true);
      setTimeout(() => setMarkedJustNow(false), 1500);
      try {
        await markNotificationRead(notification._id);
        if (onReadStatusChange) onReadStatusChange();
      } catch (e) {
        console.error('Mark read error:', e);
      }
    }
  };

  const handleClick = async () => {
    if (!expanded) setExpanded(true);
    await markAsRead();
  };

  const navigate = useNavigate();

  // Chat request action
  const handleRequestAction = async (action) => {
    if (actionDone) return;
    setActionDone(action);

    const meta = notification.metadata;

    if (action === 'accepted') {
      // Socket orqali accept
      socket.emit('respond_chat_request', {
        fromTgId: meta?.fromTgId,
        action: 'accepted',
      });
      // Chatga navigatsiya uchun sessionStorage
      if (meta?.fromTgId) {
        savePartnerToLocalStorage(meta.fromTgId);
        sessionStorage.setItem('matchUser', JSON.stringify({
          tg_id: meta.fromTgId,
          name: meta.fromName,
          avatar: meta.fromAvatar,
        }));
      }
    } else {
      socket.emit('respond_chat_request', {
        fromTgId: meta?.fromTgId,
        action: 'declined',
      });
    }

    await markAsRead();

    if (action === 'accepted') {
      // Suhbatga o'tish (navigate bilan — hard refresh o'rniga)
      navigate('/chat');
    }
  };

  const displayTitle = NOTIF_TITLES[notification.type] || notification.title || 'Xabar';
  const isChatRequest = notification.type === 'chat_request';

  return (
    <div
      className={`rounded-2xl transition-all duration-300 ${isChatRequest ? '' : 'cursor-pointer'}`}
      onClick={isChatRequest ? undefined : handleClick}
      style={{
        background: isRead && !actionDone
          ? 'rgba(255,255,255,0.02)'
          : 'linear-gradient(135deg, rgba(124,90,240,0.10) 0%, rgba(124,90,240,0.03) 100%)',
        border: `1px solid ${
          isRead && !actionDone
            ? 'rgba(255,255,255,0.05)'
            : 'rgba(124,90,240,0.18)'
        }`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: isRead && !actionDone ? 'none' : '0 6px 24px rgba(124,90,240,0.06)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'all 0.35s ease',
        transitionDelay: `${index * 50}ms`,
      }}
    >
      <div className="flex items-start gap-3 p-3.5">
        {/* Icon */}
        <div
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{
            width: 40,
            height: 40,
            background: isRead
              ? 'rgba(255,255,255,0.04)'
              : isChatRequest
                ? 'rgba(16,185,129,0.12)'
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
                className="text-sm font-semibold truncate flex items-center gap-1.5"
                style={{ color: isRead ? 'rgba(255,255,255,0.7)' : '#f0effc' }}
              >
                {displayTitle}
              </span>
              {!isRead && (
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

          {/* Message */}
          <div className="relative mt-1.5">
            <div
              className={`text-xs leading-relaxed transition-all duration-300 ${
                expanded ? '' : 'overflow-hidden'
              }`}
              style={{
                color: isRead ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.6)',
                wordBreak: 'break-word',
                display: '-webkit-box',
                WebkitLineClamp: expanded ? 'none' : MAX_LINES,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {renderMessageWithLinks(notification.message)}
            </div>
            {!expanded && notification.message && notification.message.length > 80 && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                className="text-xs mt-0.5 font-medium transition-all"
                style={{ color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Ko'proq ko'rish
              </button>
            )}
          </div>

          {/* Chat request actions */}
          {isChatRequest && !actionDone && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={(e) => { e.stopPropagation(); handleRequestAction('accepted'); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: 'rgba(16,185,129,0.15)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  color: '#6ee7b7',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.15)'; }}
              >
                <Check size={14} />
                Qabul qilish
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleRequestAction('declined'); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#f87171',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
              >
                <X size={14} />
                Rad etish
              </button>
            </div>
          )}

          {/* Action done feedback */}
          {actionDone === 'accepted' && (
            <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-xl text-xs"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.15)' }}
            >
              ✅ Suhbatga o'tilmoqda...
            </div>
          )}
          {actionDone === 'declined' && (
            <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-xl text-xs"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.12)' }}
            >
              ❌ So'rov rad etildi
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xs" style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>
              {new Date(notification.createdAt).toLocaleString('uz-UZ', {
                day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
              })}
            </span>
            {markedJustNow && (
              <span className="text-2xs flex items-center gap-0.5 animate-fade-in-up" style={{ color: '#6ee7b7', fontSize: 10 }}>
                <CheckIcon size={10} /> O'qildi
              </span>
            )}
            {isRead && !markedJustNow && !actionDone && (
              <span className="text-2xs" style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>
                ✓ O'qilgan
              </span>
            )}
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
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  // 🔴 13-FIX: `refreshing` state o'lik kodga aylandi — handleRefresh olib tashlandi,
  // hech qayerda setRefreshing(true) chaqirilmaydi. State va UI indicator ham o'chirildi.
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

  // 🔴 13-FIX: `handleRefresh` o'lik kod edi — hech qayerda ishlatilmasdi
  // (refresh UI `loadNotifications` ni to'g'ridan-to'g'ri chaqiradi). Olib tashlandi.

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

  return (
    <div className="slide-in-right flex flex-col" style={{ minHeight: '100dvh', background: 'transparent' }}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header
        className="page-header flex items-center gap-3 px-4 pt-4 pb-3 flex-shrink-0 sticky top-0 z-20"
      >
        {/* 9-FIX: backBtnStyle inline style o'rniga umumiy .icon-btn-back class */}
        <IconButton
          onClick={() => navigate('/')}
          className="icon-btn-back"
          aria-label="Go back"
        >
          <BackIcon />
        </IconButton>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-bold leading-tight gradient-text truncate">Bildirishnomalar</div>
          <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {unreadCount > 0 ? `${unreadCount} ta o'qilmagan` : "Barchasi o'qilgan"}
          </div>
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
                        // 🔴 13-FIX: bitta bildirishnoma o'qilganda unreadCount ham kamayishi kerak
                        // (prop ilgari hi hech qachon uzatilmagan — local counter muzlab qolardi)
                        onReadStatusChange={() => setUnreadCount(prev => Math.max(0, prev - 1))}
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

    </div>
  );
}

export default NotificationsPage;
