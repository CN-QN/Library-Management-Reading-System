"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { CreateBookForm } from "@/components/books/book-form";

export default function CreateBookPage() {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div>
        <Link href="/books" className="text-sm text-slate-500 hover:text-slate-700">
          ← Quay lại danh sách sách
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Thêm sách mới</h1>
      </div>

      <Card>
        <CardHeader title="Thông tin sách" />
        <CardBody>
          <CreateBookForm onCreated={(book) => router.push(`/books/${book.id}/edit`)} />
        </CardBody>
      </Card>
    </div>
  );
}
