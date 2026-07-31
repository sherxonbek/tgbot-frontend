import { useEffect, useState } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   Animated SVG Donut Chart (gender/plan taqsimoti uchun)
   ═══════════════════════════════════════════════════════════════════════════ */

export function DonutChart({ data = [], size = 150, thickness = 16, centerLabel = 'Jami', centerValue }) {
  const [animated, setAnimated] = useState(false);
  const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  let offset = 0;

  return (
    <div className="flex items-center gap-5" style={{ flexWrap: 'wrap' }}>
      {/* SVG donut */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={thickness}
          />
          {data.map((d, i) => {
            const frac = (d.value || 0) / total;
            const dash = frac * circumference;
            const circle = (
              <circle
                key={i}
                cx={size / 2} cy={size / 2} r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeLinecap={animated && dash > 0 ? 'round' : 'butt'}
                strokeDasharray={`${animated ? dash : 0} ${circumference}`}
                strokeDashoffset={-offset}
                style={{ transition: `stroke-dasharray 1s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.12}s` }}
              />
            );
            offset += dash;
            return circle;
          })}
        </svg>
        {/* Center label */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ background: 'radial-gradient(circle, rgba(14,14,26,0.9) 0%, rgba(14,14,26,0.55) 70%)', borderRadius: '50%' }}
        >
          <div className="text-xl font-bold leading-none" style={{ color: '#f0effc' }}>{centerValue ?? total}</div>
          <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{centerLabel}</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 min-w-[130px] space-y-2">
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="rounded-full flex-shrink-0" style={{ width: 9, height: 9, background: d.color, boxShadow: `0 0 8px ${d.color}88` }} />
              <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.65)' }}>{d.label}</span>
              <span className="ml-auto text-xs font-bold" style={{ color: '#f0effc' }}>{d.value}</span>
              <span className="text-[10px] w-9 text-right" style={{ color: 'rgba(255,255,255,0.3)' }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Animated SVG Area Chart (14 kunlik o'sish)
   ═══════════════════════════════════════════════════════════════════════════ */

export function AreaChart({ data = [], height = 130, color = '#a78bfa', gradientId = 'area-grad' }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 150);
    return () => clearTimeout(t);
  }, []);

  if (!data.length) return null;

  const W = 100;
  const H = 100;
  const pad = 6;
  const max = Math.max(...data.map(d => d.count), 1);
  const stepX = (W - pad * 2) / Math.max(data.length - 1, 1);

  const pts = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = H - pad - (d.count / max) * (H - pad * 2);
    return [x, y];
  });

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1][0].toFixed(2)},${H - pad} L${pad},${H - pad} Z`;

  // Peak nuqtasi (o'sish ko'rsatish uchun)
  const peakIdx = pts.reduce((bi, p, i, arr) => (p[1] < arr[bi][1] ? i : bi), 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(g => (
        <line key={g} x1={pad} x2={W - pad} y1={pad + g * (H - pad * 2)} y2={pad + g * (H - pad * 2)} stroke="rgba(255,255,255,0.05)" strokeWidth="0.4" strokeDasharray="1.5 2" />
      ))}

      {/* Area fill */}
      <path
        d={areaPath}
        fill={`url(#${gradientId})`}
        style={{ opacity: animated ? 1 : 0, transition: 'opacity 0.8s ease 0.2s' }}
      />
      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        style={{ strokeDasharray: 1, strokeDashoffset: animated ? 0 : 1, transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />

      {/* Dots */}
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p[0]} cy={p[1]} r={i === peakIdx ? 2.4 : 1.4}
          fill={i === peakIdx ? color : '#0e0e1a'}
          stroke={color}
          strokeWidth="1"
          style={{ opacity: animated ? 1 : 0, transition: `opacity 0.4s ease ${0.4 + i * 0.05}s` }}
        />
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Animated Mini Bar Chart (kunlik aktivlik)
   ═══════════════════════════════════════════════════════════════════════════ */

export function MiniBars({ data = [], color = '#7c5af0', height = 64 }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);

  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => {
        const h = Math.max(8, (d.count / max) * (height - 8));
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.count}`}>
            <div
              className="w-full rounded-full"
              style={{
                height: animated ? h : 0,
                background: `linear-gradient(180deg, ${color}, ${color}66)`,
                boxShadow: `0 0 6px ${color}44`,
                transition: `height 0.7s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.04}s`,
              }}
            />
            {i % 4 === 0 && (
              <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{d.date}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
