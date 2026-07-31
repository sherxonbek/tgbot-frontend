# Telegram Chat Frontend (React + Vite)

Telegram WebApp uchun frontend — real-time chat, VIP filtrlar, bildirishnomalar va admin panel.

## Ishga tushirish

```bash
npm install
cp .env.example .env   # o'z qiymatlaringizni yozing
npm run dev            # http://localhost:5173
```

## Muhit o'zgaruvchilari (`.env`)

| O'zgaruvchi | Majburiy | Tavsif |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend API URL (masalan `https://.../api/users`) |
| `VITE_SOCKET_URL` | ✅ | Socket.io server URL |
| `VITE_CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud nomi |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | ✅ | Cloudinary **unsigned** upload preset |

## ☁️ Cloudinary sozlash (majburiy!)

> 🔴 **17-FIX:** Rasm va ovozli xabarlar Cloudinary'ga frontend'dan to'g'ridan-to'g'ri (unsigned upload bilan) yuklanadi. Bu **unsigned upload preset** talab qiladi — `ml_default` yoki bo'sh qiymat bilan upload ishlamaydi (`Unauthorized` xatosi).

Sozlash:

1. [Cloudinary dashboard](https://cloudinary.com) → **Settings** → **Upload** tab
2. **Add upload preset** tugmasini bosing
3. **Signing Mode: Unsigned** ni tanlang (muhim! Signed bo'lsa server maxfiy kaliti kerak bo'ladi)
4. Preset nomini `.env` dagi `VITE_CLOUDINARY_UPLOAD_PRESET` ga yozing
5. Cloud nomingizni `VITE_CLOUDINARY_CLOUD_NAME` ga yozing

Agar preset sozlanmagan bo'lsa, konsolda ogohlantirish chiqadi va foydalanuvchi profil rasmi / media xabarlar yuklab bo'lmaydi.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run preview` — build natijasini ko'rish
