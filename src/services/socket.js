import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://tgbot-backend-r3ei.onrender.com';

// Socket.IO konfiguratsiyasi — Render free tier sleep muammosi uchun
// qayta ulanish va timeout sozlamalari kengaytirilgan
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true, // httpOnly cookie ni yuborish uchun
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000,        // Boshlang'ich delay 2 soniya
  reconnectionDelayMax: 30000,    // Maksimal delay 30 soniya
  randomizationFactor: 0.5,       // Delay ni randomizatsiya qilish
  timeout: 20000,                 // Ulanish timeout 20 soniya
  transports: ['polling', 'websocket'], // Avval HTTP polling, keyin WebSocket
});

// Render free tier sleep dan qayta ulanishda xatolarni log qilish
socket.on('connect_error', (error) => {
  if (error.message === 'websocket error') {
    console.log('⏳ WebSocket ulanishda xatolik, HTTP polling orqali qayta urinilmoqda...');
  } else {
    console.warn('⚠️ Socket ulanish xatosi:', error.message);
  }
});

socket.on('reconnect_attempt', (attempt) => {
  console.log(`🔄 Socket qayta ulanish urinishi: ${attempt}`);
});

socket.on('reconnect', () => {
  console.log('✅ Socket qayta ulandi!');
});

export function connectSocket(tgId) {
  if (!tgId) return;

  socket.auth = { tg_id: String(tgId) };

  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket() {
  socket.disconnect();
}
