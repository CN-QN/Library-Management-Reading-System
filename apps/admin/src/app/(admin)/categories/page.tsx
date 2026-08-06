/**
 * The standalone Categories & Authors CRUD page has been removed as part of
 * the embedded-book-aggregate migration (Task 6). Authors and categories are
 * now managed as embedded snapshots inside each book record.
 *
 * This page is kept as a placeholder so that the /categories route does not
 * return a 404. Navigation links in the sidebar have been removed.
 */
export default function CatalogRemovedPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-xl font-semibold text-slate-900">
        Thể loại &amp; Tác giả
      </h1>
      <p className="mt-3 max-w-md text-sm text-slate-500">
        Kể từ phiên bản này, thể loại và tác giả được quản lý trực tiếp khi tạo
        hoặc chỉnh sửa từng cuốn sách — không còn trang CRUD độc lập. Vui lòng
        sử dụng{" "}
        <a href="/books" className="font-medium text-slate-900 underline">
          Quản lý sách
        </a>{" "}
        để thêm / sửa thông tin.
      </p>
    </div>
  );
}
