import { useState, useMemo } from 'react';
import { resolveAvatarUrl } from '../services/api';

// User ism bosh harflarini olish
function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Ism asosida rang yaratish (doim bir xil rang)
const AVATAR_COLORS = [
  'linear-gradient(135deg, #7c5af0, #5b3fd4)',
  'linear-gradient(135deg, #f59e0b, #f97316)',
  'linear-gradient(135deg, #06b6d4, #0891b2)',
  'linear-gradient(135deg, #ec4899, #db2777)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #f43f5e, #e11d48)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #14b8a6, #0d9488)',
];

function getColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * UserAvatar — DEFAULT_AVATAR o'rniga ishlatiladi.
 * Rasm yuklanmaguncha ism bosh harflarini ko'rsatadi.
 * Rasm yuklangandan keyin rasmni ko'rsatadi.
 * Hech qachon random default rasm ishlatmaydi.
 */
export function UserAvatar({
  name,
  avatar,
  size = 38,
  border = true,
  className = '',
  ...props
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const initials = useMemo(() => getInitials(name), [name]);
  const gradient = useMemo(() => getColor(name), [name]);
  const imgSrc = resolveAvatarUrl(avatar);

  // Rasm yuklanganmi va xato yo'qmi?
  const showImage = imgSrc && imgLoaded && !imgError;

  return (
    <div
      className={`relative flex items-center justify-center rounded-full flex-shrink-0 overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        border: border ? '2px solid rgba(124,90,240,0.6)' : 'none',
        boxShadow: border ? '0 0 8px rgba(124,90,240,0.25)' : 'none',
        background: showImage ? 'none' : gradient,
        transition: 'all 0.3s ease',
      }}
      {...props}
    >
      {/* Initials (default) */}
      {!showImage && (
        <span
          className="font-semibold select-none"
          style={{
            color: '#fff',
            fontSize: size * 0.38,
            lineHeight: 1,
          }}
        >
          {initials}
        </span>
      )}

      {/* Real image (after load) */}
      {imgSrc && (
        <img
          src={imgSrc}
          alt={name || 'Avatar'}
          onLoad={() => {
            setImgLoaded(true);
            setImgError(false);
          }}
          onError={() => {
            setImgError(true);
            setImgLoaded(false);
          }}
          className="absolute inset-0 w-full h-full rounded-full object-cover"
          style={{
            opacity: showImage ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      {/* Loading shimmer (while image is loading) */}
      {imgSrc && !imgLoaded && !imgError && (
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            background: 'rgba(255,255,255,0.08)',
          }}
        />
      )}
    </div>
  );
}

export default UserAvatar;
