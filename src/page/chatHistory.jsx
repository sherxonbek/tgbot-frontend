import { useEffect, useState, useRef } from 'react';
import { BackIcon, ChevronRight } from '../assets/icon';
import { MessageCircle, Users, Image, Mic } from 'lucide-react';
import { IconButton } from '../components/IconButton';
import { UserAvatar } from '../components/Avatar';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { fetchChatHistory } from '../services/api';

const sectionStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
};

const backButtonStyle = {
  width: 38, height: 38,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.7)',
  cursor: 'pointer', flexShrink: 0,
  backdropFilter: 'blur(10px)',
};

function LoaderSpinner() {
  return (
    <svg className="animate-spin" viewBox="0 0 24 24" fill="none" width="20" height="20">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function MessageTypeIcon({ type }) {
  switch (type) {
    case 'image': return <Image size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />;
    case 'voice': return <Mic size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />;
    default: return null;
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Kecha';
  } else if (days < 7) {
    return `${days} kun oldin`;
  } else {
    return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
  }
}

export function ChatHistoryPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.plan !== 'VIP') {
      navigate('/');
      return;
    }

    loadHistory(1);
  }, [user]);

  const loadHistory = async (p) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchChatHistory({ page: p });
      if (data.success) {
        setHistory(data.history);
        setTotalPages(data.totalPages);
        setPage(data.page);
      }
    } catch (err) {
      setError('Chat tarixini yuklashda xatolik yuz berdi');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="slide-in-right flex flex-col" style={{ minHeight: '100dvh', background: 'transparent' }}>
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 pt-4 pb-3 sticky top-0 z-20"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(7,7,13,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        <IconButton
          onClick={() => navigate('/settings')}
          className="rounded-xl"
          style={backButtonStyle}
          aria-label="Go back"
        >
          <BackIcon />
        </IconButton>
        <div>
          <span className="text-sm font-semibold" style={{ color: '#f0effc' }}>
            Chat tarixi
          </span>
          <span className="chip ml-2" style={{ background: 'rgba(245,158,11,0.14)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.25)' }}>
            ✨ VIP
          </span>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 px-4 py-3 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
          {error}
          <button
            onClick={() => loadHistory(1)}
            className="ml-2 underline"
            style={{ color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Qayta urinish
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <LoaderSpinner />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && history.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <div
            className="flex items-center justify-center rounded-full mb-4"
            style={{ width: 64, height: 64, background: 'rgba(124,90,240,0.1)', border: '1px solid rgba(124,90,240,0.2)' }}
          >
            <MessageCircle size={28} style={{ color: 'rgba(167,139,250,0.5)' }} />
          </div>
          <p className="text-sm font-medium text-center" style={{ lineHeight: '1.6' }}>
            Hali hech qanday chat tarixi mavjud emas
          </p>
          <p className="text-xs mt-2 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Suhbat tugagandan so'ng, tarix shu yerda saqlanadi
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-5 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ background: 'rgba(124,90,240,0.15)', border: '1px solid rgba(124,90,240,0.25)', color: '#a78bfa', cursor: 'pointer' }}
          >
            Suhbatni boshlash
          </button>
        </div>
      )}

      {/* History list */}
      {!loading && history.length > 0 && (
        <div className="flex-1 px-4 py-4 space-y-2">
          {history.map((item, i) => (
            <div
              key={item.roomId}
              className="rounded-2xl p-3 flex items-center gap-3 transition-all animate-slide-up"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                cursor: 'pointer',
                animationDelay: `${Math.min(i, 8) * 40}ms`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(124,90,240,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
            >
              <UserAvatar
                name={item.partner?.name}
                avatar={item.partner?.avatar}
                size={42}
                border={false}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate" style={{ color: '#f0effc' }}>
                    {item.partner?.name || 'Noma\'lum foydalanuvchi'}
                  </span>
                  <span className="text-xs flex-shrink-0 ml-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {formatDate(item.lastMessage?.time)}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {item.lastMessage?.type === 'image' && '📷 Rasm'}
                    {item.lastMessage?.type === 'voice' && '🎤 Ovozli xabar'}
                    {item.lastMessage?.type === 'text' && (item.lastMessage?.text || '')}
                    {(!item.lastMessage?.type || item.lastMessage?.type === 'gif') && 'Xabar'}
                  </span>
                  <span className="text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    · {item.messageCount} xabar
                  </span>
                </div>
              </div>
              <ChevronRight style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4 pb-8">
              <button
                disabled={page <= 1}
                onClick={() => loadHistory(page - 1)}
                className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: page <= 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                ← Oldingi
              </button>
              <span className="flex items-center text-xs px-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => loadHistory(page + 1)}
                className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: page >= totalPages ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Keyingi →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ChatHistoryPage;
