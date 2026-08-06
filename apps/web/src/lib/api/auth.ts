import apiClient from "@/lib/api-client";
export const authApi = {
  googleConfig: () => apiClient.get("/auth/google/config"),
  google: (credential: string) => apiClient.post("/auth/google", { credential }),
  forgotPassword: (email: string) => apiClient.post("/auth/forgot-password", { email }),
  resetPassword: (email: string, token: string, newPassword: string) => apiClient.post("/auth/reset-password", { email, token, newPassword }),
};
