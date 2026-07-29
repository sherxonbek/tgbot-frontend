// ─── Lucide-React Icons ─────────────────────────────────────────────────────
// Barcha iconlar lucide-react dan olingan va animatsiyali variantlari qo'shilgan
// Eski nomlar bilan moslik uchun aliaslar saqlangan

export {
  Settings as SettingsIcon,
  MessageCircle as SupportIcon,
  Star as StarIcon,
  ArrowLeft as BackIcon,
  ChevronRight,
  Heart as HeartIcon,
  Send as SendIcon,
  SkipForward as SkipIcon,
  Flag as FlagIcon,
  Image as ImageIcon,
  Bell as BellIcon,
  Check as CheckIcon,
} from 'lucide-react';

// ═════════════════════════════════════════════════════════════════════════════
// ANIMATED ICONS
// ═════════════════════════════════════════════════════════════════════════════

import { Heart as HeartLucide, Bell as BellLucide, Send as SendLucide, Check as CheckLucide, Loader as LoaderLucide } from 'lucide-react';

// ── Animated Heart (pulse) ─────────────────────────────────────────────────
export function AnimatedHeart({ size = 52, className = '', ...props }) {
  return (
    <HeartLucide
      size={size}
      className={`heartbeat ${className}`}
      fill="currentColor"
      {...props}
    />
  );
}

// ── Animated Bell (ring/shake) ────────────────────────────────────────────
export function AnimatedBell({ size = 20, className = '', ring = false, ...props }) {
  return (
    <BellLucide
      size={size}
      className={ring ? `animate-bell-ring ${className}` : className}
      {...props}
    />
  );
}

// ── Animated Send (fly/swipe) ────────────────────────────────────────────
export function AnimatedSend({ size = 20, className = '', flying = false, ...props }) {
  return (
    <SendLucide
      size={size}
      className={flying ? `animate-send-fly ${className}` : className}
      {...props}
    />
  );
}

// ── Animated Check (bounce) ──────────────────────────────────────────────
export function AnimatedCheck({ size = 14, className = '', bounce = false, ...props }) {
  return (
    <CheckLucide
      size={size}
      className={bounce ? `animate-bounce-in ${className}` : className}
      {...props}
    />
  );
}

// ── Animated Loading Spinner ─────────────────────────────────────────────
export function AnimatedLoader({ size = 20, className = '', ...props }) {
  return (
    <LoaderLucide
      size={size}
      className={`animate-spin ${className}`}
      {...props}
    />
  );
}

// ── Scanner Heart (matching animatsiyasi uchun maxsus) ──────────────────
export function ScannerHeartIcon({ size = 52 }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size * 1.7, height: size * 1.7 }}>
      {/* Radial glow */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 2.1,
          height: size * 2.1,
          background: 'radial-gradient(circle, rgba(124,90,240,0.35) 0%, transparent 70%)',
        }}
      />
      {/* Scanning rings */}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: size * 2.1,
            height: size * 2.1,
            borderColor: `rgba(167,139,250,${0.6 - i * 0.08})`,
            animation: `scanner-ring 3s ease-out infinite`,
            animationDelay: `${i * 0.75}s`,
          }}
        />
      ))}
      {/* Rotating rings */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 3.8,
          height: size * 3.8,
          border: '1px dashed rgba(124,90,240,0.3)',
          animation: 'spin-slow 12s linear infinite',
        }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: 7,
            height: 7,
            top: -3.5,
            left: '50%',
            marginLeft: -3.5,
            background: '#7c5af0',
            boxShadow: '0 0 8px #7c5af0',
          }}
        />
      </div>
      <div
        className="absolute rounded-full"
        style={{
          width: size * 3,
          height: size * 3,
          border: '1px dashed rgba(167,139,250,0.2)',
          animation: 'spin-reverse 8s linear infinite',
        }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: 5,
            height: 5,
            bottom: -2.5,
            left: '50%',
            marginLeft: -2.5,
            background: '#a78bfa',
            boxShadow: '0 0 6px #a78bfa',
          }}
        />
      </div>
      {/* Tick marks */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            width: 1,
            height: i % 3 === 0 ? 10 : 5,
            background: `rgba(124,90,240,${i % 3 === 0 ? 0.6 : 0.25})`,
            transformOrigin: '50% 110px',
            transform: `rotate(${i * 30}deg) translateY(-100px)`,
          }}
        />
      ))}
      {/* Center heart */}
      <div
        className="relative z-10 flex items-center justify-center rounded-full heartbeat"
        style={{
          width: size * 1.7,
          height: size * 1.7,
          background: 'radial-gradient(135deg, #7c5af0 0%, #5b3fd4 100%)',
          boxShadow: '0 0 32px rgba(124,90,240,0.7), 0 0 64px rgba(124,90,240,0.25)',
          color: '#fff',
        }}
      >
        <HeartLucide size={size * 0.6} fill="currentColor" />
      </div>
    </div>
  );
}
