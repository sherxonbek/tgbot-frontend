const API_URL = 'https://tgbot-backend-r3ei.onrender.com/api/users';

const extractIdFromInitData = (initData) => {
  if (!initData) {
    return null;
  }

  const params = new URLSearchParams(initData);
  const userJson = params.get('user');
  if (!userJson) {
    return null;
  }

  try {
    const user = JSON.parse(userJson);
    return user?.id ? user.id.toString() : null;
  } catch (error) {
    console.error('Telegram initData dagi user JSON noto‘g‘ri:', error);
    return null;
  }
};

// Telegramdan kelgan ID (test uchun URL'dan tg_id berish mumkin)
export const getTelegramId = () => {
  const webApp = window.Telegram?.WebApp;
  const unsafeUserId = webApp?.initDataUnsafe?.user?.id;
  if (unsafeUserId) {
    return unsafeUserId.toString();
  }

  const initDataUserId = extractIdFromInitData(webApp?.initData);
  if (initDataUserId) {
    return initDataUserId;
  }

  const debugId = new URLSearchParams(window.location.search).get('tg_id');
  if (debugId) {
    return debugId;
  }

  return null;
};

export async function fetchUser() {
  const tg_id = getTelegramId();

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