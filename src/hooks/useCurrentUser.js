import { useUser } from '../context/UserContext';

/**
 * @deprecated Use useUser() from context/UserContext instead.
 * Returns the user object (or null if loading).
 */
export function useCurrentUser() {
  const { user } = useUser();
  return user;
}
