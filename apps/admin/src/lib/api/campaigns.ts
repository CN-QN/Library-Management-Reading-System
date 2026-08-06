import { apiClient } from "@/lib/api-client";
export interface EmailCampaign { id: string; subject: string; body: string; campaignType: string; status: string; recipientCount: number; sentCount: number; failedCount: number; createdAt: string; sentAt?: string | null; }
export const campaignsApi = {
  list: () => apiClient.get<EmailCampaign[]>("/api/admin/email-campaigns"),
  create: (input: { subject: string; body: string; campaignType: string }) => apiClient.post<EmailCampaign>("/api/admin/email-campaigns", input),
  send: (id: string) => apiClient.post<EmailCampaign>(`/api/admin/email-campaigns/${id}/send`),
};
