import { useEffect, useState, useRef, useCallback } from 'react';
import { RefreshCw, Ban, Send, Users, Clock } from 'lucide-react';
import { UserAvatar } from './Avatar';
import { useChatRequests } from '../hooks/useChatRequests';

/**
 * VIPOnlineUsers — VIP userlar uchun online userlarni ko'rish va so'rov yuborish
 * 
 * @property {boolean} forceVisible - ichki accordionda bo'lganda ham ko'rinishni majburlash
 */
export function VIPOnlineUsers({ currentUser, forceVisible = false }) {
  const {
    onlineUsers,
    requestSent,
    requestDeclined,
    onlineLoading,
    loadOnlineUsers,
    sendChatRequest,
    cancelChatRequest,
  } = useChatRequests(currentUser);

  const [sentToTargets, setSentToTargets] = useState({});
  const [isActive, setIsActive] = useState(false); // userlar ko'rinishi

  // 1-daqiqa inaktivlik timeri
  const inactivityRef = useRef(null);
  const CLEANUP_DELAY = 60000; // 1 daqiqa

  // Ref orqali callback — circular dependency ni buzish uchun
  const resetInactivityTimerRef = useRef(() => {});

  resetInactivityTimerRef.current = () => {
    if (inactivityRef.current) {
      clearTimeout(inactivityRef.current);
    }
    if (onlineUsers.length > 0 && isActive) {
      inactivityRef.current = setTimeout(() => {
        // 1 daqiqa amal bajarilmasa -> user maydoni yopiladi
        setIsActive(false);
        setSentToTargets({});
      }, CLEANUP_DELAY);
    }
  };

  const resetInactivityTimer = useCallback(() => {
    resetInactivityTimerRef.current();
  }, []);

  // onlineUsers yuklanganda aktivlashtirish (faqat onlineUsers ga bog'liq)
  useEffect(() => {
    if (onlineUsers.length > 0) {
      setIsActive(true);
      resetInactivityTimerRef.current();
    }
    return () => {
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
    };
  }, [onlineUsers]);

  // So'rov yuborilganda
  useEffect(() => {
    if (requestSent?.targetTgId) {
      setSentToTargets(prev => ({ ...prev, [requestSent.targetTgId]: 'sent' }));
      resetInactivityTimer();
    }
  }, [requestSent, resetInactivityTimer]);

  // So'rov rad etilganda
  useEffect(() => {
    if (requestDeclined?.targetTgId) {
      setSentToTargets(prev => ({ ...prev, [requestDeclined.targetTgId]: 'declined' }));
      setTimeout(() => {
        setSentToTargets(prev => ({ ...prev, [requestDeclined.targetTgId]: undefined }));
      }, 3000);
      resetInactivityTimer();
    }
  }, [requestDeclined, resetInactivityTimer]);

  const handleSendRequest = (targetTgId) => {
    sendChatRequest(targetTgId);
    resetInactivityTimer();
  };

  const handleCancelRequest = (targetTgId) => {
    cancelChatRequest(targetTgId);
    setSentToTargets(prev => ({ ...prev, [targetTgId]: undefined }));
    resetInactivityTimer();
  };

  const handleRefresh = () => {
    loadOnlineUsers();
    setIsActive(true);
    resetInactivityTimer();
  };

  if (currentUser?.plan !== 'VIP' && !forceVisible) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{
            width: 34,
            height: 34,
            background: 'rgba(16,185,129,0.12)',
            color: '#6ee7b7',
          }}
        >
          <Users size={16} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium" style={{ color: '#f0effc' }}>
            Online userlar
          </div>
          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {onlineUsers.length > 0
              ? `${onlineUsers.length} ta foydalanuvchi · Manual yangilash`
              : 'To\'g\'ridan-to\'g\'ri suhbat boshlash'}
          </div>
        </div>
        {isActive && onlineUsers.length > 0 && (
          <span className="text-[10px] flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
            <Clock size={10} /> 1 min
          </span>
        )}
        <button
          onClick={handleRefresh}
          disabled={onlineLoading}
          className="flex items-center justify-center rounded-xl transition-all flex-shrink-0"
          style={{
            width: 30,
            height: 30,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.5)',
            cursor: onlineLoading ? 'not-allowed' : 'pointer',
          }}
          title="Yangilash"
          aria-label="Refresh"
        >
          <RefreshCw
            size={14}
            style={{
              animation: onlineLoading ? 'spin 1s linear infinite' : 'none',
            }}
          />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {/* Success toast */}
        {requestSent && (
          <div
            className="mb-2 px-3 py-1.5 rounded-xl text-[10px] animate-bounce-in"
            style={{
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.2)',
              color: '#6ee7b7',
            }}
          >
            ✅ {requestSent.targetName} ga so'rov yuborildi
          </div>
        )}

        {/* Declined toast */}
        {requestDeclined && (
          <div
            className="mb-2 px-3 py-1.5 rounded-xl text-[10px] animate-bounce-in"
            style={{
              background: 'rgba(248,113,113,0.12)',
              border: '1px solid rgba(248,113,113,0.2)',
              color: '#f87171',
            }}
          >
            ❌ {requestDeclined.targetName} rad etdi
          </div>
        )}

        {/* Loading state */}
        {onlineLoading && onlineUsers.length === 0 && (
          <div className="flex items-center justify-center py-4">
            <div
              className="animate-spin rounded-full"
              style={{
                width: 18,
                height: 18,
                border: '2px solid rgba(124,90,240,0.15)',
                borderTopColor: '#7c5af0',
              }}
            />
          </div>
        )}

        {/* Empty state (no users from server) */}
        {!onlineLoading && onlineUsers.length === 0 && (
          <div className="text-center py-4">
            <div
              className="flex items-center justify-center rounded-full mx-auto mb-1.5"
              style={{
                width: 32,
                height: 32,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <Users size={14} style={{ color: 'rgba(255,255,255,0.2)' }} />
            </div>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Hozir online userlar yo'q
            </p>
            <button
              onClick={handleRefresh}
              disabled={onlineLoading}
              className="mt-2 px-3 py-1 rounded-lg text-[10px] font-medium transition-all"
              style={{
                background: 'rgba(124,90,240,0.12)',
                border: '1px solid rgba(124,90,240,0.2)',
                color: '#a78bfa',
                cursor: 'pointer',
              }}
            >
              {onlineLoading ? 'Yuklanmoqda...' : '🔄 Qidirish'}
            </button>
          </div>
        )}

        {/* Timer expired — users still in state but hidden */}
        {!isActive && onlineUsers.length > 0 && (
          <div className="text-center py-4">
            <div
              className="flex items-center justify-center rounded-full mx-auto mb-1.5"
              style={{
                width: 32,
                height: 32,
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.15)',
              }}
            >
              <Clock size={14} style={{ color: '#f59e0b' }} />
            </div>
            <p className="text-[10px]" style={{ color: 'rgba(245,158,11,0.6)' }}>
              Vaqt tugadi · Qayta yuklang
            </p>
            <button
              onClick={handleRefresh}
              disabled={onlineLoading}
              className="mt-2 px-3 py-1 rounded-lg text-[10px] font-medium transition-all"
              style={{
                background: 'rgba(124,90,240,0.12)',
                border: '1px solid rgba(124,90,240,0.2)',
                color: '#a78bfa',
                cursor: 'pointer',
              }}
            >
              {onlineLoading ? 'Yuklanmoqda...' : '🔄 Qayta yuklash'}
            </button>
          </div>
        )}

        {/* Users list (faol bo'lsa ko'rsatiladi) */}
        {isActive && onlineUsers.length > 0 && (
          <div className="space-y-1">
            {onlineUsers.map((user) => {
              const status = sentToTargets[user.tg_id];
              const isSent = status === 'sent';
              const isDeclined = status === 'declined';

              return (
                <div
                  key={user.tg_id}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all"
                  style={{
                    background: isSent
                      ? 'rgba(16,185,129,0.06)'
                      : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${
                      isSent
                        ? 'rgba(16,185,129,0.12)'
                        : 'rgba(255,255,255,0.05)'
                    }`,
                  }}
                >
                  <UserAvatar
                    name={user.name || '?'}
                    avatar={user.avatar}
                    size={32}
                    border={false}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-xs font-medium truncate"
                        style={{ color: '#f0effc' }}
                      >
                        {user.name || 'Noma\'lum'}
                      </span>
                      <span
                        className="inline-block rounded-full flex-shrink-0"
                        style={{
                          width: 6,
                          height: 6,
                          background: '#6ee7b7',
                          boxShadow: '0 0 4px rgba(110,231,183,0.5)',
                        }}
                      />
                    </div>
                    <div className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {[user.region, user.gender].filter(Boolean).join(' · ') || 'Ma\'lumot yo\'q'}
                    </div>
                  </div>

                  {/* Action buttons */}
                  {isSent ? (
                    <button
                      onClick={() => handleCancelRequest(user.tg_id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all flex-shrink-0"
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.15)',
                        color: '#f87171',
                        cursor: 'pointer',
                      }}
                    >
                      <Ban size={10} />
                      Bekor qilish
                    </button>
                  ) : isDeclined ? (
                    <span
                      className="text-[10px] px-2 py-1 rounded-lg flex-shrink-0"
                      style={{
                        color: 'rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      Rad etildi
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(user.tg_id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all flex-shrink-0"
                      style={{
                        background: 'rgba(124,90,240,0.12)',
                        border: '1px solid rgba(124,90,240,0.2)',
                        color: '#a78bfa',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(124,90,240,0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(124,90,240,0.12)';
                      }}
                    >
                      <Send size={10} />
                      So'rov
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default VIPOnlineUsers;
