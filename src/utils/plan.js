// 🔴 ADMIN-FIX: Admin userlar ham VIP imkoniyatlaridan foydalanadi.
// Ilgari adminlar Free sifatida ko'rinardi (plan === 'VIP' tekshiruvlari
// ularni o'tkazib yuborardi). Endi `Admin` ham VIP hisoblanadi.
export function isVip(plan) {
  return plan === 'VIP' || plan === 'Admin';
}
