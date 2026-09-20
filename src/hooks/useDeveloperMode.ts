import { useState, useEffect, useCallback } from 'react';

const DEVELOPER_STORAGE_KEY = 'niyo_developer_session_authorized';
const AUTHORIZED_DEVELOPER_EMAIL = 'logesh64646@gmail.com';
const DEVELOPER_PASSCODES = ['admin2026', 'admin', 'logesh', 'developer'];

export function useDeveloperMode(currentUserEmail?: string | null) {
  const [isDeveloper, setIsDeveloper] = useState<boolean>(() => {
    // 1. Check URL query parameters (e.g. ?admin=true or ?dev=1)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get('admin') === 'true' ||
        params.get('admin') === '1' ||
        params.get('dev') === 'true' ||
        params.get('dev') === '1'
      ) {
        sessionStorage.setItem(DEVELOPER_STORAGE_KEY, 'true');
        return true;
      }

      // 2. Check saved session storage
      if (sessionStorage.getItem(DEVELOPER_STORAGE_KEY) === 'true') {
        return true;
      }

      // 3. Check if running on local development host
      if (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('ais-dev-')
      ) {
        return true;
      }
    }
    return false;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync if developer logs in with developer email
  useEffect(() => {
    if (currentUserEmail && currentUserEmail.toLowerCase() === AUTHORIZED_DEVELOPER_EMAIL.toLowerCase()) {
      setIsDeveloper(true);
      sessionStorage.setItem(DEVELOPER_STORAGE_KEY, 'true');
    }
  }, [currentUserEmail]);

  // Global hotkey: Ctrl + Shift + A (or Cmd + Shift + A) to toggle developer access
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        if (isDeveloper) {
          setIsAuthModalOpen(true);
        } else {
          setIsAuthModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDeveloper]);

  const verifyAndEnable = useCallback((inputCode: string): boolean => {
    const cleaned = inputCode.trim().toLowerCase();
    if (
      DEVELOPER_PASSCODES.includes(cleaned) ||
      cleaned === AUTHORIZED_DEVELOPER_EMAIL.toLowerCase()
    ) {
      setIsDeveloper(true);
      sessionStorage.setItem(DEVELOPER_STORAGE_KEY, 'true');
      setIsAuthModalOpen(false);
      return true;
    }
    return false;
  }, []);

  const disableDeveloperMode = useCallback(() => {
    setIsDeveloper(false);
    sessionStorage.removeItem(DEVELOPER_STORAGE_KEY);
    // Remove query params from url without reload
    if (typeof window !== 'undefined' && window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.delete('admin');
      url.searchParams.delete('dev');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, []);

  return {
    isDeveloper,
    isAuthModalOpen,
    setIsAuthModalOpen,
    verifyAndEnable,
    disableDeveloperMode,
  };
}
