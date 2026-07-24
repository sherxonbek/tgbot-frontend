const API_URL = 'https://tgbot-backend-r3ei.onrender.com/api/users';

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

export async function fetchUser() {
  const tgId = await resolveTelegramId();

  if (!tgId) {
    console.error('Telegram ID topilmadi. Ilovani Telegram WebApp ichida oching.');
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/${tgId}`);
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
    const response = await fetch(`${API_URL}/${tgId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return await response.json();
  } catch (error) {
    console.error('Statusni yangilashda xatolik:', error);
  }
}