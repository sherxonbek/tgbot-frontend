import { io } from 'socket.io-client';
import { messageQueue } from './messageQueue';
import { getTelegramInitData } from './api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://tgbot-backend-r3ei.onrender.com';

// Socket.IO konfiguratsiyasi — optimallashtirilgan
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000,
  reconnectionDelayMax: 30000,
  randomizationFactor: 0.5,
  timeout: 20000,
  transports: ['websocket', 'polling'], // WebSocket birinchi (tezroq)
});

// Reconnection state tracking
let reconnectAttempts = 0;

socket.on('connect', () => {
  reconnectAttempts = 0;
  console.log('✅ Socket ulandi');

  // Start message queue processor
  messageQueue.start(socket);
});

socket.on('disconnect', (reason) => {
  console.log('⚠️ Socket uzildi:', reason);
  if (reason === 'io server disconnect') {
    // Server tomonidan uzilgan — qayta ulanmaymiz
    socket.connect();
  }
});

socket.on('connect_error', (error) => {
  reconnectAttempts++;
  if (error.message === 'websocket error') {
    console.log(`⏳ WebSocket xatolik (${reconnectAttempts}), HTTP polling...`);
  } else {
    console.warn('⚠️ Socket ulanish xatosi:', error.message);
  }

  // Auth xatosi — initData tayyor bo'lmagan/eskirgan bo'lishi mumkin.
  // Faqat initData HAQIQATAN o'zgarganda qo'lda qayta ulanamiz — aks holda
  // socket.io'ning o'zi backoff bilan avtomatik qayta urinadi (2s → 30s).
  // Bu yopishib qoluvchi tez loop (connect → error → connect) oldini oladi.
  if (['Auth required', 'Auth mismatch', 'Auth failed', 'User not found'].includes(error.message)) {
    const freshInitData = getTelegramInitData();
    if (freshInitData && socket.auth?.initData !== freshInitData) {
      socket.auth = { ...socket.auth, initData: freshInitData };
      socket.connect();
    }
  }
});

socket.on('reconnect_attempt', (attempt) => {
  console.log(`🔄 Socket qayta ulanish: ${attempt}`);
});

socket.on('reconnect', () => {
  console.log('✅ Socket qayta ulandi!');
  // Flush pending messages
  messageQueue.flush();
});

// ── Typing Throttle ───────────────────────────────────────────────────────
// Frontend-side: faqat 2 soniyada 1 marta typing event yuboriladi
let lastTypingEmit = 0;
const TYPING_THROTTLE_MS = 2000;

/**
 * Throttled typing indicator — 10k user bilan socket spamini oldini oladi
 */
export function emitTyping(recipientTgId) {
  if (!recipientTgId || !socket.connected) return;
  const now = Date.now();
  if (now - lastTypingEmit > TYPING_THROTTLE_MS) {
    lastTypingEmit = now;
    socket.emit('typing', { recipientTgId });
  }
}

/**
 * Stop typing indicator
 */
export function emitStopTyping(recipientTgId) {
  if (!recipientTgId || !socket.connected) return;
  socket.emit('stop_typing', { recipientTgId });
}

// ── Connection Management ────────────────────────────────────────────────
export function connectSocket(tgId) {
  if (!tgId) return;

  // Server tomonda auth: cookie JWT yoki initData bilan tasdiqlanadi.
  // tg_id faqat moslikni tekshirish uchun — ishonch manbai emas!
  socket.auth = {
    tg_id: String(tgId),
    initData: getTelegramInitData() || undefined,
  };

  if (!socket.connected) {
    socket.connect();
  } else {
    // Already connected — start message queue
    messageQueue.start(socket);
  }
}

export function disconnectSocket() {
  messageQueue.stop();
  socket.disconnect();
}

// ── Socket.IO ACK Helpers ────────────────────────────────────────────────
/**
 * Send event with timeout and ACK callback
 * @param {string} event - Socket event name
 * @param {object} data - Event data
 * @param {number} timeoutMs - Timeout in ms
 * @returns {Promise} - Resolves with server response or rejects on timeout
 */
export function emitWithAck(event, data, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    if (!socket.connected) {
      reject(new Error('Socket not connected'));
      return;
    }

    // Handle disconnect during request — reject promise
    const onDisconnect = () => {
      cleanup();
      reject(new Error('Socket disconnected'));
    };

    const cleanup = () => {
      socket.off('disconnect', onDisconnect);
    };

    socket.on('disconnect', onDisconnect);

    socket.timeout(timeoutMs).emit(event, data, (err, response) => {
      cleanup();
      if (err) reject(err);
      else resolve(response);
    });
  });
}
