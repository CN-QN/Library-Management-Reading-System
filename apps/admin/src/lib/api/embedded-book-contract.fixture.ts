import type { CreateBookInput } from "./books";

export const embeddedBookFixture: CreateBookInput = {
  title: "Dế Mèn Phiêu Lưu Ký",
  slug: "de-men-phieu-luu-ky",
  authors: [{ authorId: "author-1", name: "Tô Hoài", slug: "to-hoai", role: "AUTHOR", order: 1 }],
  categories: [{ categoryId: "category-1", name: "Văn học", slug: "van-hoc" }],
  publisher: { publisherId: "publisher-1", name: "NXB Kim Đồng", slug: "nxb-kim-dong" },
};

if ("authorIds" in embeddedBookFixture || "categoryIds" in embeddedBookFixture || "publisherId" in embeddedBookFixture) {
  throw new Error("Embedded book payload must not contain catalog foreign-key fields");
}
