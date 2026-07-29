import { getReadingProgress } from '@/lib/api/mock';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export async function ContinueReading() {
  const progressList = await getReadingProgress();

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
        <Link href="/reading-history" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          Xem tất cả <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {progressList.map((item) => (
          <Link key={item.bookId} href={`/read/${item.bookId}`} className="group block">
            <Card className="overflow-hidden hover:shadow-md transition-all border-muted">
              <CardContent className="p-0 flex items-center h-32">
                <div className="relative h-full w-24 shrink-0 bg-muted">
                  {item.book.coverImage && (
                    <Image
                      src={item.book.coverImage}
                      alt={item.book.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  )}
                </div>
                <div className="flex flex-col flex-1 p-4 h-full justify-between overflow-hidden">
                  <div>
                    <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                      {item.book.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                      {item.currentChapterTitle || 'Đang đọc'}
                    </p>
                  </div>
                  
                  <div className="mt-auto space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-muted-foreground">{item.progressPercentage}% đã đọc</span>
                    </div>
                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-500 ease-in-out" 
                        style={{ width: `${item.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
