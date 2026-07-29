import axios from 'axios';

// Base API URL
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create an Axios instance with credentials enabled to send HttpOnly cookies
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop if the refresh token endpoint itself fails
      if (originalRequest.url.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      
      try {
        // Attempt to refresh the token using HttpOnly cookie (no payload needed)
        await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        
        // If successful, retry the original request
        // The new token is set in the HttpOnly cookie by the backend response
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, user needs to login again
        // Here we could trigger a logout event or redirect to /login
        if (typeof window !== 'undefined') {
          // Fire custom event to let auth store know session expired
          window.dispatchEvent(new Event('session-expired'));
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
