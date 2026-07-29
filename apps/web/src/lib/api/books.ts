import { API_URL } from '../api-client';

export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
  description?: string;
  categoryIds?: string[];
  status?: string;
  createdAt?: string;
}

export async function getTrendingBooks(limit: number = 10): Promise<Book[]> {
  const res = await fetch(`${API_URL}/Books/trending?limit=${limit}`, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });
  if (!res.ok) throw new Error('Failed to fetch trending books');
  const data = await res.json();
  return data.data || data;
}

export async function getNewReleases(limit: number = 10): Promise<Book[]> {
  const res = await fetch(`${API_URL}/Books/new-releases?limit=${limit}`, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });
  if (!res.ok) throw new Error('Failed to fetch new releases');
  const data = await res.json();
  return data.data || data;
}
