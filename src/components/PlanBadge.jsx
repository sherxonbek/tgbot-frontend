import { StarIcon } from "../assets/icon";

// ── plan badge ───────────────────────────────────────────────────────────────
export function PlanBadge({ plan }) {
    return plan === 'VIP' ? (
        <span
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full"
            style={{
                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                color: '#1a0a00',
                letterSpacing: '0.05em',
                boxShadow: '0 0 12px rgba(245,158,11,0.4)',
            }}
        >
            <StarIcon />
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
    )
}