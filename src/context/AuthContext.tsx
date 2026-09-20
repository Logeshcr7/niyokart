import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, User } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { DbUser, UserStats } from '../types/index.ts';

interface AuthContextType {
  firebaseUser: User | null;
  dbUser: DbUser | null;
  token: string | null;
  stats: UserStats;
  loading: boolean;
  favorites: string[];
  signInWithGoogle: () => Promise<void>;
  signInDemo: (email?: string, name?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  toggleFavorite: (phoneId: string) => Promise<boolean>;
  refreshUserData: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats>({
    savedComparisonsCount: 0,
    favoritesCount: 0,
    customPresetsCount: 0,
  });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sync session with PostgreSQL backend
  const syncWithBackend = async (authToken: string, customEmail?: string, customName?: string) => {
    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      };
      if (customEmail) headers['x-user-email'] = customEmail;
      if (customName) headers['x-user-name'] = customName;

      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers,
      });

      if (!res.ok) {
        throw new Error(`Sync failed with status ${res.status}`);
      }

      const data = await res.json();
      setDbUser(data.user);

      // Also fetch stats and favorites
      await loadUserData(authToken, headers);
    } catch (err: any) {
      console.error('Backend sync error:', err);
      setError(err.message || 'Failed to sync with PostgreSQL backend');
    }
  };

  const loadUserData = async (authToken: string, extraHeaders?: Record<string, string>) => {
    try {
      const headers = {
        'Authorization': `Bearer ${authToken}`,
        ...(extraHeaders || {}),
      };

      const [userRes, favRes] = await Promise.all([
        fetch('/api/user/me', { headers }),
        fetch('/api/favorites', { headers }),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setDbUser(userData.user);
        if (userData.stats) {
          setStats(userData.stats);
        }
      }

      if (favRes.ok) {
        const favData = await favRes.json();
        setFavorites(Array.isArray(favData) ? favData : []);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  const refreshUserData = async () => {
    if (token) {
      await loadUserData(token);
    }
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    // Check if there's a stored demo session
    const savedDemoToken = localStorage.getItem('algo_mobile_demo_token');
    const savedDemoEmail = localStorage.getItem('algo_mobile_demo_email');
    const savedDemoName = localStorage.getItem('algo_mobile_demo_name');

    if (savedDemoToken) {
      setToken(savedDemoToken);
      syncWithBackend(savedDemoToken, savedDemoEmail || undefined, savedDemoName || undefined)
        .finally(() => setLoading(false));
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const idToken = await user.getIdToken();
          setToken(idToken);
          await syncWithBackend(idToken);
        } catch (err: any) {
          console.error('Error getting Firebase token:', err);
          setError('Failed to authenticate token with backend');
        }
      } else {
        setDbUser(null);
        setToken(null);
        setFavorites([]);
        setStats({ savedComparisonsCount: 0, favoritesCount: 0, customPresetsCount: 0 });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      // Clear demo storage if any
      localStorage.removeItem('algo_mobile_demo_token');
      localStorage.removeItem('algo_mobile_demo_email');
      localStorage.removeItem('algo_mobile_demo_name');

      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      setFirebaseUser(result.user);
      await syncWithBackend(idToken);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      // Give a helpful error and offer the demo option if popup was blocked
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        setError('Popup was blocked by the browser. You can also use the 1-Click Instant Demo Login!');
      } else {
        setError(err.message || 'Authentication failed. You may use Demo Login.');
      }
    } finally {
      setLoading(false);
    }
  };

  const signInDemo = async (email?: string, name?: string) => {
    setError(null);
    setLoading(true);
    try {
      const demoId = 'tester_' + Math.random().toString(36).substring(2, 9);
      const demoToken = `demo-token-${demoId}`;
      const demoEmail = email || `user_${demoId}@algomobile.dev`;
      const demoName = name || 'Smartphone Reviewer';

      localStorage.setItem('algo_mobile_demo_token', demoToken);
      localStorage.setItem('algo_mobile_demo_email', demoEmail);
      localStorage.setItem('algo_mobile_demo_name', demoName);

      setToken(demoToken);
      await syncWithBackend(demoToken, demoEmail, demoName);
    } catch (err: any) {
      console.error('Demo sign-in error:', err);
      setError(err.message || 'Failed to sign in with demo credentials');
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('algo_mobile_demo_token');
      localStorage.removeItem('algo_mobile_demo_email');
      localStorage.removeItem('algo_mobile_demo_name');
      if (firebaseUser) {
        await fbSignOut(auth);
      }
      setFirebaseUser(null);
      setDbUser(null);
      setToken(null);
      setFavorites([]);
      setStats({ savedComparisonsCount: 0, favoritesCount: 0, customPresetsCount: 0 });
    } catch (err: any) {
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (phoneId: string): Promise<boolean> => {
    if (!token) {
      setError('Please log in to save favorites to your PostgreSQL account');
      return false;
    }

    try {
      const res = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneId }),
      });

      if (res.ok) {
        const data = await res.json();
        setFavorites((prev) =>
          data.favorited ? [...prev, phoneId] : prev.filter((id) => id !== phoneId)
        );
        setStats((prev) => ({
          ...prev,
          favoritesCount: data.favorited ? prev.favoritesCount + 1 : Math.max(0, prev.favoritesCount - 1),
        }));
        return data.favorited;
      }
      return false;
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        dbUser,
        token,
        stats,
        loading,
        favorites,
        signInWithGoogle,
        signInDemo,
        signOutUser,
        toggleFavorite,
        refreshUserData,
        error,
        clearError: () => setError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
