import { useEffect, useState, useRef, useCallback } from 'react';
import { SkipIcon, FlagIcon, SendIcon } from '../assets/icon';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { ScannerHeart } from '../components/ScannerHeart';
import MessageBubble from '../components/MessageBubble';
import { Navbar } from '../components/navbar';
import { socket, connectSocket } from '../services/socket';
import { savePartnerToLocalStorage, getBlacklist } from '../utils/blacklist';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const REPORT_REASONS = ['Spam', 'Zo`rovonlik', 'Behayo kontent', 'Soxta profil', 'Reklama', 'Boshqa'];

function readMessageIds() {
  try {
    return JSON.parse(localStorage.getItem('read_message_ids') || '[]');
  } catch {
    return [];
  }
}

function markAsReadLocally(messageId) {
  const ids = readMessageIds();
  if (!ids.includes(messageId)) {
    ids.push(messageId);
    localStorage.setItem('read_message_ids', JSON.stringify(ids));
  }
}

function isReadLocally(messageId) {
  return readMessageIds().includes(messageId);
}

export function ChatPage() {
  const currentUser = useCurrentUser();
  const [matchUser, setMatchUser] = useState(() => {
    const saved = sessionStorage.getItem('matchUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  const typingTimerRef = useRef(null);
  const bottomRef = useRef(null);
  const navigate = useNavigate();
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Load chat history when match user is set
  useEffect(() => {
    if (matchUser && socket.connected) {
      socket.emit('get_chat_history', { partnerTgId: matchUser.tg_id });
    }
  }, [matchUser]);

  useEffect(() => {
    if (!socket.connected && currentUser) {
      connectSocket(currentUser.tg_id);
    }

    const onMatched = (data) => {
      setMatchUser(data.partner);
      sessionStorage.setItem('matchUser', JSON.stringify(data.partner));
      savePartnerToLocalStorage(data.partner?.tg_id);
      setIsSearching(false);
      setMessages([]);
    };

    const onWaiting = () => setIsSearching(true);

    const onPartnerLeft = () => {
      setMatchUser(null);
      sessionStorage.removeItem('matchUser');
      setMessages([]);
      if (currentUser) {
        setIsSearching(true);
        socket.emit('find_match', { tg_id: currentUser.tg_id, blacklist: getBlacklist() });
      }
    };

    const onChatHistory = (history) => {
      setMessages(history);
    };

    const onReceiveMessage = (messageData) => {
      setMessages((prev) => [...prev, messageData]);

      // Mark as read if chat is visible
      if (messageData.from === 'them' && matchUser) {
        const messageIds = [messageData.id];
        socket.emit('message_read', { messageIds, senderTgId: messageData.senderTgId });
        markAsReadLocally(messageData.id);
      }
    };

    const onMessagesRead = ({ messageIds }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg.id) ? { ...msg, read: true } : msg
        )
      );
    };

    const onMessageSent = ({ tempId, serverId, time }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, id: serverId, time: time || msg.time } : msg
        )
      );
    };

    const onMessageDelivered = ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, delivered: status } : msg
        )
      );
    };

    const onPartnerTyping = () => setPartnerTyping(true);
    const onPartnerStopTyping = () => setPartnerTyping(false);

    socket.on('matched', onMatched);
    socket.on('waiting', onWaiting);
    socket.on('partner_left', onPartnerLeft);
    socket.on('chat_history', onChatHistory);
    socket.on('receive_message', onReceiveMessage);
    socket.on('messages_read', onMessagesRead);
    socket.on('message_sent', onMessageSent);
    socket.on('message_delivered', onMessageDelivered);
    socket.on('partner_typing', onPartnerTyping);
    socket.on('partner_stop_typing', onPartnerStopTyping);

    return () => {
      socket.off('matched', onMatched);
      socket.off('waiting', onWaiting);
      socket.off('partner_left', onPartnerLeft);
      socket.off('chat_history', onChatHistory);
      socket.off('receive_message', onReceiveMessage);
      socket.off('messages_read', onMessagesRead);
      socket.off('message_sent', onMessageSent);
      socket.off('message_delivered', onMessageDelivered);
      socket.off('partner_typing', onPartnerTyping);
      socket.off('partner_stop_typing', onPartnerStopTyping);
    };
  }, [currentUser, matchUser]);

  const handleNextUser = () => {
    socket.emit('leave_chat');
    setMatchUser(null);
    sessionStorage.removeItem('matchUser');
    setMessages([]);
    if (currentUser) {
      setIsSearching(true);
      socket.emit('find_match', { tg_id: currentUser.tg_id, blacklist: getBlacklist() });
    }
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !currentUser || !matchUser) return;

    const tempId = Date.now();
    const newMessage = {
      id: tempId,
      text,
      type: 'text',
      from: 'me',
      senderTgId: currentUser.tg_id,
      recipientTgId: matchUser.tg_id,
      read: false,
      time: now(),
    };

    setSending(true);
    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setPartnerTyping(false);

    socket.emit('send_message', { ...newMessage, tempId });
    setTimeout(() => setSending(false), 300);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!matchUser?.tg_id) return;
    if (!typingTimerRef.current) {
      socket.emit('typing', { recipientTgId: matchUser.tg_id });
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('stop_typing', { recipientTgId: matchUser.tg_id });
      typingTimerRef.current = null;
    }, 1000);
  };

  const handleReport = async (reason) => {
    setReportOpen(false);

    if (!currentUser || !matchUser) return;

    try {
      const response = await fetch(`${API_BASE}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reportedTgId: matchUser.tg_id,
          reason,
          chatContext: messagesRef.current.slice(-5).map(m => `${m.from}: ${m.text}`).join('\n'),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setReportSent(true);
        setTimeout(() => setReportSent(false), 3000);
      }
    } catch (error) {
      console.error('Shikoyat yuborish xatosi:', error);
    }

    // Leave chat after report
    socket.emit('leave_chat');
    setMatchUser(null);
    sessionStorage.removeItem('matchUser');
    setMessages([]);
    if (currentUser) {
      setIsSearching(true);
      socket.emit('find_match', { tg_id: currentUser.tg_id, blacklist: getBlacklist() });
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  // Searching / No match page
  if (!matchUser || isSearching) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '100dvh', background: '#0a0a12', color: '#f0effc' }}>
        <ScannerHeart />
        <div className="text-center mt-6" style={{ maxWidth: 260 }}>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>
            Faol foydalanuvchi qidirilmoqda...
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Iltimos, ozgina kuting...
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-8 px-6 py-2.5 rounded-full text-xs font-medium transition-all"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
        >
          Asosiy sahifaga qaytish
        </button>
      </div>
    );
  }

  return (
    <div className="slide-in-right flex flex-col" style={{ height: '100dvh' }}>
      <Navbar />

      {/* Actions bar */}
      <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <button
          onClick={handleNextUser}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
          style={{ background: 'rgba(124,90,240,0.18)', border: '1px solid rgba(124,90,240,0.35)', color: '#a78bfa', cursor: 'pointer' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124,90,240,0.3)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(124,90,240,0.18)'; }}
        >
          <SkipIcon />
          Next
        </button>

        <div className="flex-1" />

        <div className="relative">
          <button
            onClick={() => setReportOpen((value) => !value)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
          >
            <FlagIcon />
            Report
          </button>
          {reportOpen && (
            <div className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-50" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', minWidth: 170 }}>
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleReport(reason)}
                  className="w-full text-left text-xs px-4 py-3 transition-colors block"
                  style={{ color: '#f0effc', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  {reason}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report sent toast */}
      {reportSent && (
        <div className="px-4 py-2 text-xs text-center" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
          ✅ Shikoyatingiz qabul qilindi. Administrator tekshiradi.
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: 'none' }} onClick={() => setReportOpen(false)}>
        {messages.length === 0 && !partnerTyping ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="flex items-center justify-center rounded-full" style={{ width: 56, height: 56, background: 'rgba(124,90,240,0.12)', border: '1px solid rgba(124,90,240,0.2)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.7)" strokeWidth="1.6" width="26" height="26">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Suhbatni boshlang. (Suhbatdosh bilan)
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                prevSame={index > 0 && messages[index - 1].from === message.from}
              isMe={message.from === 'me'}
              />
            ))}
            {partnerTyping && (
              <div className="flex items-center gap-2 px-1 py-1 slide-in-right">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" style={{ animation: 'bounce 1s ease-in-out infinite', animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" style={{ animation: 'bounce 1s ease-in-out infinite', animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" style={{ animation: 'bounce 1s ease-in-out infinite', animationDelay: '300ms' }} />
                </span>
                <span className="text-xs" style={{ color: 'rgba(167,139,250,0.7)' }}>
                  Suhbatdosh yozmoqda...
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-3 py-3 flex items-end gap-2 mb-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,10,18,0.95)', backdropFilter: 'blur(16px)', paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}>
        <div className="flex-1 flex items-end rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', minHeight: 44, maxHeight: 120 }}>
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Write a message…"
            rows={1}
            className="flex-1 bg-transparent text-sm px-4 py-3 resize-none outline-none"
            style={{
              color: '#f0effc',
              caretColor: '#a78bfa',
              lineHeight: '1.45',
              scrollbarWidth: 'none',
              minHeight: 44,
            }}
          />
        </div>

        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="flex items-center justify-center rounded-2xl flex-shrink-0 transition-all"
          style={{
            width: 46,
            height: 46,
            background: input.trim() ? 'linear-gradient(135deg, #7c5af0, #5b3fd4)' : 'rgba(255,255,255,0.06)',
            border: input.trim() ? 'none' : '1px solid rgba(255,255,255,0.08)',
            color: input.trim() ? '#fff' : 'rgba(255,255,255,0.25)',
            cursor: input.trim() ? 'pointer' : 'default',
            boxShadow: input.trim() ? '0 4px 20px rgba(124,90,240,0.5)' : 'none',
            transform: sending ? 'scale(0.92)' : 'scale(1)',
            flexShrink: 0,
          }}
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
