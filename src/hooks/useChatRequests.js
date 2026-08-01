import { useState, useEffect, useCallback } from 'react';
import { socket } from '../services/socket';

/**
 * useChatRequests — Chat so'rovlarini boshqarish uchun hook
 * VIP: online userlarni ko'rish + so'rov yuborish
 * Free: faqat so'rovlarni qabul/qilish
 */
export function useChatRequests(currentUser) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestSent, setRequestSent] = useState(null); // { targetTgId, targetName }
  const [requestDeclined, setRequestDeclined] = useState(null); // { targetTgId, targetName }
  // 🔴 PROTO-FIX: server `match_error` eventi orqali xatolarni yuboradi (cb'siz emit
  // qilinganda ham). Ilgari bu yerda faqat loading flag'lar tozalangani uchun VIP
  // "So'rov" tugmasiga bosganda busy/already/rate xatolari HEQ QANDAY ko'rinmasdi.
  const [requestError, setRequestError] = useState(null); // { message }
  const [loading, setLoading] = useState(false);
  const [onlineLoading, setOnlineLoading] = useState(false);

  // Sockets
  useEffect(() => {
    if (!socket.connected || !currentUser) return;

    const handlers = [
      ['online_users', ({ users }) => {
        setOnlineUsers(users || []);
        setOnlineLoading(false);
      }],
      ['chat_request_sent', ({ targetTgId, targetName }) => {
        setRequestSent({ targetTgId, targetName });
        setTimeout(() => setRequestSent(null), 3000);
      }],
      ['chat_request_received', () => {
        // So'rov kelganda avtomatik so'rovlarni yangilash
        loadPendingRequests();
      }],
      ['chat_request_declined', ({ targetTgId, targetName }) => {
        setRequestDeclined({ targetTgId, targetName });
        setTimeout(() => setRequestDeclined(null), 3000);
      }],
      ['pending_requests', ({ requests }) => {
        setPendingRequests(requests || []);
        setLoading(false);
      }],
      ['chat_request_cancelled', () => {
        loadPendingRequests();
      }],
      ['match_error', ({ message }) => {
        setOnlineLoading(false);
        setLoading(false);
        // Xatoni 3 soniya toast ko'rinishida ko'rsatamiz (so'rov yuborish xatolari)
        if (message) {
          setRequestError({ message });
          setTimeout(() => setRequestError(null), 3000);
        }
      }],
    ];

    handlers.forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // Initial load
    loadPendingRequests();

    return () => {
      handlers.forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [socket.connected, currentUser?.tg_id]);

  // Online userlarni yuklash (faqat VIP)
  const loadOnlineUsers = useCallback(() => {
    if (!socket.connected || currentUser?.plan !== 'VIP') return;
    setOnlineLoading(true);
    socket.emit('get_online_users');
  }, [currentUser?.plan]);

  // So'rov yuborish (faqat VIP)
  const sendChatRequest = useCallback((targetTgId) => {
    if (!socket.connected || currentUser?.plan !== 'VIP') return;
    socket.emit('send_chat_request', { targetTgId });
  }, [currentUser?.plan]);

  // So'rovga javob berish
  const respondToRequest = useCallback((fromTgId, action) => {
    if (!socket.connected) return;
    socket.emit('respond_chat_request', { fromTgId, action });

    if (action === 'declined') {
      // Locally remove from pending
      setPendingRequests(prev => prev.filter(r => r.fromTgId !== fromTgId));
    }
  }, []);

  // Kutilayotgan so'rovlarni yuklash
  const loadPendingRequests = useCallback(() => {
    if (!socket.connected) return;
    setLoading(true);
    socket.emit('get_pending_requests');
  }, []);

  // So'rovni bekor qilish (VIP o'zi yuborgan so'rovni olib tashlash)
  const cancelChatRequest = useCallback((targetTgId) => {
    if (!socket.connected) return;
    socket.emit('cancel_chat_request', { targetTgId });
  }, []);

  return {
    onlineUsers,
    pendingRequests,
    requestSent,
    requestDeclined,
    requestError,
    loading,
    onlineLoading,
    loadOnlineUsers,
    sendChatRequest,
    respondToRequest,
    loadPendingRequests,
    cancelChatRequest,
  };
}
