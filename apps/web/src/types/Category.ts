export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  path?: string;
  status?: string;
  displayOrder?: number;
  bookCount?: number;
  children?: Category[];
}
