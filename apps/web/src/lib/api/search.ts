import { API_URL } from '../api-client';

export interface SearchFilterOption {
  value: string | null;
  label: string;
}

export interface SearchCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

export interface SearchFiltersResponse {
  categories: SearchCategory[];
  authors: { id: string; name: string; slug: string }[];
  sortOptions: SearchFilterOption[];
  sortOrders: SearchFilterOption[];
  availabilityOptions: SearchFilterOption[];
  accessTypes: SearchFilterOption[];
  stats: { totalPublished: number };
}

/**
 * Lấy danh sách siêu dữ liệu bộ lọc (categories, authors, sortOptions, v.v.)
 * Phục vụ cho Sidebar Lọc tìm kiếm sách.
 * 
 * Sử dụng ISR cache (revalidate 3600s) để giảm tải request tới Backend do dữ liệu bộ lọc ít thay đổi.
 */
export async function getSearchFilters(): Promise<SearchFiltersResponse | null> {
  try {
    const res = await fetch(`${API_URL}/Search/filters`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? json;
  } catch (error) {
    // Trả về null khi fetch thất bại hoặc lỗi mạng để caller xử lý fallback
    return null;
  }
}
