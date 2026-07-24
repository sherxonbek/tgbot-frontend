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

const extractIdFromHash = () => {
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hash);
  const tgWebAppData = hashParams.get('tgWebAppData');
  if (!tgWebAppData) {
    return null;
  }

  const decodedInitData = decodeURIComponent(tgWebAppData);
  return extractIdFromInitData(decodedInitData);
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

  const hashUserId = extractIdFromHash();
  if (hashUserId) {
    return hashUserId;
  }

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