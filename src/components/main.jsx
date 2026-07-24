import { useNavigate } from 'react-router-dom';
import { ScannerHeart } from './ScannerHeart';
import { useCurrentUser } from '../hooks/useCurrentUser';

const searchButtonStyle = {
  background: 'rgba(124,90,240,0.12)',
  border: '1px solid rgba(124,90,240,0.25)',
  color: '#a78bfa',
  cursor: 'pointer',
};

export function Main() {
  const navigate = useNavigate();
  const user = useCurrentUser();

  const handleSearch = () => navigate('/chat');

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-8">
      <ScannerHeart />

      <div className="text-center" style={{ maxWidth: 240 }}>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.38)', lineHeight: '1.6' }}>
          Salom, {user?.name || 'Foydalanuvchi'}! Faol foydalanuvchi qidirish
        </p>
      </div>

      <button
        className="flex items-center gap-2 px-8 py-3 rounded-full text-xs font-medium transition-all"
        onClick={handleSearch}
        style={searchButtonStyle}
      >
        <span
          className="rounded-full"
          style={{
            width: 6,
            height: 6,
            background: '#a78bfa',
            boxShadow: '0 0 6px #a78bfa',
            display: 'inline-block',
            animation: 'heartbeat 2s ease-in-out infinite',
          }}
        />
        Qidirish
      </button>
    </main>
  );
}

export default Main;