import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authenticateWithTelegram, fetchCurrentUser } from '../services/api';

const CACHE_KEY = 'cached_user_data';
const UserContext = createContext(null);

// Userni localStorage ga saqlash
function cacheUser(data) {
  if (!data) return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      ...data,
      _cachedAt: Date.now(),
    }));
  } catch {
    localStorage.removeItem(CACHE_KEY);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        ...data,
        _cachedAt: Date.now(),
      }));
    } catch {}
  }
}

// LocalStorage dan userni o'qish
function loadCachedUser() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      if (data._cachedAt && Date.now() - data._cachedAt < 86400000) { // 24 soat
        return data;
      }
      localStorage.removeItem(CACHE_KEY);
    }
  } catch {
    localStorage.removeItem(CACHE_KEY);
  }
  return null;
}

export function UserProvider({ children }) {
  // loading always starts as TRUE — user to'liq kelguncha hech narsa chizilmaydi
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const data = await fetchCurrentUser();
    if (data) {
      setUser(data);
      cacheUser(data);
    }
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        // 1. Serverga so'rov yuboramiz
        const authResult = await authenticateWithTelegram();
        if (cancelled) return;

        if (!authResult) {
          // 2a. Auth xatosi — cached ma'lumot bormi?
          const cached = loadCachedUser();
          if (!cancelled) {
            setUser(cached);
            setLoading(false);
          }
          return;
        }

        // 3. Foydalanuvchi ma'lumotini serverdan olamiz
        const data = await fetchCurrentUser();
        if (cancelled) return;

        if (data) {
          // 4a. Serverdan to'liq ma'lumot keldi — loading ni o'chiramiz
          setUser(data);
          cacheUser(data);
          setLoading(false);
        } else {
          // 4b. Serverda user topilmadi — cached ma'lumot bormi?
          const cached = loadCachedUser();
          setUser(cached);
          setLoading(false);
        }
      } catch (error) {
        console.error('User init error:', error);
        if (!cancelled) {
          // 5. Xatolik — cached ma'lumot bilan davom etamiz
          const cached = loadCachedUser();
          setUser(cached);
          setLoading(false);
        }
      }
    };

    init();
    return () => { cancelled = true; };
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
