import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import HomePage from './page/home';
import { SettingsPage } from './page/settings';
import { ChatPage } from './page/chatPage';
import { AdminPage } from './page/admin';
import NotificationsPage from './page/notifications';
import { useUser } from './context/UserContext';
import { AnimatedLoader, HeartIcon } from './assets/icon';

export default function App() {
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  const { user, loading, serverStatus } = useUser();

  // 1. Serverdan javob kutilyapti yoki server uyg'onmoqda
  if (loading) {
    const isWakingUp = serverStatus === 'waking';

    return (
      <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: '100dvh', background: '#0a0a12', color: '#f0effc' }}>
        {isWakingUp ? (
          <>
            <HeartIcon size={48} className="heartbeat" style={{ color: '#a78bfa' }} />
            <div className="text-center" style={{ maxWidth: 280 }}>
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Serverni uyg'otmoqdamiz...
              </p>
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Render.com free tier sababli server 15 daqiqa harakatsizlikda uyquga ketadi. 
                Iltimos, 30-40 soniya kuting...
              </p>
            </div>
          </>
        ) : (
          <>
            <AnimatedLoader size={32} style={{ color: '#a78bfa' }} />
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Yuklanmoqda, iltimos kuting...
            </p>
          </>
        )}
      </div>
    );
  }

  // 2. Server offline
  if (serverStatus === 'offline') {
    return (
      <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: '100dvh', background: '#0a0a12', color: '#f0effc' }}>
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 64, height: 64, background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.25)' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" width="28" height="28">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="text-center" style={{ maxWidth: 300 }}>
          <p className="text-sm font-medium" style={{ color: '#f87171' }}>
            Serverga ulanib bo'lmadi
          </p>
          <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Render.com serveri ishlamayapti. Iltimos, bir necha daqiqadan so'ng 
            qayta urinib ko'ring yoki administrator bilan bog'laning.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-6 py-2.5 rounded-full text-xs font-medium transition-all"
          style={{ background: 'rgba(124,90,240,0.15)', border: '1px solid rgba(124,90,240,0.3)', color: '#a78bfa', cursor: 'pointer' }}
        >
          Qayta urinish
        </button>
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
      </Routes>
    </BrowserRouter>
  );
}
