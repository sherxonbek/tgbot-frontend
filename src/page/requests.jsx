import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackIcon } from '../assets/icon';
import { UserPlus, Check, X, MessageCircle } from 'lucide-react';
import { UserAvatar } from '../components/Avatar';
import { useChatRequests } from '../hooks/useChatRequests';
import { useUser } from '../context/UserContext';
import { savePartnerToLocalStorage } from '../utils/blacklist';
import { socket } from '../services/socket';

const backBtnStyle = {
  width: 36, height: 36,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.7)',
  cursor: 'pointer', flexShrink: 0,
};

function LoadingSkeleton() {
  return (
    <div className="px-4 py-2 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="rounded-full flex-shrink-0 animate-pulse" style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.06)' }} />
          <div className="flex-1 space-y-2">
            <div className="h-3 rounded-full animate-pulse" style={{ width: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <div className="h-2.5 rounded-full animate-pulse" style={{ width: '70%', background: 'rgba(255,255,255,0.04)' }} />
          </div>
          <div className="flex gap-1.5">
            <div className="rounded-lg animate-pulse" style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.05)' }} />
            <div className="rounded-lg animate-pulse" style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.05)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8">
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute rounded-full animate-pulse-glow"
          style={{ width: 80, height: 80, background: 'radial-gradient(circle, rgba(124,90,240,0.2) 0%, transparent 70%)' }}
        />
        <div className="flex items-center justify-center rounded-full"
          style={{ width: 64, height: 64, background: 'rgba(124,90,240,0.1)', border: '1px solid rgba(124,90,240,0.2)', color: 'rgba(167,139,250,0.6)' }}
        >
          <UserPlus size={28} />
        </div>
      </div>
      <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Kutilayotgan so'rovlar yo'q
      </p>
      <p className="text-xs mt-2 text-center" style={{ color: 'rgba(255,255,255,0.25)', maxWidth: 240 }}>
        Sizga hali hech kim suhbat so'rovi yubormagan. Yangi so'rovlar kelganda bu yerda ko'rinadi.
      </p>
    </div>
  );
}

export function RequestsPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const {
    pendingRequests,
    loading,
    respondToRequest,
    loadPendingRequests,
  } = useChatRequests(user);

  const [actionDone, setActionDone] = useState({}); // { [fromTgId]: 'accepted' | 'declined' }

  useEffect(() => {
    loadPendingRequests();
    const interval = setInterval(loadPendingRequests, 15000);
    return () => clearInterval(interval);
  }, [loadPendingRequests]);

  // Yangi so'rov kelganda avtomatik yangilash
  useEffect(() => {
    const onNewRequest = () => loadPendingRequests();
    socket.on('chat_request_received', onNewRequest);
    return () => socket.off('chat_request_received', onNewRequest);
  }, [loadPendingRequests]);

  const handleAccept = (req) => {
    setActionDone(prev => ({ ...prev, [req.fromTgId]: 'accepted' }));
    respondToRequest(req.fromTgId, 'accepted');

    savePartnerToLocalStorage(req.fromTgId);
    sessionStorage.setItem('matchUser', JSON.stringify({
      tg_id: req.fromTgId,
      name: req.fromName,
      avatar: req.fromAvatar,
    }));

    setTimeout(() => navigate('/chat'), 400);
  };

  const handleDecline = (fromTgId) => {
    setActionDone(prev => ({ ...prev, [fromTgId]: 'declined' }));
    respondToRequest(fromTgId, 'declined');
    setTimeout(() => {
      setActionDone(prev => ({ ...prev, [fromTgId]: undefined }));
    }, 2000);
  };

  return (
    <div className="slide-in-right flex flex-col" style={{ minHeight: '100dvh', background: '#0a0a12' }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-4 pb-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button onClick={() => navigate('/')} className="flex items-center justify-center rounded-xl transition-all"
          style={backBtnStyle} aria-label="Go back"
        >
          <BackIcon />
        </button>
        <div className="flex-1">
          <span className="text-sm font-semibold" style={{ color: '#f0effc' }}>
            So'rovlar
          </span>
          {pendingRequests.length > 0 && (
            <span className="ml-1.5 text-xs font-medium" style={{ color: '#a78bfa' }}>
              ({pendingRequests.length})
            </span>
          )}
        </div>

        {/* Refresh button */}
        <button
          onClick={loadPendingRequests}
          disabled={loading}
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
          {loading ? 'Yangilanmoqda...' : '🔄 Yangilash'}
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 32 }}>
        {loading && pendingRequests.length === 0 ? (
          <LoadingSkeleton />
        ) : pendingRequests.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="px-4 py-4 space-y-3">
            <p className="text-xs px-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Siz bilan suhbatlashmoqchi bo'lgan foydalanuvchilar
            </p>

            {pendingRequests.map((req) => {
              const status = actionDone[req.fromTgId];
              return (
                <div
                  key={req.fromTgId}
                  className="rounded-2xl p-4 transition-all duration-300"
                  style={{
                    background: status === 'accepted'
                      ? 'rgba(16,185,129,0.06)'
                      : status === 'declined'
                        ? 'rgba(239,68,68,0.04)'
                        : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${
                      status === 'accepted'
                        ? 'rgba(16,185,129,0.15)'
                        : status === 'declined'
                          ? 'rgba(239,68,68,0.1)'
                          : 'rgba(255,255,255,0.07)'
                    }`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <UserAvatar
                        name={req.fromName || '?'}
                        avatar={req.fromAvatar}
                        size={48}
                        border={false}
                      />
                      {/* Online indicator */}
                      <span
                        className="absolute -bottom-0.5 -right-0.5 rounded-full border-2"
                        style={{
                          width: 14, height: 14,
                          background: '#6ee7b7',
                          borderColor: '#0a0a12',
                          boxShadow: '0 0 6px rgba(110,231,183,0.5)',
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate" style={{ color: '#f0effc' }}>
                          {req.fromName || 'Noma\'lum'}
                        </span>
                        {req.fromTgId && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: 'rgba(124,90,240,0.12)', color: '#a78bfa', border: '1px solid rgba(124,90,240,0.15)' }}
                          >
                            VIP
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <MessageCircle size={12} style={{ color: 'rgba(255,255,255,0.25)' }} />
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          Siz bilan suhbatlashmoqchi
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  {!status && (
                    <div className="flex items-center gap-2 mt-3 ml-[60px]">
                      <button
                        onClick={() => handleAccept(req)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all"
                        style={{
                          background: 'rgba(16,185,129,0.12)',
                          border: '1px solid rgba(16,185,129,0.2)',
                          color: '#6ee7b7',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.12)'; }}
                      >
                        <Check size={15} />
                        Qabul qilish
                      </button>
                      <button
                        onClick={() => handleDecline(req.fromTgId)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all"
                        style={{
                          background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.15)',
                          color: '#f87171',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                      >
                        <X size={15} />
                        Rad etish
                      </button>
                    </div>
                  )}

                  {/* Status feedback */}
                  {status === 'accepted' && (
                    <div className="flex items-center gap-1.5 mt-3 ml-[60px] px-3 py-2 rounded-xl text-xs"
                      style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.12)' }}
                    >
                      ✅ Suhbatga o'tilmoqda...
                    </div>
                  )}
                  {status === 'declined' && (
                    <div className="flex items-center gap-1.5 mt-3 ml-[60px] px-3 py-2 rounded-xl text-xs"
                      style={{ background: 'rgba(239,68,68,0.06)', color: '#f87171', border: '1px solid rgba(239,68,68,0.1)' }}
                    >
                      ❌ So'rov rad etildi
                    </div>
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

export default RequestsPage;
