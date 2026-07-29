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

// ── Scanner Heart (soddalashtirilgan — GPU compositor xatoliklarini oldini olish uchun) ──
export function ScannerHeartIcon({ size = 52 }) {
  return (
    <div className="flex items-center justify-center" style={{ width: size * 1.7, height: size * 1.7, position: 'relative' }}>
      {/* Simple glow (no filter:blur — WebView da muammo qiladi) */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 2.4,
          height: size * 2.4,
          background: 'radial-gradient(circle, rgba(124,90,240,0.25) 0%, transparent 70%)',
        }}
      />
      {/* Center heart */}
      <div
        className="flex items-center justify-center rounded-full heartbeat"
        style={{
          width: size * 1.7,
          height: size * 1.7,
          background: 'linear-gradient(135deg, #7c5af0 0%, #5b3fd4 100%)',
          boxShadow: '0 0 20px rgba(124,90,240,0.5)',
          color: '#fff',
        }}
      >
        <HeartLucide size={size * 0.6} fill="currentColor" />
      </div>
    </div>
  );
}
