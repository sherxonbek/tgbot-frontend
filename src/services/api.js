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
