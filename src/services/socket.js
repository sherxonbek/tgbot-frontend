import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true, // httpOnly cookie ni yuborish uchun
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
