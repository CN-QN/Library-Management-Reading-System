import { apiClient } from "@/lib/api-client";
export interface StatCardData { value: number; }
export interface DashboardBook { id: string; title: string; createdAt: string; stats?: { viewCount?: number; readingCount?: number }; }
export interface BorrowingTrendPoint { date: string; borrowCount: number; returnCount: number; }
export interface DashboardSummary { statCards: { totalBooks: StatCardData; totalUsers: StatCardData; activeBorrowings: StatCardData; overdueBorrowings: StatCardData }; trendingBooks: DashboardBook[]; recentBooks: DashboardBook[]; borrowingTrend: BorrowingTrendPoint[]; }
export interface StatusCount { status: string; count: number; }
export interface FineSummary { status: string; count: number; totalAmount: number; }
export interface StatisticsSummary { bookStatusBreakdown: StatusCount[]; userStatusBreakdown: StatusCount[]; borrowingStatusBreakdown: StatusCount[]; fineSummary: FineSummary[]; }
export const reportsApi = { getDashboardSummary: () => apiClient.get<DashboardSummary>("/api/admin/reports/dashboard"), trend: () => apiClient.get<BorrowingTrendPoint[]>("/api/admin/reports/borrowing-trend"), statusBreakdowns: () => apiClient.get<StatisticsSummary>("/api/admin/reports/status-breakdowns") };
export const statisticsApi = { getSummary: reportsApi.statusBreakdowns };
