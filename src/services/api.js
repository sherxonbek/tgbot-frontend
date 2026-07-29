const API_BASE = import.meta.env.VITE_API_URL || 'https://tgbot-backend-r3ei.onrender.com';
const API_URL = `${API_BASE}/api/users`;
const AUTH_URL = `${API_BASE}/api/auth/telegram`;

const getTelegramInitData = () => {
  return window.Telegram?.WebApp?.initData || '';
};

export const getTelegramId = () => {
  const unsafeUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  if (unsafeUserId) {
    return unsafeUserId.toString();
  }

  return new URLSearchParams(window.location.search).get('tg_id');
};

const resolveTelegramId = async (attempts = 15, intervalMs = 120) => {
  for (let i = 0; i < attempts; i += 1) {
    const tgId = getTelegramId();
    if (tgId) {
      return tgId;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return null;
};

/**
 * Serverga bir marta ping yuboradi (indication uchun).
 * Agar server ishlamasa, tezda false qaytaradi.
 */
export async function pingServer() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(`${API_BASE}/`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Authenticates the user via Telegram initData.
 * Sets an httpOnly cookie on the server side.
 * Must be called before any other API calls.
 */
export async function authenticateWithTelegram() {
  const initData = getTelegramInitData();

  if (!initData) {
    console.error('Telegram initData topilmadi. Ilovani Telegram WebApp ichida oching.');
    return null;
  }

  try {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Cookie ni yuborish va qabul qilish
      body: JSON.stringify({ initData }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Telegram autentifikatsiya xatoligi:', error);
    return null;
  }
}

export async function fetchCurrentUser() {
  const initData = getTelegramInitData();

  if (!initData) {
    console.error('Telegram initData topilmadi. Ilovani Telegram WebApp ichida oching.');
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}/api/users/me`, {
      credentials: 'include',
      headers: {
        'x-telegram-init-data': initData,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Foydalanuvchini olishda xatolik:", error);
    return null;
  }
}

// Nisbiy URL'larni to'liq URL ga aylantirish (frontend != backend domain)
export function resolveAvatarUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_BASE}${url}`;
  return url;
}

export async function updateUserProfile(tgId, data) {
  try {
    const initData = getTelegramInitData();
    const response = await fetch(`${API_URL}/${tgId}/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-init-data': initData,
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Profilni yangilashda xatolik');
    }
    return await response.json();
  } catch (error) {
    console.error('Profilni yangilashda xatolik:', error);
    throw error;
  }
}

export async function uploadImage(file) {
  const initData = getTelegramInitData();
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`${API_BASE}/api/upload/image`, {
      method: 'POST',
      headers: {
        'x-telegram-init-data': initData,
      },
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Rasm yuklashda xatolik');
    }
    return await response.json();
  } catch (error) {
    console.error('Rasm yuklashda xatolik:', error);
    throw error;
  }
}

// ─── Admin API ─────────────────────────────────────────────────────────────

export async function fetchAdminStats() {
  const initData = getTelegramInitData();
  const response = await fetch(`${API_BASE}/api/admin/stats`, {
    headers: { 'x-telegram-init-data': initData },
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Statistikani olishda xatolik');
  return response.json();
}

export async function fetchAdminUsers({ search, plan, gender, region, page } = {}) {
  const initData = getTelegramInitData();
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (plan) params.set('plan', plan);
  if (gender) params.set('gender', gender);
  if (region) params.set('region', region);
  if (page) params.set('page', page);

  const response = await fetch(`${API_BASE}/api/admin/users?${params}`, {
    headers: { 'x-telegram-init-data': initData },
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Foydalanuvchilarni olishda xatolik');
  return response.json();
}

export async function updateUserPlan(tgId, plan) {
  const initData = getTelegramInitData();
  const response = await fetch(`${API_BASE}/api/admin/users/${tgId}/plan`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData },
    credentials: 'include',
    body: JSON.stringify({ plan }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Planni o\'zgartirishda xatolik');
  }
  return response.json();
}

export async function deleteUser(tgId) {
  const initData = getTelegramInitData();
  const response = await fetch(`${API_BASE}/api/admin/users/${tgId}`, {
    method: 'DELETE',
    headers: { 'x-telegram-init-data': initData },
    credentials: 'include',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Foydalanuvchini o\'chirishda xatolik');
  }
  return response.json();
}

export async function fetchAdminReports({ status, page } = {}) {
  const initData = getTelegramInitData();
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (page) params.set('page', page);

  const response = await fetch(`${API_BASE}/api/admin/reports?${params}`, {
    headers: { 'x-telegram-init-data': initData },
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Shikoyatlarni olishda xatolik');
  return response.json();
}

export async function reviewReport(reportId, data) {
  const initData = getTelegramInitData();
  const response = await fetch(`${API_BASE}/api/reports/admin/${reportId}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Shikoyatni ko\'rib chiqishda xatolik');
  }
  return response.json();
}

export async function sendBroadcast(message, filter = {}) {
  const initData = getTelegramInitData();
  const response = await fetch(`${API_BASE}/api/admin/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData },
    credentials: 'include',
    body: JSON.stringify({ message, filter }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Broadcast yuborishda xatolik');
  }
  return response.json();
}

// ─── Notifications API ─────────────────────────────────────────────────────

export async function fetchNotifications(page = 1) {
  const initData = getTelegramInitData();
  const response = await fetch(`${API_BASE}/api/notifications?page=${page}`, {
    headers: { 'x-telegram-init-data': initData },
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Bildirishnomalarni olishda xatolik');
  return response.json();
}

export async function markNotificationsRead() {
  const initData = getTelegramInitData();
  const response = await fetch(`${API_BASE}/api/notifications/read-all`, {
    method: 'PATCH',
    headers: { 'x-telegram-init-data': initData },
    credentials: 'include',
  });
  return response.json();
}

export async function markNotificationRead(id) {
  const initData = getTelegramInitData();
  const response = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
    method: 'PATCH',
    headers: { 'x-telegram-init-data': initData },
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Bildirishnomani o\'qilgan deb belgilashda xatolik');
  return response.json();
}

export async function fetchUnreadCount() {
  const initData = getTelegramInitData();
  const response = await fetch(`${API_BASE}/api/notifications/unread-count`, {
    headers: { 'x-telegram-init-data': initData },
    credentials: 'include',
  });
  if (!response.ok) return { count: 0 };
  return response.json();
}

export async function updateUserStatus(tgId, status) {
  try {
    const initData = getTelegramInitData();
    const response = await fetch(`${API_URL}/${tgId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-init-data': initData,
      },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    return await response.json();
  } catch (error) {
    console.error('Statusni yangilashda xatolik:', error);
  }
}
