import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import HomePage from './page/home';
import { SettingsPage } from './page/settings';
import { ChatPage } from './page/chatPage';
import { AdminPage } from './page/admin';
import NotificationsPage from './page/notifications';
import { RequestsPage } from './page/requests';
import { ChatHistoryPage } from './page/chatHistory';
import { useUser } from './context/UserContext';
import { ScannerHeart } from './components/ScannerHeart';
import { socket } from './services/socket';
import { savePartnerToLocalStorage } from './utils/blacklist';

// Global matched event listener (direct chat uchun)
function GlobalMatchListener() {
  const navigate = useNavigate();
  const navigatedRef = useRef(false);

  useEffect(() => {
    const handleMatched = (data) => {
      // /chat page'ida bo'lmasa navigatsiya qilamiz
      if (window.location.pathname !== '/chat' && data?.partner?.tg_id) {
        navigatedRef.current = true;
        savePartnerToLocalStorage(data.partner.tg_id);
        sessionStorage.setItem('matchUser', JSON.stringify(data.partner));
        navigate('/chat');
      }
    };

    socket.on('matched', handleMatched);
    return () => socket.off('matched', handleMatched);
  }, [navigate]);

  return null;
}

export default function App() {
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  const { user, loading } = useUser();

  // Aurora background layer (har doim ko'rinadi)
  const auroraBg = (
    <div className="aurora" aria-hidden="true">
      <div className="aurora-orb orb-1" />
      <div className="aurora-orb orb-2" />
      <div className="aurora-orb orb-3" />
    </div>
  );

  // 1. Chiroyli loading ekrani
  if (loading) {
    return (
      <div className="fade-in-up flex flex-col items-center justify-center" style={{ minHeight: '100dvh', background: 'transparent', color: '#f0effc' }}>
        {auroraBg}
        <div className="relative" style={{ zIndex: 1 }}>
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
      </div>
    );
  }

  // 3. User topilmadi — ro'yxatdan o'tmagan
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '100dvh', background: 'transparent', color: '#f0effc' }}>
        {auroraBg}
        <div className="relative text-center" style={{ zIndex: 1 }}>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Iltimos, Telegram bot orqali ro'yxatdan o'ting va /start bosing
          </p>
        </div>
      </div>
    );
  }

  // 4. Hamma ma'lumot to'liq — UI chizamiz
  return (
    <BrowserRouter>
      {/* Global matched listener (doimiy mount — socket.connected shartisiz) */}
      <GlobalMatchListener />
      {auroraBg}
      <div className="app-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/chat-history" element={<ChatHistoryPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
