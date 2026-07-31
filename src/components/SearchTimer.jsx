import { useEffect, useId, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sfx, isSfxEnabled, setSfxEnabled } from '../utils/sfx';

// Qidiruv davomida necha soniya o'tganini chiroyli aylanma progress bilan ko'rsatadi.
// elapsed — o'tgan soniya, total — umumiy vaqt (timeout).
export function SearchTimer({ elapsed = 0, total = 60 }) {
  const rawId = useId();
  const gradId = `st-grad-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const fraction = Math.min(elapsed / total, 1);
  const urgent = fraction >= 0.8; // oxirgi 20% — amber rangga o'tadi
  const R = 54;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - fraction);
  const color = urgent ? '#fbbf24' : '#a78bfa';
  const [muted, setMuted] = useState(() => !isSfxEnabled());

  // Har soniyada yumshoq tik ovoz + haptic
  useEffect(() => {
    if (elapsed <= 0) return;
    if (urgent) sfx.tickUrgent();
    else sfx.tick();
  }, [elapsed, urgent]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setSfxEnabled(!next);
    // Ovoz yoqilganda AudioContext ni user gesture ichida tayyorlaymiz
    if (!next) sfx.warm();
  };

  return (
    <div className="flex flex-col items-center animate-bounce-in">
      <div className="relative" style={{ width: 146, height: 146 }}>
        {/* Aylanayotgan dashed outer ring */}
        <div
          className="absolute rounded-full"
          style={{
            inset: -9,
            border: '1.5px dashed rgba(167,139,250,0.16)',
            animation: 'spin-slow 18s linear infinite',
          }}
        />

        {/* Ovoz yoqish / o'chirish */}
        <button
          onClick={toggleMute}
          className="absolute flex items-center justify-center rounded-full transition-all z-10"
          style={{
            top: -14,
            left: -14,
            width: 30,
            height: 30,
            background: muted ? 'rgba(255,255,255,0.07)' : 'rgba(124,90,240,0.18)',
            border: `1px solid ${muted ? 'rgba(255,255,255,0.1)' : 'rgba(124,90,240,0.35)'}`,
            color: muted ? 'rgba(255,255,255,0.4)' : '#a78bfa',
            cursor: 'pointer',
            boxShadow: muted ? 'none' : '0 0 12px rgba(124,90,240,0.25)',
            backdropFilter: 'blur(10px)',
          }}
          aria-label={muted ? 'Ovozni yoqish' : 'Ovozni o\'chirish'}
        >
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        <svg width="146" height="146" viewBox="0 0 146 146" style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={urgent ? '#fbbf24' : '#ddd6fe'} />
              <stop offset="100%" stopColor={urgent ? '#f97316' : '#7c5af0'} />
            </linearGradient>
          </defs>

          {/* Track */}
          <circle cx="73" cy="73" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />

          {/* Progress ring — har soniyada silliq to'ldiriladi */}
          <circle
            cx="73" cy="73" r={R}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1s linear',
              filter: `drop-shadow(0 0 ${urgent ? '11px' : '7px'} ${urgent ? 'rgba(251,191,36,0.55)' : 'rgba(167,139,250,0.4)'})`,
            }}
          />
        </svg>

        {/* Markaz — soniya hisoblagich */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold"
            style={{
              fontSize: 36,
              lineHeight: 1,
              color: urgent ? '#fcd34d' : '#f0effc',
              fontVariantNumeric: 'tabular-nums',
              transition: 'color 0.5s ease',
            }}
          >
            {Math.floor(elapsed)}
          </span>
          <span className="text-2xs mt-1 font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
            soniya
          </span>
        </div>

        {/* Yuqori o'ng burchakda pulsatsiyalanuvchi nuqta */}
        <span
          className="absolute rounded-full"
          style={{
            top: 7,
            right: 12,
            width: 9,
            height: 9,
            background: color,
            boxShadow: `0 0 12px ${color}`,
            animation: 'heartbeat 1.6s ease-in-out infinite',
            transition: 'background 0.5s ease',
          }}
        />
      </div>

      <p className="mt-3 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {urgent ? 'Tez orada juft topiladi…' : 'Juft qidirilmoqda…'}
      </p>
    </div>
  );
}

export default SearchTimer;
