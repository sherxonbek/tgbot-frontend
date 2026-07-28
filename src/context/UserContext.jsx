import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authenticateWithTelegram, fetchCurrentUser } from '../services/api';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const data = await fetchCurrentUser();
    if (data) setUser(data);
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const authResult = await authenticateWithTelegram();
        if (!authResult || cancelled) {
          if (!cancelled) setLoading(false);
          return;
        }
        const data = await fetchCurrentUser();
        if (!cancelled) {
          setUser(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('User init error:', error);
        if (!cancelled) setLoading(false);
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
