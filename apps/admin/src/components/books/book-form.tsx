"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BookCover } from "@/components/ui/book-cover";
import { useToast } from "@/components/ui/toast";
import { slugify } from "@/lib/slugify";
import { booksApi, type Book, type CreateBookInput, type UpdateBookInput } from "@/lib/api/books";

const ACCESS_TYPES = ["FREE", "PREMIUM", "PHYSICAL_ONLY"];

interface CreateFormValues {
  title: string;
  slug: string;
  isbn: string;
  summary: string;
  publisherId: string;
  publicationYear: string;
  language: string;
  accessType: string;
  authorIds: string;
  categoryIds: string;
}

interface EditFormValues {
  title: string;
  summary: string;
  publisherId: string;
  publicationYear: string;
  language: string;
  accessType: string;
  authorIds: string;
  categoryIds: string;
}

function splitIds(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Uploads the cover via the real Files API; failure doesn't block the save flow. */
async function tryUploadCover(bookId: string, file: File | null, showToast: (m: string, v?: "success" | "error" | "info") => void) {
  if (!file) return;
  try {
    await booksApi.uploadCover(bookId, file);
    showToast("Tải ảnh bìa thành công.", "success");
  } catch (err) {
    showToast(
      err instanceof Error ? `Đã lưu sách, nhưng tải ảnh bìa thất bại: ${err.message}` : "Đã lưu sách, nhưng tải ảnh bìa thất bại.",
      "error"
    );
  }
}

function CoverPicker({
  title,
  file,
  onChange,
}: {
  title: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let url: string | undefined;

    async function run() {
      await Promise.resolve();
      if (cancelled) return;
      if (!file) {
        setPreviewUrl(undefined);
        return;
      }
      url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    void run();
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);

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
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          className="text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
        />
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Ảnh sẽ được tải lên sau khi lưu sách. PNG/JPEG/WEBP.
      </p>
    </div>
  );
}

export function CreateBookForm({ onCreated }: { onCreated: (book: Book) => void }) {
  const { showToast } = useToast();
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({
    defaultValues: {
      title: "",
      slug: "",
      isbn: "",
      summary: "",
      publisherId: "",
      publicationYear: "",
      language: "vi",
      accessType: "FREE",
      authorIds: "",
      categoryIds: "",
    },
  });

  const title = watch("title");

  async function onSubmit(values: CreateFormValues) {
    try {
      if (values.slug) {
        const slugCheck = await booksApi.validateSlug(values.slug);
        if (!slugCheck.isValid) {
          setError("slug", { message: "Slug này đã tồn tại, vui lòng chọn slug khác." });
          return;
        }
      }
      if (values.isbn) {
        const isbnCheck = await booksApi.validateIsbn(values.isbn);
        if (!isbnCheck.isValid) {
          setError("isbn", { message: "ISBN này đã tồn tại, vui lòng kiểm tra lại." });
          return;
        }
      }

      const payload: CreateBookInput = {
        title: values.title,
        slug: values.slug || slugify(values.title),
        isbn: values.isbn || undefined,
        summary: values.summary || undefined,
        publisherId: values.publisherId || undefined,
        publicationYear: values.publicationYear ? Number(values.publicationYear) : undefined,
        language: values.language || undefined,
        accessType: values.accessType || undefined,
        authorIds: splitIds(values.authorIds),
        categoryIds: splitIds(values.categoryIds),
      };

      const book = await booksApi.create(payload);
      await tryUploadCover(book.id, coverFile, showToast);
      showToast("Tạo sách thành công.", "success");
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
          {...register("title", {
            required: "Vui lòng nhập tên sách.",
            onChange: (e) => {
              if (!slugTouched) setValue("slug", slugify(e.target.value));
            },
          })}
        />
        <Input
          label="Slug"
          error={errors.slug?.message}
          {...register("slug", {
            required: "Vui lòng nhập slug.",
            onChange: () => setSlugTouched(true),
          })}
        />
        <Input label="ISBN" error={errors.isbn?.message} {...register("isbn")} />
        <Input label="Nhà xuất bản (ID)" {...register("publisherId")} />
        <Input
          label="Năm xuất bản"
          type="number"
          {...register("publicationYear")}
        />
        <Input label="Ngôn ngữ" {...register("language")} />
        <Select label="Loại truy cập" {...register("accessType")}>
          {ACCESS_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
      </div>

      <Textarea label="Tóm tắt" {...register("summary")} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Tác giả (ID, cách nhau bởi dấu phẩy)"
          placeholder="authorId1, authorId2"
          {...register("authorIds")}
        />
        <Input
          label="Thể loại (ID, cách nhau bởi dấu phẩy)"
          placeholder="categoryId1, categoryId2"
          {...register("categoryIds")}
        />
      </div>
      <p className="-mt-3 text-xs text-slate-400">
        Backend chưa có API danh sách Tác giả/Thể loại để chọn — nhập tạm ID, sẽ chuyển
        sang multi-select khi API đó sẵn sàng.
      </p>

      <CoverPicker title={title} file={coverFile} onChange={setCoverFile} />

      <Button type="submit" isLoading={isSubmitting}>
        Tạo sách
      </Button>
    </form>
  );
}

export function EditBookForm({
  book,
  onSaved,
}: {
  book: Book;
  onSaved: (book: Book) => void;
}) {
  const { showToast } = useToast();
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditFormValues>({
    defaultValues: {
      title: book.title,
      summary: book.summary ?? "",
      publisherId: "",
      publicationYear: book.publicationYear ? String(book.publicationYear) : "",
      language: book.language,
      accessType: book.accessType,
      authorIds: book.authorIds.join(", "),
      categoryIds: book.categoryIds.join(", "),
    },
  });

  const title = watch("title");

  async function onSubmit(values: EditFormValues) {
    try {
      const payload: UpdateBookInput = {
        title: values.title,
        summary: values.summary || undefined,
        publisherId: values.publisherId || undefined,
        publicationYear: values.publicationYear ? Number(values.publicationYear) : undefined,
        language: values.language || undefined,
        accessType: values.accessType || undefined,
        authorIds: splitIds(values.authorIds),
        categoryIds: splitIds(values.categoryIds),
      };
      const updated = await booksApi.update(book.id, payload);
      await tryUploadCover(book.id, coverFile, showToast);
      showToast("Cập nhật sách thành công.", "success");
      onSaved(updated);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể cập nhật sách.", "error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="Slug" value={book.slug} readOnly disabled />
        <Input label="ISBN" value={book.isbn ?? "—"} readOnly disabled />
      </div>
      <p className="text-xs text-slate-400">
        Slug/ISBN chỉ đặt được lúc tạo sách — API cập nhật sách vẫn chưa hỗ trợ sửa 2 trường
        này (Tác giả/Thể loại/Nhà xuất bản thì sửa được, xem bên dưới).
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Tên sách"
          error={errors.title?.message}
          {...register("title", { required: "Vui lòng nhập tên sách." })}
        />
        <Input
          label="Nhà xuất bản (ID)"
          placeholder={book.publisherName ? `Hiện tại: ${book.publisherName}` : "Chưa có"}
          {...register("publisherId")}
        />
        <Input label="Năm xuất bản" type="number" {...register("publicationYear")} />
        <Input label="Ngôn ngữ" {...register("language")} />
        <Select label="Loại truy cập" {...register("accessType")}>
          {ACCESS_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Tác giả (ID, cách nhau bởi dấu phẩy)"
          placeholder="authorId1, authorId2"
          {...register("authorIds")}
        />
        <Input
          label="Thể loại (ID, cách nhau bởi dấu phẩy)"
          placeholder="categoryId1, categoryId2"
          {...register("categoryIds")}
        />
      </div>
      <p className="-mt-3 text-xs text-slate-400">
        Hiện tại: {book.authorNames.join(", ") || "—"} · {book.categoryNames.join(", ") || "—"}
        . Backend vẫn chưa có API danh sách Tác giả/Thể loại để chọn — nhập tạm ID.
      </p>

      <Textarea label="Tóm tắt" {...register("summary")} />

      <CoverPicker title={title} file={coverFile} onChange={setCoverFile} />

      <Button type="submit" isLoading={isSubmitting}>
        Lưu thay đổi
      </Button>
    </form>
  );
}
