import { StarIcon } from '../assets/icon';
import { Shield } from 'lucide-react';

// 🔴 ADMIN-FIX: Admin uchun alohida badge (Free o'rniga) — adminlar ham VIP huquqiga ega
export function PlanBadge({ plan }) {
  if (plan === 'Admin') {
    return (
      <span
        className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full heartbeat"
        style={{
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: '#fff',
          letterSpacing: '0.05em',
          boxShadow: '0 0 12px rgba(239,68,68,0.4)',
        }}
      >
        <Shield size={13} />
        Admin
      </span>
    );
  }
  return plan === 'VIP' ? (
    <span
      className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full heartbeat"
      style={{
        background: 'linear-gradient(135deg, #f59e0b, #f97316)',
        color: '#1a0a00',
        letterSpacing: '0.05em',
        boxShadow: '0 0 12px rgba(245,158,11,0.4)',
      }}
    >
      <StarIcon size={14} />
      VIP
    </span>
  ) : (
    <span
      className="text-xs font-semibold px-3 py-1 rounded-full"
      style={{
        background: 'rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.55)',
        border: '1px solid rgba(255,255,255,0.12)',
        letterSpacing: '0.05em',
      }}
    >
      Free
    </span>
  );
}
