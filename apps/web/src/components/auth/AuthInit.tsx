'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

import { useReaderPresence } from '@/hooks/useReaderPresence';

export default function AuthInit({ children }: { children: React.ReactNode }) {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useReaderPresence(isAuthenticated);

  useEffect(() => {
    // Check auth on initial app load
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}
