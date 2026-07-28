import { Fragment, useState } from 'react';
import { BackIcon, ChevronRight, StarIcon, SupportIcon } from '../assets/icon';
import { PlanBadge } from '../components/PlanBadge';
import { IconButton } from '../components/IconButton';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';

const sectionStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
};

const backButtonStyle = {
  width: 36,
  height: 36,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.7)',
  cursor: 'pointer',
  flexShrink: 0,
};

const settingsRows = [
  {
    icon: <StarIcon />,
    label: "Obuna bo'lish",
    sub: "Obuna bo'lish orqali cheklovlarni olib tashlang",
    accent: true,
  },
  {
    icon: <SupportIcon />,
    label: "Xizmat ko'rsatish",
    sub: "Xatoliklar, takliflar yoki yordam uchun murojaat qiling",
  },
];

export function SettingsRow({ icon, label, sub, accent, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
      style={{
        background: hover ? 'rgba(124,90,240,0.1)' : 'transparent',
        cursor: 'pointer',
        border: 'none',
      }}
    >
      <span
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{
          width: 38,
          height: 38,
          background: accent ? 'rgba(245,158,11,0.15)' : 'rgba(124,90,240,0.15)',
          color: accent ? '#f59e0b' : '#a78bfa',
        }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: accent ? '#fcd34d' : '#f0effc' }}>
          {label}
        </div>
        {sub && (
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
            {sub}
          </div>
        )}
      </div>
      <ChevronRight />
    </button>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const user = useCurrentUser();

  return (
    <div className="slide-in-right flex flex-col" style={{ minHeight: '100dvh' }}>
      <header className="flex items-center gap-3 px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <IconButton onClick={() => navigate('/')} className="rounded-xl" style={backButtonStyle} aria-label="Go back">
          <BackIcon />
        </IconButton>
        <span className="text-sm font-semibold" style={{ color: '#f0effc' }}>
          Sozlamalar
        </span>
      </header>

      <div className="mx-4 mt-5 mb-2 rounded-2xl flex flex-col items-center py-6 px-4" style={sectionStyle}>
        <div className="relative">
          <img
            src={user?.avatar}
            alt={user?.name}
            className="rounded-full object-cover"
            style={{
              width: 76,
              height: 76,
              border: '2.5px solid rgba(124,90,240,0.65)',
              boxShadow: '0 0 20px rgba(124,90,240,0.35)',
            }}
          />
          {user?.plan === 'VIP' && (
            <div
              className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full"
              style={{
                width: 22,
                height: 22,
                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                boxShadow: '0 0 8px rgba(245,158,11,0.5)',
              }}
            >
              <StarIcon />
            </div>
          )}
        </div>

        <div className="mt-3 text-base font-semibold" style={{ color: '#f0effc' }}>
          {user?.name}
        </div>
        <div className="text-xs mt-0.5 mb-3" style={{ color: 'rgba(255,255,255,0.38)' }}>
          {user?.username}
        </div>
        <PlanBadge plan={user?.plan} />
      </div>

      <div className="mx-4 mt-4 rounded-2xl overflow-hidden" style={sectionStyle}>
        {settingsRows.map((row, index) => (
          <Fragment key={row.label}>
            {index > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 16px' }} />}
            <SettingsRow icon={row.icon} label={row.label} sub={row.sub} accent={row.accent} onClick={() => {}} />
          </Fragment>
        ))}
      </div>

      <div className="mt-auto pb-8 text-center text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
        v1.0.0 · Telegram Web App
      </div>
    </div>
  );
}
