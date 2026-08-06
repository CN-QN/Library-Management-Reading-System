"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { CreateBookForm } from "@/components/books/book-form";

export default function CreateBookPage() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-[1px] md:p-8">
      <div className="mx-auto max-w-6xl space-y-4 rounded-2xl bg-slate-50 p-5 shadow-2xl md:p-7">
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
    </div>
  );
}
