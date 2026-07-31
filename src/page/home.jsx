import { useNavigate } from 'react-router-dom';
import { SettingsIcon } from '../assets/icon';
import Main from '../components/main';
import { Navbar } from '../components/navbar';
import { IconButton } from '../components/IconButton';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="fade-in-up" style={{ height: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <Main />
      </div>

      <div style={{ position: 'absolute', bottom: 28, right: 24 }}>
        {/* 20-FIX: inline style o'rniga CSS class — hover effekti ham CSS'da */}
        <IconButton
          onClick={() => navigate('/settings')}
          className="icon-btn-settings"
          aria-label="Open settings"
        >
          <SettingsIcon />
        </IconButton>
      </div>
    </div>
  );
}