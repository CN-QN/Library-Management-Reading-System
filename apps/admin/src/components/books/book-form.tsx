"use client";

import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { BookCover } from "@/components/ui/book-cover";
import { useToast } from "@/components/ui/toast";
import {
  booksApi,
  type Book,
  type BookAuthorSnapshot,
  type BookCategorySnapshot,
  type BookPublisherSnapshot,
  type CreateBookInput,
  type UpdateBookInput,
} from "@/lib/api/books";

const ACCESS_TYPES = ["FREE", "PREMIUM", "PHYSICAL_ONLY"];
const MAX_COVER_BYTES = 10 * 1024 * 1024;
const ACCEPTED_COVER_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

interface CreateFormValues {
  title: string;
  isbn: string;
  summary: string;
  publicationYear: string;
  accessType: string;
  price: string;
  publisherName: string;
}

interface EditFormValues {
  title: string;
  summary: string;
  publicationYear: string;
  accessType: string;
  price: string;
  publisherName: string;
}

// ---------------------------------------------------------------------------
// Inline author row editor
// ---------------------------------------------------------------------------

function AuthorRow({
  author,
  index,
  onChange,
  onRemove,
}: {
  author: BookAuthorSnapshot;
  index: number;
  onChange: (a: BookAuthorSnapshot) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-end rounded-md border border-slate-200 p-2">
      <div className="col-span-7">
        <label className="mb-1 block text-xs text-slate-500">Tên</label>
        <input
          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
          value={author.name}
          onChange={(e) => onChange({ ...author, name: e.target.value })}
          placeholder="Tên tác giả"
        />
      </div>
      <div className="col-span-2">
        <label className="mb-1 block text-xs text-slate-500">Vai trò</label>
        <select
          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
          value={author.role}
          onChange={(e) => onChange({ ...author, role: e.target.value })}
        >
          <option value="AUTHOR">AUTHOR</option>
          <option value="CO_AUTHOR">CO_AUTHOR</option>
          <option value="EDITOR">EDITOR</option>
          <option value="TRANSLATOR">TRANSLATOR</option>
        </select>
      </div>
      <div className="col-span-1">
        <label className="mb-1 block text-xs text-slate-500">Thứ tự</label>
        <input
          type="number"
          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
          value={author.order}
          onChange={(e) => onChange({ ...author, order: Number(e.target.value) })}
          min={1}
        />
      </div>
      <div className="col-span-1 flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          aria-label={`Xóa tác giả ${index + 1}`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline category row editor
// ---------------------------------------------------------------------------

function CategoryRow({
  category,
  index,
  onChange,
  onRemove,
}: {
  category: BookCategorySnapshot;
  index: number;
  onChange: (c: BookCategorySnapshot) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-end rounded-md border border-slate-200 p-2">
      <div className="col-span-11">
        <label className="mb-1 block text-xs text-slate-500">Tên</label>
        <input
          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
          value={category.name}
          onChange={(e) => onChange({ ...category, name: e.target.value })}
          placeholder="Tên thể loại"
        />
      </div>
      <div className="col-span-1 flex justify-end items-end">
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          aria-label={`Xóa thể loại ${index + 1}`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyAuthor(order: number): BookAuthorSnapshot {
  return { authorId: "", name: "", slug: "", role: "AUTHOR", order };
}

function emptyCategory(): BookCategorySnapshot {
  return { categoryId: "", name: "", slug: "" };
}

/**
 * CoverPicker: Hiển thị xem trước ảnh bìa cục bộ khi người dùng chọn file.
 * Việc upload chỉ diễn ra khi người dùng ấn bấm submit (Tạo/Lưu sách).
 */
function CoverPicker({
  title,
  existingCoverUrl,
  onFileSelect,
}: {
  title: string;
  existingCoverUrl?: string | null;
  onFileSelect: (file: File | null) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(existingCoverUrl ?? undefined);
  const [fileError, setFileError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type && !ACCEPTED_COVER_TYPES.has(file.type)) {
      setFileError("Chỉ chấp nhận ảnh PNG, JPEG hoặc WEBP.");
      onFileSelect(null);
      e.target.value = "";
      return;
    }

    if (file.size > MAX_COVER_BYTES) {
      setFileError("Ảnh bìa không được vượt quá 10 MB.");
      onFileSelect(null);
      e.target.value = "";
      return;
    }

    // Tạo preview blob URL cho người dùng xem trước, CHƯA gọi API upload
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const blobUrl = URL.createObjectURL(file);
    objectUrlRef.current = blobUrl;
    setPreviewUrl(blobUrl);
    setFileError(null);
    onFileSelect(file);
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">Ảnh bìa</label>
      <div className="flex items-center gap-4">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Xem trước bìa sách" className="h-28 w-20 rounded-md object-cover" />
        ) : (
          <BookCover title={title || "?"} size={80} />
        )}
        <div className="flex flex-col gap-2">
          <label className="cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            {previewUrl ? "Đổi ảnh bìa khác" : "Chọn ảnh bìa"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <p className="text-xs text-slate-400">PNG/JPEG/WEBP, tối đa 10 MB.</p>
          {fileError ? <p className="text-xs font-medium text-red-600">{fileError}</p> : null}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Publisher inline fields helper
// ---------------------------------------------------------------------------

function buildPublisher(name: string): BookPublisherSnapshot | undefined {
  const trimmedName = name.trim();
  if (!trimmedName) return undefined;
  return { publisherId: "", name: trimmedName, slug: "" };
}

// ---------------------------------------------------------------------------
// CreateBookForm
// ---------------------------------------------------------------------------

export function CreateBookForm({ onCreated }: { onCreated: (book: Book) => void }) {
  const { showToast } = useToast();
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [authors, setAuthors] = useState<BookAuthorSnapshot[]>([emptyAuthor(1)]);
  const [categories, setCategories] = useState<BookCategorySnapshot[]>([emptyCategory()]);
  const {
    register,
    handleSubmit,
    watch,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({
    defaultValues: {
      title: "",
      isbn: "",
      summary: "",
      publisherName: "",
      publicationYear: "",
      accessType: "FREE",
      price: "0",
    },
  });

  const title = watch("title");
  const accessType = watch("accessType");

  function updateAuthor(index: number, a: BookAuthorSnapshot) {
    setAuthors((prev) => prev.map((x, i) => (i === index ? a : x)));
  }
  function removeAuthor(index: number) {
    setAuthors((prev) => prev.filter((_, i) => i !== index));
  }
  function addAuthor() {
    setAuthors((prev) => [...prev, emptyAuthor(prev.length + 1)]);
  }

  function updateCategory(index: number, c: BookCategorySnapshot) {
    setCategories((prev) => prev.map((x, i) => (i === index ? c : x)));
  }
  function removeCategory(index: number) {
    setCategories((prev) => prev.filter((_, i) => i !== index));
  }
  function addCategory() {
    setCategories((prev) => [...prev, emptyCategory()]);
  }

  async function onSubmit(values: CreateFormValues) {
    try {
      if (values.isbn) {
        const isbnCheck = await booksApi.validateIsbn(values.isbn);
        if (!isbnCheck.isValid) {
          setError("isbn", { message: "ISBN này đã tồn tại, vui lòng kiểm tra lại." });
          return;
        }
      }

      const validAuthors = authors.filter((a) => a.name.trim());
      const validCategories = categories.filter((c) => c.name.trim());

      const payload: CreateBookInput = {
        title: values.title,
        isbn: values.isbn || undefined,
        summary: values.summary || undefined,
        publicationYear: values.publicationYear ? Number(values.publicationYear) : undefined,
        accessType: values.accessType || undefined,
        price: values.accessType === "FREE" ? 0 : Number(values.price),
        authors: validAuthors,
        categories: validCategories,
        publisher: buildPublisher(values.publisherName),
      };

      let book = await booksApi.create(payload);
      let coverUploadError: string | null = null;

      if (coverFile) {
        try {
          const cover = await booksApi.uploadCover(book.id, coverFile);
          book = { ...book, coverAssetId: cover.id, coverImageUrl: cover.url };
        } catch (err) {
          coverUploadError = err instanceof Error ? err.message : "Không rõ nguyên nhân.";
        }
      }

      showToast(
        coverUploadError
          ? `Đã tạo sách, nhưng chưa tải được ảnh bìa: ${coverUploadError}`
          : "Tạo sách thành công.",
        coverUploadError ? "warning" : "success"
      );
      onCreated(book);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể tạo sách.", "error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Tên sách"
          error={errors.title?.message}
          {...register("title", { required: "Vui lòng nhập tên sách." })}
        />
        <Input label="ISBN" error={errors.isbn?.message} {...register("isbn")} />
        <Input
          label="Năm xuất bản (từ 1450)"
          type="number"
          min={1450}
          max={new Date().getFullYear()}
          error={errors.publicationYear?.message}
          {...register("publicationYear", {
            validate: (val) => !val || (Number(val) >= 1450 && Number(val) <= new Date().getFullYear()) || `Năm xuất bản phải từ 1450 đến ${new Date().getFullYear()}`,
          })}
        />
        <Select label="Loại truy cập" {...register("accessType")}>
          {ACCESS_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
        <Input
          label="Giá mở khóa (VND)"
          type="number"
          min={accessType === "FREE" ? 0 : 1000}
          step={1000}
          disabled={accessType === "FREE"}
          {...register("price", {
            validate: (value) => accessType === "FREE" || Number(value) > 0 || "Sách Premium phải có giá lớn hơn 0.",
          })}
          error={errors.price?.message}
        />
      </div>

      <Controller
        name="summary"
        control={control}
        render={({ field }) => <RichTextEditor label="Tóm tắt" value={field.value} onChange={field.onChange} />}
      />

      {/* Publisher */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Nhà xuất bản</p>
        <Input label="Tên NXB" {...register("publisherName")} placeholder="Ví dụ: NXB Kim Đồng" />
      </div>

      {/* Authors */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Tác giả</p>
        <div className="space-y-2">
          {authors.map((a, i) => (
            <AuthorRow
              key={i}
              index={i}
              author={a}
              onChange={(updated) => updateAuthor(i, updated)}
              onRemove={() => removeAuthor(i)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addAuthor}
          className="mt-2 rounded-md px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          + Thêm tác giả
        </button>
      </div>

      {/* Categories */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Thể loại</p>
        <div className="space-y-2">
          {categories.map((c, i) => (
            <CategoryRow
              key={i}
              index={i}
              category={c}
              onChange={(updated) => updateCategory(i, updated)}
              onRemove={() => removeCategory(i)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addCategory}
          className="mt-2 rounded-md px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          + Thêm thể loại
        </button>
      </div>

      <CoverPicker
        title={title}
        onFileSelect={(file) => setCoverFile(file)}
      />

      <Button type="submit" isLoading={isSubmitting}>
        Tạo sách
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// EditBookForm
// ---------------------------------------------------------------------------

export function EditBookForm({
  book,
  onSaved,
}: {
  book: Book;
  onSaved: (book: Book) => void;
}) {
  const { showToast } = useToast();
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [authors, setAuthors] = useState<BookAuthorSnapshot[]>(
    book.authors?.length ? book.authors : [emptyAuthor(1)]
  );
  const [categories, setCategories] = useState<BookCategorySnapshot[]>(
    book.categories?.length ? book.categories : [emptyCategory()]
  );
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EditFormValues>({
    defaultValues: {
      title: book.title,
      summary: book.summary ?? "",
      publisherName: book.publisher?.name ?? "",
      publicationYear: book.publicationYear ? String(book.publicationYear) : "",
      accessType: book.accessType,
      price: String(book.price ?? 0),
    },
  });

  const title = watch("title");
  const accessType = watch("accessType");

  function updateAuthor(index: number, a: BookAuthorSnapshot) {
    setAuthors((prev) => prev.map((x, i) => (i === index ? a : x)));
  }
  function removeAuthor(index: number) {
    setAuthors((prev) => prev.filter((_, i) => i !== index));
  }
  function addAuthor() {
    setAuthors((prev) => [...prev, emptyAuthor(prev.length + 1)]);
  }

  function updateCategory(index: number, c: BookCategorySnapshot) {
    setCategories((prev) => prev.map((x, i) => (i === index ? c : x)));
  }
  function removeCategory(index: number) {
    setCategories((prev) => prev.filter((_, i) => i !== index));
  }
  function addCategory() {
    setCategories((prev) => [...prev, emptyCategory()]);
  }

  async function onSubmit(values: EditFormValues) {
    try {
      const validAuthors = authors.filter((a) => a.name.trim());
      const validCategories = categories.filter((c) => c.name.trim());

      const payload: UpdateBookInput = {
        title: values.title,
        summary: values.summary || undefined,
        publicationYear: values.publicationYear ? Number(values.publicationYear) : undefined,
        accessType: values.accessType || undefined,
        price: values.accessType === "FREE" ? 0 : Number(values.price),
        authors: validAuthors,
        categories: validCategories,
        publisher: buildPublisher(values.publisherName),
      };
      let updated = await booksApi.update(book.id, payload);

      let coverUploadError: string | null = null;
      if (coverFile) {
        try {
          const res = await booksApi.uploadCover(book.id, coverFile);
          updated = { ...updated, coverAssetId: res.id, coverImageUrl: res.url };
        } catch (err) {
          coverUploadError = err instanceof Error ? err.message : "Không rõ nguyên nhân.";
        }
      }

      showToast(
        coverUploadError
          ? `Đã lưu thông tin sách, nhưng chưa tải được ảnh bìa: ${coverUploadError}`
          : "Cập nhật sách thành công.",
        coverUploadError ? "warning" : "success"
      );
      onSaved(updated);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể cập nhật sách.", "error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="ISBN" value={book.isbn ?? "—"} readOnly disabled />
      </div>
      <p className="text-xs text-slate-400">
        Slug được backend tự tạo và giữ ổn định; ISBN hiện không hỗ trợ thay đổi.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Tên sách"
          error={errors.title?.message}
          {...register("title", { required: "Vui lòng nhập tên sách." })}
        />
        <Input
          label="Năm xuất bản (từ 1450)"
          type="number"
          min={1450}
          max={new Date().getFullYear()}
          error={errors.publicationYear?.message}
          {...register("publicationYear", {
            validate: (val) => !val || (Number(val) >= 1450 && Number(val) <= new Date().getFullYear()) || `Năm xuất bản phải từ 1450 đến ${new Date().getFullYear()}`,
          })}
        />
        <Select label="Loại truy cập" {...register("accessType")}>
          {ACCESS_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
        <Input
          label="Giá mở khóa (VND)"
          type="number"
          min={accessType === "FREE" ? 0 : 1000}
          step={1000}
          disabled={accessType === "FREE"}
          {...register("price", {
            validate: (value) => accessType === "FREE" || Number(value) > 0 || "Sách Premium phải có giá lớn hơn 0.",
          })}
          error={errors.price?.message}
        />
      </div>

      {/* Publisher */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Nhà xuất bản</p>
        <Input label="Tên NXB" {...register("publisherName")} placeholder="Ví dụ: NXB Kim Đồng" />
      </div>

      {/* Authors */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Tác giả</p>
        <div className="space-y-2">
          {authors.map((a, i) => (
            <AuthorRow
              key={i}
              index={i}
              author={a}
              onChange={(updated) => updateAuthor(i, updated)}
              onRemove={() => removeAuthor(i)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addAuthor}
          className="mt-2 rounded-md px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          + Thêm tác giả
        </button>
      </div>

      {/* Categories */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Thể loại</p>
        <div className="space-y-2">
          {categories.map((c, i) => (
            <CategoryRow
              key={i}
              index={i}
              category={c}
              onChange={(updated) => updateCategory(i, updated)}
              onRemove={() => removeCategory(i)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addCategory}
          className="mt-2 rounded-md px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          + Thêm thể loại
        </button>
      </div>

      <Controller
        name="summary"
        control={control}
        render={({ field }) => <RichTextEditor label="Tóm tắt" value={field.value} onChange={field.onChange} />}
      />

      <CoverPicker
        title={title}
        existingCoverUrl={book.coverImageUrl ?? book.coverAssetId}
        onFileSelect={(file) => setCoverFile(file)}
      />

      <Button type="submit" isLoading={isSubmitting}>
        Lưu thay đổi
      </Button>
    </form>
  );
}
