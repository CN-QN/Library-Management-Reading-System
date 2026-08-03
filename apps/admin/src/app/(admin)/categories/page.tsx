"use client";

import { useCallback, useState } from "react";
import { useAsync } from "@/hooks/use-async";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { categoriesApi, type Category } from "@/lib/api/categories";
import { authorsApi, type Author } from "@/lib/api/authors";
import { ApiError } from "@/lib/api-client";
import { describeErrorCode } from "@/lib/error-codes";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/context/auth-context";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CategoryFormModal } from "@/components/categories/category-form-modal";
import { AuthorFormModal } from "@/components/categories/author-form-modal";
import { Permissions } from "@/lib/permissions";

function CategoriesSection() {
  const { can } = useAuth();
  const { showToast } = useToast();
  const fetchCategories = useCallback(() => categoriesApi.list(), []);
  const { data, error, isLoading, retry } = useAsync(fetchCategories);

  const [editing, setEditing] = useState<Category | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const categories = data ?? [];

  function parentName(parentId?: string | null) {
    if (!parentId) return "—";
    return categories.find((c) => c.id === parentId)?.name ?? "—";
  }

  return (
    <Card>
      <CardHeader
        title="Thể loại"
        description={`${categories.length} mục`}
        action={
          can(Permissions.BookCreate) ? (
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              + Thêm thể loại
            </Button>
          ) : undefined
        }
      />
      <CardBody>
        {isLoading && <Skeleton className="h-48 w-full" />}
        {!isLoading && error && (
          <ErrorState
            message={
              error instanceof ApiError
                ? describeErrorCode(error.errorCode, error.message)
                : "Không thể tải danh sách thể loại."
            }
            onRetry={retry}
          />
        )}
        {!isLoading && !error && (
          <div className="max-h-96 space-y-1 overflow-y-auto">
            {categories.length === 0 && (
              <p className="text-sm text-slate-400">Chưa có thể loại nào.</p>
            )}
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-2 text-sm hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{cat.name}</p>
                  <p className="text-xs text-slate-400">
                    {cat.slug} · Cha: {parentName(cat.parentId)}
                  </p>
                </div>
                <Badge variant={cat.status === "ACTIVE" ? "success" : "neutral"}>
                  {cat.status}
                </Badge>
                {can(Permissions.BookUpdate) && (
                  <button
                    type="button"
                    onClick={() => setEditing(cat)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Sửa
                  </button>
                )}
                {can(Permissions.BookDelete) && (
                  <button
                    type="button"
                    onClick={() => setDeleting(cat)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Xóa
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardBody>

      <CategoryFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        category={null}
        allCategories={categories}
        onSaved={retry}
      />
      <CategoryFormModal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        category={editing}
        allCategories={categories}
        onSaved={retry}
      />
      <ConfirmDialog
        isOpen={Boolean(deleting)}
        title="Xóa thể loại"
        description={`Bạn có chắc muốn xóa thể loại "${deleting?.name}"? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa"
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await categoriesApi.delete(deleting.id);
            showToast("Đã xóa thể loại.", "success");
            retry();
          } catch (err) {
            showToast(err instanceof Error ? err.message : "Không thể xóa thể loại.", "error");
          }
        }}
      />
    </Card>
  );
}

function AuthorsSection() {
  const { can } = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const fetchAuthors = useCallback(
    () => authorsApi.search({ search: debouncedSearch || undefined, page: 1, pageSize: 100 }),
    [debouncedSearch]
  );
  const { data, error, isLoading, retry } = useAsync(fetchAuthors);

  const [editing, setEditing] = useState<Author | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<Author | null>(null);

  const authors = data?.items ?? [];

  return (
    <Card>
      <CardHeader
        title="Tác giả"
        description={`${data?.totalItems ?? 0} người`}
        action={
          can(Permissions.BookCreate) ? (
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              + Thêm tác giả
            </Button>
          ) : undefined
        }
      />
      <CardBody className="space-y-3">
        <Input
          placeholder="Tìm theo tên tác giả..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {isLoading && <Skeleton className="h-48 w-full" />}
        {!isLoading && error && (
          <ErrorState
            message={
              error instanceof ApiError
                ? describeErrorCode(error.errorCode, error.message)
                : "Không thể tải danh sách tác giả."
            }
            onRetry={retry}
          />
        )}
        {!isLoading && !error && (
          <div className="max-h-96 space-y-1 overflow-y-auto">
            {authors.length === 0 && (
              <p className="text-sm text-slate-400">Chưa có tác giả nào.</p>
            )}
            {authors.map((author) => (
              <div
                key={author.id}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-2 text-sm hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{author.name}</p>
                  <p className="text-xs text-slate-400">{author.slug}</p>
                </div>
                {can(Permissions.BookUpdate) && (
                  <button
                    type="button"
                    onClick={() => setEditing(author)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Sửa
                  </button>
                )}
                {can(Permissions.BookDelete) && (
                  <button
                    type="button"
                    onClick={() => setDeleting(author)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Xóa
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardBody>

      <AuthorFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        author={null}
        onSaved={retry}
      />
      <AuthorFormModal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        author={editing}
        onSaved={retry}
      />
      <ConfirmDialog
        isOpen={Boolean(deleting)}
        title="Xóa tác giả"
        description={`Bạn có chắc muốn xóa tác giả "${deleting?.name}"? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa"
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await authorsApi.delete(deleting.id);
            showToast("Đã xóa tác giả.", "success");
            retry();
          } catch (err) {
            showToast(err instanceof Error ? err.message : "Không thể xóa tác giả.", "error");
          }
        }}
      />
    </Card>
  );
}

export default function CategoriesAuthorsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Thể loại & Tác giả</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CategoriesSection />
        <AuthorsSection />
      </div>
    </div>
  );
}
