export interface Book {
  id: string;
  title: string;
  author: string;
  /** URL tuyệt đối đến ảnh bìa sách */
  coverImage?: string;
  description?: string;
  categoryIds?: string[];
  /** Trạng thái xuất bản: "Published", "Draft", v.v. */
  status?: string;
  /** Chuỗi ISO 8601 (vd: "2026-07-29T10:00:00Z") */
  createdAt?: string;
}
