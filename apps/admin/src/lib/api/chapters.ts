import { apiClient } from "@/lib/api-client";

/** Mirrors `LinkDto`. */
export interface ParagraphLink {
  url: string;
  text?: string;
  target: string;
}

/** Mirrors `ParagraphDto` — styling applies to the whole paragraph, not text runs. */
export interface Paragraph {
  id: string;
  text: string;
  style?: string;
  order: number;
  indent: number;
  alignment: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  links?: ParagraphLink[];
}

/** Mirrors `TableDto`. */
export interface ChapterTable {
  id: string;
  caption?: string;
  headers: string[];
  rows: string[][];
  columnWidths?: number[];
}

/** Mirrors `ImageDto`. */
export interface ChapterImage {
  id: string;
  url: string;
  caption?: string;
  altText?: string;
  width?: number;
  height?: number;
  alignment: string;
}

/** Mirrors `FootnoteDto`. */
export interface Footnote {
  id: string;
  reference: string;
  content: string;
}

/**
 * Mirrors `ChapterContent`. Replaces the old free-form `ContentJson`
 * string — the backend now owns a structured document shape instead of
 * accepting arbitrary rich-text-editor output.
 */
export interface ChapterContent {
  introduction?: string;
  paragraphs: Paragraph[];
  conclusion?: string;
  tables?: ChapterTable[];
  images?: ChapterImage[];
  footnotes?: Footnote[];
}

/** Mirrors `ChapterResponseDto`. */
export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  number: number;
  summary?: string | null;
  content?: ChapterContent | null;
  status: string;
  wordCount: number;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

/** Mirrors `CreateChapterDto`. */
export interface CreateChapterInput {
  title: string;
  number: number;
  summary?: string;
  content?: ChapterContent;
}

/** Mirrors `UpdateChapterDto` — `number` is now editable too (with a uniqueness check server-side). */
export interface UpdateChapterInput {
  title?: string;
  number?: number;
  summary?: string;
  content?: ChapterContent;
}

export const chaptersApi = {
  listByBook: (bookId: string) => apiClient.get<Chapter[]>(`/api/books/${bookId}/chapters`),

  getById: (bookId: string, id: string) =>
    apiClient.get<Chapter>(`/api/books/${bookId}/chapters/${id}`),

  getNextNumber: (bookId: string) =>
    apiClient.get<{ nextNumber: number }>(`/api/books/${bookId}/chapters/next-number`),

  create: (bookId: string, input: CreateChapterInput) =>
    apiClient.post<Chapter>(`/api/books/${bookId}/chapters`, input),

  update: (bookId: string, id: string, input: UpdateChapterInput) =>
    apiClient.put<Chapter>(`/api/books/${bookId}/chapters/${id}`, input),

  publish: (bookId: string, id: string) =>
    apiClient.patch<Chapter>(`/api/books/${bookId}/chapters/${id}/publish`),

  /**
   * The backend has no "unpublish" action — DELETE sets status to HIDDEN
   * instead (see ChapterService.DeleteAsync). There's no endpoint to move
   * a chapter back to DRAFT once published.
   */
  hide: (bookId: string, id: string) =>
    apiClient.delete<void>(`/api/books/${bookId}/chapters/${id}`),

  /**
   * ⚠️ STILL NOT IMPLEMENTED ON THE BACKEND. `Number` can now be changed
   * via Update (with a per-book uniqueness check), but there is still no
   * bulk reorder endpoint. Suggested contract unchanged:
   * `PATCH /api/books/{bookId}/chapters/reorder`
   * body `{ orderedChapterIds: string[] }`.
   */
  reorder: (bookId: string, orderedChapterIds: string[]) =>
    apiClient.patch<Chapter[]>(`/api/books/${bookId}/chapters/reorder`, {
      orderedChapterIds,
    }),
};

/** A blank content document to start a new chapter from. */
export function emptyChapterContent(): ChapterContent {
  return { introduction: "", paragraphs: [], conclusion: "", images: [], tables: [], footnotes: [] };
}
