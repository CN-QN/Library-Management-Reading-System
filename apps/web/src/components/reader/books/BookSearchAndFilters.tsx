'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';

const FilterContent = ({ 
  keyword, 
  setKeyword,
  sort,
  setSort
}: { 
  keyword: string, 
  setKeyword: (val: string) => void,
  sort: string,
  setSort: (val: string) => void
}) => {
  const sortLabels: Record<string, string> = {
    newest: "Mới nhất",
    popular: "Phổ biến nhất",
    trending: "Thịnh hành",
  };

  return (
  <div className="flex flex-col gap-6">
    {/* Search (Mobile mainly, but can be shared) */}
    <div className="relative md:hidden">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Tìm kiếm sách..."
        className="pl-8"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        aria-label="Tìm kiếm sách"
      />
    </div>

    {/* Sort Options */}
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">Sắp xếp</h3>
      <Select value={sort} onValueChange={(val) => val && setSort(val)}>
        <SelectTrigger>
          <span className="flex flex-1 text-left line-clamp-1">{sortLabels[sort] || "Sắp xếp theo..."}</span>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} sideOffset={4}>
          <SelectItem value="newest">Mới nhất</SelectItem>
          <SelectItem value="popular" disabled>
            Phổ biến nhất <span className="text-[10px] ml-1 text-muted-foreground">(Chưa có API)</span>
          </SelectItem>
          <SelectItem value="trending" disabled>
            Thịnh hành <span className="text-[10px] ml-1 text-muted-foreground">(Chưa có API)</span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Categories - Disabled */}
    <div className="space-y-3">
      <h3 className="font-semibold text-sm flex items-center justify-between">
        Thể loại
        <Badge variant="outline" className="text-[10px] font-normal px-1 py-0 h-4">Chưa có API</Badge>
      </h3>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground italic">Chưa có API hỗ trợ</p>
      </div>
    </div>

    {/* Availability - Disabled */}
    <div className="space-y-3">
      <h3 className="font-semibold text-sm flex items-center justify-between">
        Tình trạng mượn
        <Badge variant="outline" className="text-[10px] font-normal px-1 py-0 h-4">Chưa có API</Badge>
      </h3>
      <RadioGroup disabled>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="all" id="r-all" />
          <Label htmlFor="r-all" className="text-muted-foreground">Tất cả</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="available" id="r-available" />
          <Label htmlFor="r-available" className="text-muted-foreground">Có sẵn để mượn</Label>
        </div>
      </RadioGroup>
    </div>

    {/* Language - Disabled */}
    <div className="space-y-3">
      <h3 className="font-semibold text-sm flex items-center justify-between">
        Ngôn ngữ
        <Badge variant="outline" className="text-[10px] font-normal px-1 py-0 h-4">Chưa có API</Badge>
      </h3>
      <div className="space-y-2">
        {['Tiếng Việt', 'Tiếng Anh'].map((lang) => (
          <div key={lang} className="flex items-center space-x-2">
            <Checkbox id={`lang-${lang}`} disabled />
            <Label htmlFor={`lang-${lang}`} className="text-sm font-normal text-muted-foreground">
              {lang}
            </Label>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
};

/**
 * BookSearchAndFilters - Hiển thị khung tìm kiếm, bộ lọc và sắp xếp danh sách sách.
 * 
 * Quản lý giá trị Keyword bằng local state để tạo độ trễ (debounce) trước khi đẩy lên URL.
 * Các chức năng lọc và sắp xếp nâng cao hiện đang bị vô hiệu hóa vì Backend chưa hỗ trợ.
 * 
 * @param initialKeyword - Từ khóa tìm kiếm ban đầu lấy từ URL
 */
export function BookSearchAndFilters({ initialKeyword }: { initialKeyword: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [keyword, setKeyword] = useState(initialKeyword);
  const [sort, setSort] = useState(searchParams.get('SortBy') || 'newest');

  // Đồng bộ từ khóa tìm kiếm lên URL sau khi người dùng ngừng gõ phím 500ms.
  // Chỉ thực hiện router.replace nếu từ khóa thực sự khác với giá trị hiện tại trên URL
  // để tránh việc re-render vòng lặp và dội request lên server.
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentKeyword = searchParams.get('Keyword') || '';
      if (keyword !== currentKeyword) {
        const params = new URLSearchParams(searchParams);
        if (keyword) {
          params.set('Keyword', keyword);
        } else {
          params.delete('Keyword');
        }
        params.delete('Page'); // Reset to page 1 on search
        router.replace(`${pathname}?${params.toString()}`);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword, pathname, router, searchParams]);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 shrink-0 space-y-6 sticky top-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm kiếm sách..."
            className="pl-8"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            aria-label="Tìm kiếm sách"
          />
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <FilterContent keyword={keyword} setKeyword={setKeyword} sort={sort} setSort={setSort} />
        </div>
      </div>

      {/* Mobile Drawer Trigger */}
      <div className="md:hidden flex items-center gap-2 mb-4">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="outline" className="w-full flex justify-center gap-2" aria-label="Mở bộ lọc">
                <SlidersHorizontal className="w-4 h-4" />
                Bộ lọc & Sắp xếp
              </Button>
            }
          />
          <SheetContent side="left" className="w-[300px] sm:w-[350px] overflow-y-auto p-6">
            <SheetHeader className="text-left mb-6">
              <SheetTitle>Bộ lọc sách</SheetTitle>
              <SheetDescription>
                Tìm kiếm và lọc sách. Một số tính năng chưa được hỗ trợ.
              </SheetDescription>
            </SheetHeader>
            <FilterContent keyword={keyword} setKeyword={setKeyword} sort={sort} setSort={setSort} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
