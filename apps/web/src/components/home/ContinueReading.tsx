import { getAllReadingProgress } from '@/lib/api/reading';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ContinueReadingCard } from '@/components/shared/ContinueReadingCard';

export async function ContinueReading() {
  const progressList = await getAllReadingProgress();

  if (!progressList || progressList.length === 0) {
    // Empty State
    return (
      <section className="w-full py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Tiếp tục đọc</h2>
        </div>
        <Card className="bg-muted/30 border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Bạn chưa đọc cuốn sách nào</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Hãy khám phá hàng ngàn đầu sách hấp dẫn trong thư viện và bắt đầu hành trình tri thức của bạn ngay hôm nay!
            </p>
            <Link href="#explore">
              <Button>Khám phá ngay</Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="w-full py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Tiếp tục đọc</h2>
        <Link href="/profile?tab=reading" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          Xem tất cả <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {progressList.map((item) => (
          <ContinueReadingCard key={item.bookId} item={item} />
        ))}
      </div>
    </section>
  );
}
