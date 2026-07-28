import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authenticateWithTelegram, fetchCurrentUser } from '../services/api';

const CACHE_KEY = 'cached_user_data';
const UserContext = createContext(null);

// LocalStorage dan userni o'qish
function loadCachedUser() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      // 1 soatdan eski bo'lsa, cached ni o'chirib tashlaymiz
      if (data._cachedAt && Date.now() - data._cachedAt < 3600000) {
        return data;
      }
      localStorage.removeItem(CACHE_KEY);
    }
  } catch {
    localStorage.removeItem(CACHE_KEY);
  }
  return null;
}

// Userni localStorage ga saqlash
function cacheUser(data) {
  if (!data) return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      ...data,
      _cachedAt: Date.now(),
    }));
  } catch {
    // localStorage to'la bo'lsa, eski cache ni o'chirib qayta yozamiz
    localStorage.removeItem(CACHE_KEY);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        ...data,
        _cachedAt: Date.now(),
      }));
    } catch {}
  }
}

export function UserProvider({ children }) {
  // Avval cached ma'lumotni yuklaymiz (agar bo'lsa)
  const [user, setUser] = useState(() => loadCachedUser());
  const [loading, setLoading] = useState(!user); // Cache bo'lsa loading=false

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
        const authResult = await authenticateWithTelegram();
        if (cancelled) return;

        if (!authResult) {
          // Auth xatoligi — cached user bo'lsa, uni ishlatishda davom etamiz
          // Agar cached user bo'lmasa, loading ni to'xtatamiz
          setLoading(false);
          return;
        }

        // User ma'lumotini serverdan olish
        const data = await fetchCurrentUser();
        if (cancelled) return;

        if (data) {
          setUser(data);
          cacheUser(data);
          setLoading(false);
        } else {
          // Serverda user topilmasa, cached user bo'lsa uni o'chirib tashlaymiz
          localStorage.removeItem(CACHE_KEY);
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('User init error:', error);
        if (!cancelled) {
          // Xatolik bo'lsa, cached user bilan davom etamiz (agar bo'lsa)
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
