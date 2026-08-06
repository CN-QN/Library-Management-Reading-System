/** Embedded author snapshot returned by the books endpoint. */
export interface BookAuthorSnapshot {
  authorId: string;
  name: string;
  slug: string;
  role: string;
  order: number;
}

/** Embedded category snapshot returned by the books endpoint. */
export interface BookCategorySnapshot {
  categoryId: string;
  name: string;
  slug: string;
}

/** Embedded publisher snapshot returned by the books endpoint. */
export interface BookPublisherSnapshot {
  publisherId: string;
  name: string;
  slug: string;
}

export interface Book {
  id: string;
  /** Chuỗi định danh URL thân thiện (vd: "co-gai-den-tu-hom-qua") */
  slug?: string;
  title: string;
  /** Convenience: first author name (derived from authors[]) */
  author: string;
  /** URL tuyệt đối đến ảnh bìa sách */
  coverImage?: string;
  description?: string;
  /** Embedded author snapshots */
  authors?: BookAuthorSnapshot[];
  /** Embedded category snapshots */
  categories?: BookCategorySnapshot[];
  /** Embedded publisher snapshot */
  publisher?: BookPublisherSnapshot | null;
  rating?: number;
  /** Trạng thái xuất bản: "Published", "Draft", v.v. */
  status?: string;
  /** Chuỗi ISO 8601 (vd: "2026-07-29T10:00:00Z") */
  createdAt?: string;
}
