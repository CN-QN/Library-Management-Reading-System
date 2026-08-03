import { create } from 'zustand';
import apiClient from '@/lib/api-client';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  studentCode?: string;
  avatar?: string | null;
  branchId?: string;
  branchName?: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Initially true while checking auth status

  clearAuth: () => {
    set({ user: null, isAuthenticated: false });
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true });
      const response = await apiClient.post('/auth/login', { email, password });
      
      // The API returns an ApiResponse wrapper: { statusCode, message, data: UserProfileDto }
      const userData = response.data.data;
      
      set({ 
        user: userData, 
        isAuthenticated: true,
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      get().clearAuth();
    }
  },

  checkAuth: async () => {
    try {
      // Backend automatically checks the HttpOnly cookie
      const response = await apiClient.get('/auth/profile');
      // The API returns an ApiResponse wrapper: { statusCode, message, data: UserProfileDto }
      const userData = response.data.data;
      
      set({ 
        user: userData, 
        isAuthenticated: true,
        isLoading: false 
      });
    } catch {
      // 401 means not authenticated, so we clear auth
      get().clearAuth();
      set({ isLoading: false });
    }
  }
}));

// Listen for session-expired events from the api-client interceptor
let sessionExpiredRegistered = false;
if (typeof window !== 'undefined' && !sessionExpiredRegistered) {
  sessionExpiredRegistered = true;
  if (process.env.NODE_ENV === 'development') {
    (window as unknown as Record<string, unknown>).__auth_store__ = useAuthStore;
  }
  window.addEventListener('session-expired', () => {
    useAuthStore.getState().clearAuth();
    // Redirect to login page to prevent broken UI
    if (window.location.pathname !== '/login') {
      window.location.href = '/login?reason=session_expired';
    }
  });
}

