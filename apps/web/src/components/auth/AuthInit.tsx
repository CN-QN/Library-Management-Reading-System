'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

export default function AuthInit({ children }: { children: React.ReactNode }) {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Check auth on initial app load
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}
