/**
 * Cloudinary Direct Upload
 * 
 * Frontenddan to'g'ridan-to'g'ri Cloudinary CDN ga yuklash.
 * Serverga faqat URL yuboriladi (backend proxy <1000ms → <25ms).
 * 
 * ⚠️ Cloudinary dashboard da unsigned upload preset yaratish kerak:
 *    Settings → Upload → Add upload preset → Signing Mode: Unsigned
 *    Keyingi preset nomini VITE_CLOUDINARY_UPLOAD_PRESET ga yozing
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'o3leifwg';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}`;

// 🔴 17-FIX: unsigned upload preset env'da sozlanmagan bo'lsa darhol ogohlantiramiz.
// `ml_default` ishlamaydi — Cloudinary dashboard'da unsigned preset yaratish kerak:
// Settings → Upload → Add upload preset → Signing Mode: Unsigned.
// .env.example ga qarang. Aks holda upload 'Unauthorized' xatosi bilan yiqiladi.
if (!import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) {
  console.warn('⚠️ VITE_CLOUDINARY_UPLOAD_PRESET sozlanmagan — default "ml_default" ishlatilmoqda. Rasm/audio yuklash ishlamay qolishi mumkin. Cloudinary dashboard: Settings → Upload → Unsigned preset yarating va uni .env ga yozing.');
}

const ALLOWED_IMAGES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_AUDIO = ['audio/webm', 'audio/ogg', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/mp4'];

async function uploadToCloudinary(endpoint, data, timeout = 30000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(`${CLOUDINARY_URL}/${endpoint}/upload`, {
      method: 'POST', body: data, signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`Upload ${res.status}`);
    return (await res.json()).secure_url;
  } finally { clearTimeout(timer); }
}

export async function uploadImageDirect(file) {
  if (!ALLOWED_IMAGES.includes(file.type)) throw new Error('Noto\'g\'ri rasm formati (JPEG/PNG/GIF/WebP)');
  const fd = new FormData();
  fd.append('file', file); fd.append('upload_preset', UPLOAD_PRESET); fd.append('folder', 'telegram-webapp');
  return uploadToCloudinary('image', fd);
}

export async function uploadAudioDirect(blob) {
  if (!ALLOWED_AUDIO.includes(blob.type)) throw new Error('Noto\'g\'ri audio format');
  const fd = new FormData();
  fd.append('file', blob, 'voice.webm');
  fd.append('upload_preset', UPLOAD_PRESET); fd.append('folder', 'telegram-webapp'); fd.append('resource_type', 'video');
  return uploadToCloudinary('video', fd);
}
