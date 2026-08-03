import { booksApi, type Book } from "./books";
import { usersApi } from "./users";
import { circulationApi, isBorrowingOverdue, type Borrowing } from "./circulation";
import { searchApi, type SearchBookResult } from "./search";
import { finesApi } from "./fines";

export interface StatCardData {
  value: number;
}

export interface BorrowingTrendPoint {
  date: string;
  borrowCount: number;
  returnCount: number;
}

export interface DashboardSummary {
  statCards: {
    totalBooks: StatCardData;
    totalUsers: StatCardData;
    activeBorrowings: StatCardData;
    overdueBorrowings: StatCardData;
  };
  trendingBooks: SearchBookResult[];
  recentBooks: Book[];
  borrowingTrend: BorrowingTrendPoint[];
}

/** Groups a page of borrowings by day (borrowedAt date, returnedAt via items) for a simple trend chart. */
function computeBorrowingTrend(borrowings: Borrowing[]): BorrowingTrendPoint[] {
  const byDate = new Map<string, { borrowCount: number; returnCount: number }>();

  function bump(dateIso: string, key: "borrowCount" | "returnCount") {
    const day = dateIso.slice(0, 10);
    const entry = byDate.get(day) ?? { borrowCount: 0, returnCount: 0 };
    entry[key] += 1;
    byDate.set(day, entry);
  }

  for (const b of borrowings) {
    bump(b.borrowedAt, "borrowCount");
    for (const item of b.items) {
      if (item.returnedAt) bump(item.returnedAt, "returnCount");
    }
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, counts]) => ({ date, ...counts }));
}

/**
 * There is no dedicated Reports/Dashboard module on the backend — this
 * composes real numbers from the Books/Users/Circulation/Search APIs
 * instead of a single endpoint. `borrowingTrend` is computed client-side
 * from the most recent 100 borrowings (a genuine approximation, not
 * mock data, but not a true full-history aggregate — ask the backend
 * team for a proper time-series endpoint if this needs to scale).
 */
export interface StatusCount {
  status: string;
  count: number;
}

export interface FineSummary {
  status: string;
  count: number;
  totalAmount: number;
}

export interface StatisticsSummary {
  bookStatusBreakdown: StatusCount[];
  userStatusBreakdown: StatusCount[];
  borrowingStatusBreakdown: StatusCount[];
  fineSummary: FineSummary[];
}

const BOOK_STATUSES = ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"];
const USER_STATUSES = ["ACTIVE", "LOCKED", "SUSPENDED", "PENDING"];
const BORROWING_STATUSES = ["OPEN", "PARTIALLY_RETURNED", "RETURNED", "CANCELLED"];
const FINE_STATUSES = ["UNPAID", "PAID", "WAIVED"];

export const statisticsApi = {
  /**
   * Same caveat as the dashboard summary: no dedicated Reports module,
   * so this fires one counting request per status value against the
   * real Books/Users/Circulation/Fines APIs (using `totalItems` from
   * each, not the returned page) and assembles the breakdown here.
   * Fine amounts are summed over up to 100 records per status — exact
   * for typical class-project data volumes, approximate beyond that.
   */
  async getSummary(): Promise<StatisticsSummary> {
    const [bookCounts, userCounts, borrowingCounts, fineSummaries] = await Promise.all([
      Promise.all(
        BOOK_STATUSES.map(async (status) => ({
          status,
          count: (await booksApi.search({ status, page: 1, limit: 1, sortBy: "createdAt", sortOrder: "desc" }))
            .totalItems,
        }))
      ),
      Promise.all(
        USER_STATUSES.map(async (status) => ({
          status,
          count: (await usersApi.search({ status, page: 1, limit: 1 })).totalItems,
        }))
      ),
      Promise.all(
        BORROWING_STATUSES.map(async (status) => ({
          status,
          count: (await circulationApi.search({ status, page: 1, limit: 1 })).totalItems,
        }))
      ),
      Promise.all(
        FINE_STATUSES.map(async (status) => {
          const page = await finesApi.search({ status, page: 1, limit: 100 });
          return {
            status,
            count: page.totalItems,
            totalAmount: page.items.reduce((sum, f) => sum + f.amount, 0),
          };
        })
      ),
    ]);

    return {
      bookStatusBreakdown: bookCounts,
      userStatusBreakdown: userCounts,
      borrowingStatusBreakdown: borrowingCounts,
      fineSummary: fineSummaries,
    };
  },
};

export const reportsApi = {
  async getDashboardSummary(): Promise<DashboardSummary> {
    const [booksPage, usersPage, activeBorrowingsPage, recentBorrowings, trendingBooks, recentBooks] =
      await Promise.all([
        booksApi.search({ page: 1, limit: 1, sortBy: "createdAt", sortOrder: "desc" }),
        usersApi.search({ page: 1, limit: 1 }),
        circulationApi.search({ status: "OPEN", page: 1, limit: 1 }),
        circulationApi.search({ page: 1, limit: 100 }),
        searchApi.getTrending(5),
        booksApi.search({ page: 1, limit: 5, sortBy: "createdAt", sortOrder: "desc" }),
      ]);

    const overdueCount = recentBorrowings.items.filter(isBorrowingOverdue).length;

    return {
      statCards: {
        totalBooks: { value: booksPage.totalItems },
        totalUsers: { value: usersPage.totalItems },
        activeBorrowings: { value: activeBorrowingsPage.totalItems },
        overdueBorrowings: { value: overdueCount },
      },
      trendingBooks,
      recentBooks: recentBooks.items,
      borrowingTrend: computeBorrowingTrend(recentBorrowings.items),
    };
  },
};
