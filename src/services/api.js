const API_URL = 'https://tgbot-backend-r3ei.onrender.com/api/users';

// Telegramdan kelgan ID (test uchun URL'dan tg_id berish mumkin)
export const getTelegramId = () => {
  // Telegram WebApp bor-yo'qligini va ichidagi ma'lumotlarni tekshiramiz
  const webApp = window.Telegram?.WebApp;
  console.log("Telegram WebApp obyekti:", webApp);
  console.log("initDataUnsafe:", webApp?.initDataUnsafe);

  const unsafeUserId = webApp?.initDataUnsafe?.user?.id;
  if (unsafeUserId) {
    return unsafeUserId.toString();
  }

  // URL dan debug uchun o'qish
  const debugId = new URLSearchParams(window.location.search).get('tg_id');
  if (debugId) {
    return debugId;
  }

  return null;
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
  const tg_id = await resolveTelegramId();

  if (!tg_id) {
    console.error("Telegram ID topilmadi. Ilovani Telegram WebApp ichida oching.");
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/${tg_id}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    console.log(data);
    
    return data;
  } catch (error) {
    console.error("Foydalanuvchini olishda xatolik:", error);
    return null;
  }
}