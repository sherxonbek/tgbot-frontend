import { useEffect, useState } from 'react';
import { fetchUser } from '../services/api';

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
