import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import HomePage from './page/home';
import { SettingsPage } from './page/settings';
import { ChatPage } from './page/chatPage';
import { useUser } from './context/UserContext';

export default function App() {
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '100dvh', background: '#0a0a12', color: '#f0effc' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mb-3"></div>
        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Yuklanmoqda, iltimos kuting...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '100dvh', background: '#0a0a12', color: '#f0effc' }}>
        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Iltimos, Telegram bot orqali ro'yxatdan o'ting va /start bosing
        </p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}
