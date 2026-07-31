import { useEffect, useState, useRef, useCallback } from 'react';
import { SkipIcon, FlagIcon, AnimatedSend } from '../assets/icon';
import { MessageCircle, Users, Image as ImageIcon, Mic, MicOff, X, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { ScannerHeart } from '../components/ScannerHeart';
import { SearchTimer } from '../components/SearchTimer';
import MessageBubble from '../components/MessageBubble';
import { Navbar } from '../components/navbar';
import { socket, connectSocket } from '../services/socket';
import { savePartnerToLocalStorage, getBlacklist } from '../utils/blacklist';
import { sfx } from '../utils/sfx';
import { uploadImageDirect, uploadAudioDirect } from '../services/cloudinary';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const REPORT_REASONS = ['Spam', 'Zo`rovonlik', 'Behayo kontent', 'Soxta profil', 'Reklama', 'Boshqa'];
const SEARCH_TIMEOUT_MS = 60000; // 60 soniya — juft topilmasa avtomatik to'xtaydi

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

function formatRecordingTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
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
  const [searchTimedOut, setSearchTimedOut] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [onlineCount, setOnlineCount] = useState(null);
  const [searchSeconds, setSearchSeconds] = useState(0);
  const [mediaError, setMediaError] = useState(''); // Media upload error toast
  const searchTimerRef = useRef(null);
  const searchClockRef = useRef(null);

  // Media upload states
  const fileInputRef = useRef(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const typingTimerRef = useRef(null);
  const bottomRef = useRef(null);
  const navigate = useNavigate();
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // ── Qidiruv timeout + bekor qilish ─────────────────────────────
  const clearSearchTimer = () => {
    if (searchTimerRef.current) { clearTimeout(searchTimerRef.current); searchTimerRef.current = null; }
  };

  // Sekund hisoblagich (taymer) — har 1 soniyada yangilanadi
  const startClock = () => {
    stopClock();
    setSearchSeconds(0);
    searchClockRef.current = setInterval(() => {
      setSearchSeconds((s) => Math.min(s + 1, SEARCH_TIMEOUT_MS / 1000));
    }, 1000);
  };

  const stopClock = () => {
    if (searchClockRef.current) { clearInterval(searchClockRef.current); searchClockRef.current = null; }
  };

  const startSearch = () => {
    if (!currentUser) return;
    clearSearchTimer();
    setIsSearching(true);
    setSearchTimedOut(false);
    sfx.warm(); // AudioContext ni user gesture ichida tayyorlaymiz
    startClock();
    socket.emit('find_match', { tg_id: currentUser.tg_id, blacklist: getBlacklist() });
    // 60 soniyada juft topilmasa — avtomatik to'xtatamiz
    searchTimerRef.current = setTimeout(() => {
      stopClock();
      setSearchTimedOut(true);
      setIsSearching(false);
      sfx.timeout();
      socket.emit('cancel_match');
    }, SEARCH_TIMEOUT_MS);
  };

  const cancelSearch = () => {
    clearSearchTimer();
    stopClock();
    setIsSearching(false);
    setSearchTimedOut(false);
    sfx.cancel();
    socket.emit('cancel_match');
    navigate('/');
  };

  // Sahifa yopilganda ham server queue dan olib tashlaymiz
  useEffect(() => {
    return () => {
      clearSearchTimer();
      stopClock();
      if (socket.connected) socket.emit('cancel_match');
    };
  }, []);

  // Load chat history when match user is set
  useEffect(() => {
    if (matchUser && socket.connected) {
      socket.emit('get_chat_history', { partnerTgId: matchUser.tg_id });
    }
  }, [matchUser]);

  // Mount bo'lganda partner statusni tekshirish (agar sessionStorage bo'sh bo'lsa)
  useEffect(() => {
    if (!socket.connected || !currentUser) return;

    const saved = sessionStorage.getItem('matchUser');
    if (saved) return; // Allaqachon matchUser bor

    // Backenddan tekshiramiz
    socket.emit('check_partner');

    const onCurrentPartner = (data) => {
      if (data?.partner?.tg_id) {
        sessionStorage.setItem('matchUser', JSON.stringify(data.partner));
        savePartnerToLocalStorage(data.partner.tg_id);
        setMatchUser(data.partner);
      }
    };

    socket.on('current_partner', onCurrentPartner);
    return () => socket.off('current_partner', onCurrentPartner);
  }, [currentUser?.tg_id, socket.connected]);

  useEffect(() => {
    if (!socket.connected && currentUser) {
      connectSocket(currentUser.tg_id);
    }

    const onMatched = (data) => {
      clearSearchTimer();
      stopClock();
      sfx.match();
      setMatchUser(data.partner);
      sessionStorage.setItem('matchUser', JSON.stringify(data.partner));
      savePartnerToLocalStorage(data.partner?.tg_id);
      setIsSearching(false);
      setSearchTimedOut(false);
      setMessages([]);
    };

    const onWaiting = () => setIsSearching(true);

    const onPartnerLeft = () => {
      setMatchUser(null);
      sessionStorage.removeItem('matchUser');
      setMessages([]);
      startSearch();
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

    const onMatchError = ({ message }) => {
      console.error('Socket xatolik:', message);
      setMediaError(message || 'Xatolik yuz berdi');
      setTimeout(() => setMediaError(''), 5000);
    };

    const onOnlineCount = ({ count }) => setOnlineCount(count);
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
    socket.on('match_error', onMatchError);
    socket.on('online_count', onOnlineCount);
    socket.on('partner_typing', onPartnerTyping);
    socket.on('partner_stop_typing', onPartnerStopTyping);

    // Get initial online count
    if (socket.connected) {
      socket.emit('get_online_count');
    }

    return () => {
      clearSearchTimer();
      stopClock();
      socket.off('matched', onMatched);
      socket.off('waiting', onWaiting);
      socket.off('partner_left', onPartnerLeft);
      socket.off('chat_history', onChatHistory);
      socket.off('receive_message', onReceiveMessage);
      socket.off('messages_read', onMessagesRead);
      socket.off('message_sent', onMessageSent);
      socket.off('message_delivered', onMessageDelivered);
      socket.off('match_error', onMatchError);
      socket.off('online_count', onOnlineCount);
      socket.off('partner_typing', onPartnerTyping);
      socket.off('partner_stop_typing', onPartnerStopTyping);
    };
  }, [currentUser, matchUser]);

  const handleNextUser = () => {
    socket.emit('leave_chat');
    setMatchUser(null);
    sessionStorage.removeItem('matchUser');
    setMessages([]);
    startSearch();
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

  // ── Media Upload (Image) ─────────────────────────────────────────────────
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !matchUser) return;

    setUploadingMedia(true);
    setShowMediaPicker(false);
    try {
      const mediaUrl = await uploadImageDirect(file);
      if (mediaUrl) {
        const tempId = Date.now();
        const newMessage = {
          id: tempId,
          text: '',
          type: 'image',
          mediaUrl,
          from: 'me',
          senderTgId: currentUser.tg_id,
          recipientTgId: matchUser.tg_id,
          read: false,
          time: now(),
        };

        setMessages((prev) => [...prev, newMessage]);
        socket.emit('send_message', { ...newMessage, tempId });
      }
    } catch (err) {
      console.error('Rasm yuborish xatosi:', err);
      setMediaError('Rasm yuborilmadi. Server bilan bog\'lanishni tekshiring.');
      setTimeout(() => setMediaError(''), 4000);
    } finally {
      setUploadingMedia(false);
    }
  };

  // ── Voice Recording ─────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size < 100) return;

        setUploadingMedia(true);
        try {
          const mediaUrl = await uploadAudioDirect(audioBlob);
          if (mediaUrl) {
            const tempId = Date.now();
            const newMessage = {
              id: tempId,
              text: '',
              type: 'voice',
              mediaUrl,
              from: 'me',
              senderTgId: currentUser.tg_id,
              recipientTgId: matchUser.tg_id,
              read: false,
              time: now(),
            };

            setMessages((prev) => [...prev, newMessage]);
            socket.emit('send_message', { ...newMessage, tempId });
          }
        } catch (err) {
          console.error('Audio yuborish xatosi:', err);
          setMediaError('Ovozli xabar yuborilmadi. Server bilan bog\'lanishni tekshiring.');
          setTimeout(() => setMediaError(''), 4000);
        } finally {
          setUploadingMedia(false);
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setShowMediaPicker(false);

      // Timer
      let sec = 0;
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        sec++;
        setRecordingTime(sec);
        if (sec >= 30) stopRecording(); // Max 30 seconds
      }, 1000);
    } catch (err) {
      console.error('Mikrofon xatosi:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
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
      // Telegram WebApp initData ni olish (cookie yo'q bo'lsa fallback sifatida)
      const initData = window.Telegram?.WebApp?.initData || '';
      
      const headers = { 'Content-Type': 'application/json' };
      if (initData) {
        headers['x-telegram-init-data'] = initData;
      }

      const response = await fetch(`${API_BASE}/api/reports`, {
        method: 'POST',
        headers,
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
    startSearch();
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  // Searching / No match page
  if (!matchUser || isSearching) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '100dvh', background: 'transparent', color: '#f0effc' }}>
        <ScannerHeart />
        <div className="text-center mt-6" style={{ maxWidth: 280 }}>
          {onlineCount !== null && (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs" style={{ background: 'rgba(124,90,240,0.12)', border: '1px solid rgba(124,90,240,0.22)', color: '#a78bfa', boxShadow: '0 0 18px rgba(124,90,240,0.12)' }}>
              <Users size={13} />
              <span className="font-bold">{onlineCount}</span>
              <span style={{ color: 'rgba(167,139,250,0.6)' }}>online</span>
              <span className="rounded-full" style={{ width: 6, height: 6, background: '#6ee7b7', boxShadow: '0 0 6px #6ee7b7', display: 'inline-block' }} />
            </div>
          )}

          {isSearching && !searchTimedOut && (
            <SearchTimer elapsed={searchSeconds} total={SEARCH_TIMEOUT_MS / 1000} />
          )}

          {searchTimedOut && (
            <div className="animate-bounce-in">
              <p className="text-sm font-medium" style={{ color: '#fcd34d', lineHeight: '1.6' }}>
                Qidiruv vaqti tugadi
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Hozircha bo'sh foydalanuvchi topilmadi. Keyinroq qayta urinib ko'ring.
              </p>
            </div>
          )}
        </div>

        {isSearching && !searchTimedOut ? (
          <button
            onClick={cancelSearch}
            className="btn-soft flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold"
            style={{ cursor: 'pointer' }}
          >
            <X size={15} />
            Qidiruvni bekor qilish
          </button>
        ) : searchTimedOut ? (
          <div className="flex items-center gap-2 mt-8">
            <button
              onClick={() => navigate('/')}
              className="btn-soft px-5 py-2.5 rounded-full text-xs font-medium"
              style={{ cursor: 'pointer' }}
            >
              Asosiy sahifaga qaytish
            </button>
            <button
              onClick={startSearch}
              className="btn-glow flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold"
              style={{ cursor: 'pointer' }}
            >
              <RotateCcw size={13} />
              Qayta urinish
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/')}
            className="btn-soft mt-8 px-6 py-2.5 rounded-full text-xs font-medium"
            style={{ cursor: 'pointer' }}
          >
            Asosiy sahifaga qaytish
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="slide-in-right flex flex-col" style={{ height: '100dvh' }}>
      <Navbar />

      {/* Actions bar */}
      <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(7,7,13,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
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
            <div className="absolute right-0 top-full mt-2 rounded-2xl overflow-hidden z-50 animate-slide-up" style={{ background: 'rgba(20,20,32,0.92)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 16px 50px rgba(0,0,0,0.55)', minWidth: 180 }}>
              <div className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Shikoyat sababi
              </div>
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
        <div className="px-4 py-2 text-xs text-center animate-bounce-in" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', borderBottom: '1px solid rgba(34,197,94,0.15)' }}>
          ✅ Shikoyatingiz qabul qilindi. Administrator tekshiradi.
        </div>
      )}

      {/* Media error toast */}
      {mediaError && (
        <div className="px-4 py-2 text-xs text-center animate-shake" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
          {mediaError}
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: 'none' }} onClick={() => setReportOpen(false)}>
        {messages.length === 0 && !partnerTyping ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="flex items-center justify-center rounded-full glass card-glow" style={{ width: 60, height: 60, background: 'rgba(124,90,240,0.12)', border: '1px solid rgba(124,90,240,0.22)', boxShadow: '0 0 24px rgba(124,90,240,0.12)' }}>
              <MessageCircle size={28} style={{ color: 'rgba(167,139,250,0.8)' }} />
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
      <div className="flex-shrink-0 px-3 py-3 flex items-end gap-2 mb-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(7,7,13,0.72)', backdropFilter: 'blur(20px) saturate(140%)', WebkitBackdropFilter: 'blur(20px) saturate(140%)', paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}>
        {/* VIP: Media buttons (left side) */}
        {currentUser?.plan === 'VIP' && !isRecording && (
          <div className="relative">
            <button
              onClick={() => setShowMediaPicker(!showMediaPicker)}
              className="flex items-center justify-center rounded-2xl flex-shrink-0 transition-all"
              style={{
                width: 46,
                height: 46,
                background: showMediaPicker ? 'rgba(124,90,240,0.2)' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: showMediaPicker ? '#a78bfa' : 'rgba(255,255,255,0.45)',
                cursor: 'pointer',
              }}
              disabled={uploadingMedia}
              aria-label="Add media"
            >
              <ImageIcon size={20} />
            </button>

            {showMediaPicker && (
              <>
                <div
                  className="absolute bottom-full left-0 mb-2 rounded-2xl overflow-hidden z-50 animate-slide-up"
                  style={{
                    background: 'rgba(20,20,32,0.92)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: '0 16px 50px rgba(0,0,0,0.55)',
                    minWidth: 150,
                  }}
                >
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-2 text-xs px-4 py-3 transition-colors"
                    style={{ color: '#f0effc', background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124,90,240,0.12)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                  >
                    <ImageIcon size={16} style={{ color: '#a78bfa' }} />
                    Rasm yuborish
                  </button>
                  <button
                    onClick={startRecording}
                    className="w-full flex items-center gap-2 text-xs px-4 py-3 transition-colors"
                    style={{ color: '#f0effc', background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(124,90,240,0.12)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                  >
                    <Mic size={16} style={{ color: '#f59e0b' }} />
                    Ovozli xabar
                  </button>
                </div>
                <div className="fixed inset-0 z-40" onClick={() => setShowMediaPicker(false)} />
              </>
            )}
          </div>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <button
            onClick={stopRecording}
            className="flex items-center justify-center rounded-2xl flex-shrink-0 transition-all animate-pulse-glow"
            style={{
              width: 46,
              height: 46,
              background: 'rgba(239,68,68,0.2)',
              border: '1px solid rgba(239,68,68,0.4)',
              color: '#f87171',
              cursor: 'pointer',
            }}
            aria-label="Stop recording"
          >
            <MicOff size={20} />
          </button>
        )}

        {/* Recording timer */}
        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: '#f87171', animation: 'heartbeat 1s ease-in-out infinite' }} />
            <span className="text-xs font-medium" style={{ color: '#f87171', fontVariantNumeric: 'tabular-nums' }}>
              {formatRecordingTime(recordingTime)}
            </span>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />

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
            placeholder={uploadingMedia ? 'Yuklanmoqda...' : 'Write a message…'}
            rows={1}
            disabled={uploadingMedia}
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
          disabled={!input.trim() || uploadingMedia}
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
          <AnimatedSend size={20} flying={sending} />
        </button>
      </div>
    </div>
  );
}
