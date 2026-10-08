import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { fetchMe, login as apiLogin, registerAccount, setAuthToken } from './api';
import { User } from './types';

const TOKEN_KEY = 'climax.auth.token';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, fullName: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistToken(token: string): Promise<void> {
  setAuthToken(token);
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch {
    // storage unavailable (private mode) — session simply won't survive reload
  }
}

async function clearToken(): Promise<void> {
  setAuthToken(null);
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (stored) {
          setAuthToken(stored);
          const me = await fetchMe();
          if (!cancelled) setUser(me);
        }
      } catch {
        await clearToken();
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const response = await apiLogin({ email, password });
    await persistToken(response.access_token);
    setUser(response.user);
    return response.user;
  }, []);

  const register = useCallback(
    async (email: string, password: string, fullName: string): Promise<User> => {
      const response = await registerAccount({ email, password, full_name: fullName });
      await persistToken(response.access_token);
      setUser(response.user);
      return response.user;
    },
    []
  );

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, initializing, login, register, logout }),
    [user, initializing, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
