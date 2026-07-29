import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import HomePage from './page/home';
import { SettingsPage } from './page/settings';
import { ChatPage } from './page/chatPage';
import { AdminPage } from './page/admin';
import NotificationsPage from './page/notifications';
import { ChatHistoryPage } from './page/chatHistory';
import { useUser } from './context/UserContext';
import { ScannerHeart } from './components/ScannerHeart';

export default function App() {
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  const { user, loading } = useUser();

  // 1. Chiroyli loading ekrani
  if (loading) {
    return (
      <div className="fade-in-up flex flex-col items-center justify-center" style={{ minHeight: '100dvh', background: '#0a0a12', color: '#f0effc' }}>
        <ScannerHeart />
        <div className="text-center mt-8" style={{ maxWidth: 240 }}>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>
            Yuklanmoqda...
          </p>
          <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Telegram Chat
          </p>
        </div>
      </div>
    );
  }

  // 3. User topilmadi — ro'yxatdan o'tmagan
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '100dvh', background: '#0a0a12', color: '#f0effc' }}>
        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Iltimos, Telegram bot orqali ro'yxatdan o'ting va /start bosing
        </p>
      </div>
    );
  }

  // 4. Hamma ma'lumot to'liq — UI chizamiz
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/chat-history" element={<ChatHistoryPage />} />
      </Routes>
    </BrowserRouter>
  );
}
