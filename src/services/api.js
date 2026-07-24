const API_URL = 'https://silliness-tranquil-laxative.ngrok-free.dev/api/users';

// Telegramdan kelgan ID yoki standart test ID
export const getTelegramId = () => {
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe?.user?.id) {
    return window.Telegram.WebApp.initDataUnsafe.user.id.toString();
  }
  return '6473619912'; // Test uchun standart ID
};

export async function fetchUser() {
  const tg_id = getTelegramId();
  try {
    const response = await fetch(`${API_URL}/${tg_id}`);
    const data = await response.json();
    console.log(data);
    
    return data;
  } catch (error) {
    console.error("Foydalanuvchini olishda xatolik:", error);
    return null;
  }
}