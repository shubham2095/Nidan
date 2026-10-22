import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SESSION_EXPIRED_EVENT } from '../services/api.js';
import * as authService from '../services/authService.js';

const AuthContext = createContext(null);

/** Holds the signed-in staff member for the admin area. `user` is undefined while the first check runs, null when signed out. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    let active = true;
    authService
      .getMe()
      .then((me) => active && setUser(me))
      .catch(() => active && setUser(null));

    // Any API call that comes back 401 means the session ended.
    const onExpired = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => {
      active = false;
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
    };
  }, []);

  const signIn = useCallback(async (credentials) => {
    const me = await authService.login(credentials);
    setUser(me);
    return me;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export const ROLE_LABELS = { super_admin: 'Super admin', doctor: 'Doctor', receptionist: 'Reception' };
