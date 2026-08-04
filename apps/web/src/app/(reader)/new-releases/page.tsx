import { Metadata } from 'next';
import { getNewReleases } from '@/lib/api/books';
import { BookListContainer } from '@/components/reader/books/BookListContainer';
import { Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sách mới cập nhật | Thư viện',
  description: 'Danh sách các cuốn sách mới nhất vừa được thêm vào thư viện.',
};

export default async function NewReleasesPage() {
  const books = await getNewReleases(50);

  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mới cập nhật</h1>
          <p className="text-muted-foreground mt-1">Những cuốn sách mới nhất vừa có mặt trên hệ thống</p>
        </div>
      </div>

      <div className="flex-1">
        <BookListContainer books={books} />
      </div>
    </div>
  );
}
