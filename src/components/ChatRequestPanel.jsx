import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Check, UserPlus } from 'lucide-react';
import { UserAvatar } from './Avatar';
import { useChatRequests } from '../hooks/useChatRequests';

/**
 * ChatRequestPanel — Kutilayotgan so'rovlar paneli
 * Navbarda ko'rinadi, hamma userlar (VIP va Free) so'rovlarni qabul qilishi mumkin
 */
export function ChatRequestPanel({ currentUser, isOpen, onClose }) {
  const {
    pendingRequests,
    loading,
    respondToRequest,
    loadPendingRequests,
  } = useChatRequests(currentUser);

  const panelRef = useRef(null);

  // Yangi so'rov kelganda panelni ochiq bo'lsa yangilash
  useEffect(() => {
    if (isOpen) {
      loadPendingRequests();
    }
  }, [isOpen]);

  // Panel tashqarisiga bosilganda yopish
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };

    // Mikro-task orqali qo'shamiz (hozirgi click event dan keyin)
    requestAnimationFrame(() => {
      document.addEventListener('click', handleClickOutside);
    });

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 rounded-2xl overflow-hidden z-50 animate-slide-up"
      style={{
        width: 320,
        maxWidth: 'calc(100vw - 32px)',
        background: '#1a1a2e',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <UserPlus size={16} style={{ color: '#a78bfa' }} />
          <span className="text-sm font-semibold" style={{ color: '#f0effc' }}>
            So'rovlar
          </span>
          {pendingRequests.length > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{
                background: 'rgba(167,139,250,0.15)',
                color: '#a78bfa',
                fontSize: 10,
              }}
            >
              {pendingRequests.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-lg transition-all"
          style={{
            width: 28,
            height: 28,
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
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
        ) : pendingRequests.length === 0 ? (
          <div className="flex flex-col items-center py-8 px-4">
            <div
              className="flex items-center justify-center rounded-full mb-2"
              style={{
                width: 40,
                height: 40,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <MessageCircle size={18} style={{ color: 'rgba(255,255,255,0.2)' }} />
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Kutilayotgan so'rovlar yo'q
            </p>
          </div>
        ) : (
          <div className="py-1">
            {pendingRequests.map((req) => (
              <div
                key={req.fromTgId}
                className="flex items-center gap-3 px-4 py-3 transition-all"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <UserAvatar
                  name={req.fromName || '?'}
                  avatar={req.fromAvatar}
                  size={38}
                  border={false}
                />
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-medium truncate"
                    style={{ color: '#f0effc' }}
                  >
                    {req.fromName || 'Noma\'lum'}
                  </div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Siz bilan suhbatlashmoqchi
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => respondToRequest(req.fromTgId, 'accepted')}
                    className="flex items-center justify-center rounded-lg transition-all"
                    style={{
                      width: 34,
                      height: 34,
                      background: 'rgba(16,185,129,0.15)',
                      border: '1px solid rgba(16,185,129,0.25)',
                      color: '#6ee7b7',
                      cursor: 'pointer',
                    }}
                    title="Qabul qilish"
                    aria-label="Accept"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => respondToRequest(req.fromTgId, 'declined')}
                    className="flex items-center justify-center rounded-lg transition-all"
                    style={{
                      width: 34,
                      height: 34,
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      color: '#f87171',
                      cursor: 'pointer',
                    }}
                    title="Rad etish"
                    aria-label="Decline"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatRequestPanel;
