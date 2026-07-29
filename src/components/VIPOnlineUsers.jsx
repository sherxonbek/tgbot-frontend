import { useEffect, useState } from 'react';
import { RefreshCw, UserCheck, Ban, Send, Users } from 'lucide-react';
import { UserAvatar } from './Avatar';
import { useChatRequests } from '../hooks/useChatRequests';

const sectionStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16,
  overflow: 'hidden',
};

/**
 * VIPOnlineUsers — VIP userlar uchun online userlarni ko'rish va so'rov yuborish
 * Settings sahifasida VIP filterlar yonida joylashadi
 */
export function VIPOnlineUsers({ currentUser }) {
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

  // Load online users on mount
  useEffect(() => {
    if (currentUser?.plan === 'VIP') {
      loadOnlineUsers();
      // Har 30 sekundda avtomatik yangilash
      const interval = setInterval(loadOnlineUsers, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.plan]);

  // So'rov yuborilganda sentToTargets ni yangilash
  useEffect(() => {
    if (requestSent?.targetTgId) {
      setSentToTargets(prev => ({ ...prev, [requestSent.targetTgId]: 'sent' }));
    }
  }, [requestSent]);

  // So'rov rad etilganda target ni tozalash
  useEffect(() => {
    if (requestDeclined?.targetTgId) {
      setSentToTargets(prev => ({ ...prev, [requestDeclined.targetTgId]: 'declined' }));
      setTimeout(() => {
        setSentToTargets(prev => ({ ...prev, [requestDeclined.targetTgId]: undefined }));
      }, 3000);
    }
  }, [requestDeclined]);

  const handleSendRequest = (targetTgId) => {
    sendChatRequest(targetTgId);
  };

  const handleCancelRequest = (targetTgId) => {
    cancelChatRequest(targetTgId);
    setSentToTargets(prev => ({ ...prev, [targetTgId]: undefined }));
  };

  if (currentUser?.plan !== 'VIP') return null;

  return (
    <div className="mx-4 mt-4" style={sectionStyle}>
      {/* Header */}
      <div className="px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <span
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{
              width: 38,
              height: 38,
              background: 'rgba(124,90,240,0.15)',
              color: '#a78bfa',
            }}
          >
            <Users size={18} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium" style={{ color: '#f0effc' }}>
              Online userlar
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
              To'g'ridan-to'g'ri suhbat boshlash
            </div>
          </div>
          <button
            onClick={loadOnlineUsers}
            disabled={onlineLoading}
            className="flex items-center justify-center rounded-xl transition-all flex-shrink-0"
            style={{
              width: 34,
              height: 34,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)',
              cursor: onlineLoading ? 'not-allowed' : 'pointer',
            }}
            title="Yangilash"
            aria-label="Refresh"
          >
            <RefreshCw
              size={16}
              style={{
                animation: onlineLoading ? 'spin 1s linear infinite' : 'none',
              }}
            />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {/* Success toast */}
        {requestSent && (
          <div
            className="mb-3 px-3 py-2 rounded-xl text-xs animate-bounce-in"
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
            className="mb-3 px-3 py-2 rounded-xl text-xs animate-bounce-in"
            style={{
              background: 'rgba(248,113,113,0.12)',
              border: '1px solid rgba(248,113,113,0.2)',
              color: '#f87171',
            }}
          >
            ❌ {requestDeclined.targetName} so'rovingizni rad etdi
          </div>
        )}

        {/* Online users list */}
        {onlineLoading && onlineUsers.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <div
              className="animate-spin rounded-full"
              style={{
                width: 20,
                height: 20,
                border: '2px solid rgba(124,90,240,0.15)',
                borderTopColor: '#7c5af0',
              }}
            />
          </div>
        ) : onlineUsers.length === 0 ? (
          <div className="text-center py-6">
            <div
              className="flex items-center justify-center rounded-full mx-auto mb-2"
              style={{
                width: 40,
                height: 40,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <Users size={18} style={{ color: 'rgba(255,255,255,0.2)' }} />
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Hozir online userlar yo'q
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {onlineUsers.map((user) => {
              const status = sentToTargets[user.tg_id];
              return (
                <div
                  key={user.tg_id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                  style={{
                    background: status === 'sent'
                      ? 'rgba(16,185,129,0.08)'
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${
                      status === 'sent'
                        ? 'rgba(16,185,129,0.15)'
                        : 'rgba(255,255,255,0.06)'
                    }`,
                  }}
                >
                  <UserAvatar
                    name={user.name || '?'}
                    avatar={user.avatar}
                    size={36}
                    border={false}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-sm font-medium truncate"
                        style={{ color: '#f0effc' }}
                      >
                        {user.name || 'Noma\'lum'}
                      </span>
                      {/* Online indicator */}
                      <span
                        className="inline-block rounded-full flex-shrink-0"
                        style={{
                          width: 7,
                          height: 7,
                          background: '#6ee7b7',
                          boxShadow: '0 0 6px rgba(110,231,183,0.5)',
                        }}
                      />
                    </div>
                    <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {user.region || ''} · {user.gender || ''}
                    </div>
                  </div>

                  {/* Action button */}
                  {status === 'sent' ? (
                    <button
                      onClick={() => handleCancelRequest(user.tg_id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0"
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        color: '#f87171',
                        cursor: 'pointer',
                      }}
                    >
                      <Ban size={12} />
                      Bekor qilish
                    </button>
                  ) : status === 'declined' ? (
                    <span
                      className="text-xs px-3 py-1.5 rounded-lg flex-shrink-0"
                      style={{
                        color: 'rgba(255,255,255,0.3)',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      Rad etildi
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(user.tg_id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0"
                      style={{
                        background: 'rgba(124,90,240,0.15)',
                        border: '1px solid rgba(124,90,240,0.25)',
                        color: '#a78bfa',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(124,90,240,0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(124,90,240,0.15)';
                      }}
                    >
                      <Send size={12} />
                      So'rov yuborish
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tip */}
        <p
          className="text-xs text-center mt-3"
          style={{ color: 'rgba(255,255,255,0.2)' }}
        >
          Har 30 sekundda avtomatik yangilanadi
        </p>
      </div>
    </div>
  );
}

export default VIPOnlineUsers;
