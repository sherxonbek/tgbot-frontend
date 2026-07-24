import { io } from 'socket.io-client';

const SOCKET_URL = 'https://tgbot-backend-r3ei.onrender.com';

export const socket = io(SOCKET_URL, {
  autoConnect: false, // Avtomatik ulanishni o'chirib turamiz
});