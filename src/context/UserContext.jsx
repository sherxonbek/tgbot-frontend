import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authenticateWithTelegram, fetchCurrentUser, pingServer } from '../services/api';

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
  const [serverStatus, setServerStatus] = useState('waking'); // 'waking' | 'online' | 'offline'

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
        // 0. Avval cached ma'lumot bilan UI ni ochamiz (server kutmaymiz!)
        const cached = loadCachedUser();
        if (cached && !cancelled) {
          setUser(cached);
          setLoading(false);
        }

        // 1. Serverga ping yuboramiz (tezda — 6 sekund timeout)
        const serverOnline = await pingServer();
        if (cancelled) return;

        if (!serverOnline) {
          // Server ishlamayapti — cached user bilan davom etamiz
          setServerStatus('offline');
          if (!cached) setLoading(false);
          return;
        }

        setServerStatus('online');

        // 2. Serverga auth so'rov yuboramiz
        const authResult = await authenticateWithTelegram();
        if (cancelled) return;

        if (!authResult) {
          if (!cached && !cancelled) {
            setLoading(false);
          }
          return;
        }

        // 3. Foydalanuvchi ma'lumotini serverdan olamiz
        const data = await fetchCurrentUser();
        if (cancelled) return;

        if (data) {
          setUser(data);
          cacheUser(data);
          setLoading(false);
        } else if (!cached && !cancelled) {
          setLoading(false);
        }
      } catch (error) {
        console.error('User init error:', error);
        if (!cancelled) {
          const cached = loadCachedUser();
          if (!cached) setLoading(false);
        }
      }
    };

    init();
    return () => { cancelled = true; };
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser, serverStatus }}>
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
