// ── Ovoz + Haptic (tebranish) effektlar ─────────────────────────────────────
// Ovoz: Web Audio API orqali faylsiz generatsiya qilinadi (0 KB, tez).
// Haptic: Telegram WebApp HapticFeedback native API (faqat Telegram ichida ishlaydi).

const STORAGE_KEY = 'sfx_enabled';

export function isSfxEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== '0';
  } catch {
    return true;
  }
}

export function setSfxEnabled(v) {
  try {
    localStorage.setItem(STORAGE_KEY, v ? '1' : '0');
  } catch {
    /* ignore */
  }
}

let audioCtx = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

// Bitta ton — chastota, davomiylik, tip, ovoz balandligi, kechikish, slide
function tone({ freq = 880, duration = 0.06, type = 'sine', volume = 0.04, delay = 0, slideTo = null }) {
  if (!isSfxEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;

  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);

  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.06);
}

// Telegram HapticFeedback — brauzerda bemalol no-op
function haptic(method, arg) {
  try {
    const hf = window.Telegram?.WebApp?.HapticFeedback;
    if (!hf) return;
    if (arg !== undefined) hf[method](arg);
    else hf[method]();
  } catch {
    /* ignore */
  }
}

export const sfx = {
  // AudioContext ni user gesture ichida tayyorlash (autoplay blocklashni oldini oladi)
  warm() {
    if (isSfxEnabled()) getCtx();
  },

  // Har soniyadagi yumshoq "tik"
  tick() {
    tone({ freq: 740, duration: 0.04, type: 'sine', volume: 0.025 });
    haptic('selectionChanged');
  },

  // Oxirgi 20% da yuqoriroq, shoshilinch tik
  tickUrgent() {
    tone({ freq: 1180, duration: 0.05, type: 'triangle', volume: 0.03 });
    haptic('selectionChanged');
  },

  // Juft topilganda — yoqimli muvaffaqiyat akkordi
  match() {
    tone({ freq: 659.25, duration: 0.12, type: 'sine', volume: 0.05 }); // E5
    tone({ freq: 880.0, duration: 0.14, type: 'sine', volume: 0.05, delay: 0.09 }); // A5
    tone({ freq: 1318.5, duration: 0.2, type: 'sine', volume: 0.04, delay: 0.18 }); // E6
    haptic('notificationOccurred', 'success');
  },

  // Vaqt tugaganda — pastga tushuvchi tinch ohang
  timeout() {
    tone({ freq: 520, duration: 0.14, type: 'triangle', volume: 0.045 });
    tone({ freq: 392, duration: 0.22, type: 'triangle', volume: 0.04, delay: 0.13 });
    haptic('notificationOccurred', 'error');
  },

  // Bekor qilishda — qisqa, yengil "tup"
  cancel() {
    tone({ freq: 340, duration: 0.06, type: 'sine', volume: 0.03, slideTo: 220 });
    haptic('impactOccurred', 'light');
  },
};

export default sfx;
