import { useNavigate } from 'react-router-dom';
import { SettingsIcon } from '../assets/icon';
import Main from '../components/main';
import { Navbar } from '../components/navbar';
import { IconButton } from '../components/IconButton';

const settingsButtonStyle = {
  width: 50,
  height: 50,
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.65)',
  backdropFilter: 'blur(12px)',
  cursor: 'pointer',
  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
};

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="fade-in-up" style={{ height: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <Main />
      </div>

      <div style={{ position: 'absolute', bottom: 28, right: 24 }}>
        <IconButton
          onClick={() => navigate('/settings')}
          className="rounded-2xl"
          style={settingsButtonStyle}
          aria-label="Open settings"
        >
          <SettingsIcon />
        </IconButton>
      </div>
    </div>
  );
}