import { useEffect, useState } from 'react';
import { fetchUser } from '../services/api';

const API_URL = 'https://tgbot-backend-r3ei.onrender.com/api/users';

export function useCurrentUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      const data = await fetchUser();
      if (!cancelled) {
        setUser(data);
      }
    };

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  return user;
}

export function useActiveUsers() {
  const [activeUsers, setActiveUsers] = useState([]);
  const currentUser = useCurrentUser();

  useEffect(() => {
    let cancelled = false;

    const loadActiveUsers = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Xatolik');
        const data = await response.json();

        const usersList = Array.isArray(data) ? data : data.users || [];

        if (!cancelled) {
          // Statusi true bo'lgan va o'zimizdan boshqalarni filter qilamiz
          const filtered = usersList.filter(
            (user) => user.status === true && (user.telegram_id || user.tg_id) !== (currentUser?.telegram_id || currentUser?.tg_id)
          );
          setActiveUsers(filtered);
        }
      } catch (error) {
        console.error('Foydalanuvchilarni olishda xatolik:', error);
      }
    };

    if (currentUser) {
      loadActiveUsers();
    }

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  return activeUsers;
}