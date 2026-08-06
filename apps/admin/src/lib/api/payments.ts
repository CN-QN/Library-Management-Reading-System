import { apiClient } from "@/lib/api-client";
export interface PaymentOrder { orderCode: string; userId?: string; bookId: string; bookTitle: string; amount: number; status: string; createdAt?: string; paidAt?: string | null; }
export interface RevenueSummary { totalRevenue: number; todayRevenue: number; successOrdersCount: number; pendingOrdersCount: number; totalOrdersCount: number; }
export const paymentsApi = { orders: () => apiClient.get<PaymentOrder[]>("/api/admin/payments/orders"), revenue: () => apiClient.get<RevenueSummary>("/api/admin/payments/revenue-summary") };
