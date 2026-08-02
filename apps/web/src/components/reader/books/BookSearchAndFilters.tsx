'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  BOOK_AVAILABILITY_FILTERS,
  BOOK_CATEGORY_FILTERS,
  BOOK_LANGUAGE_FILTERS,
  BOOK_SORT_OPTIONS,
} from '@/lib/api/mocks/book-filter.mocks';

const DEFAULT_SORT = 'newest';

type FilterContentProps = {
  keyword: string;
  selectedCategoryId: string;
  selectedLanguage: string;
  selectedAvailability: string;
  selectedSort: string;
  onKeywordChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onLanguageChange: (value: string, checked: boolean) => void;
  onAvailabilityChange: (value: string) => void;
  onSortChange: (value: string | null) => void;
  onClearFilters: () => void;
};

function FilterContent({
  keyword,
  selectedCategoryId,
  selectedLanguage,
  selectedAvailability,
  selectedSort,
  onKeywordChange,
  onCategoryChange,
  onLanguageChange,
  onAvailabilityChange,
  onSortChange,
  onClearFilters,
}: FilterContentProps) {
  const activeSort = BOOK_SORT_OPTIONS.find((option) => option.value === selectedSort) || BOOK_SORT_OPTIONS[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="relative md:hidden">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Tìm kiếm sách..."
          className="pl-8"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          aria-label="Tìm kiếm sách"
        />
      </div>

      <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
        Bộ lọc đang dùng dữ liệu lựa chọn tạm thời ở frontend. Kết quả thật phụ thuộc API Books hỗ trợ
        các tham số lọc tương ứng.
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Sắp xếp</h3>
        <Select value={selectedSort} onValueChange={onSortChange}>
          <SelectTrigger className="w-full" aria-label="Sắp xếp sách">
            <span className="flex flex-1 text-left line-clamp-1">{activeSort.label}</span>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} sideOffset={4}>
            {BOOK_SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span>{option.label}</span>
                {option.backendPending && (
                  <span className="text-[10px] text-muted-foreground">Chờ BE</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-sm flex items-center justify-between">
          Thể loại
          <Badge variant="outline" className="text-[10px] font-normal px-1 py-0 h-4">Mock options</Badge>
        </h3>
        <RadioGroup value={selectedCategoryId || 'all'} onValueChange={onCategoryChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="category-all" />
            <Label htmlFor="category-all" className="text-sm font-normal">Tất cả thể loại</Label>
          </div>
          {BOOK_CATEGORY_FILTERS.map((category) => (
            <div key={category.value} className="flex items-center space-x-2">
              <RadioGroupItem value={category.value} id={`category-${category.value}`} />
              <Label htmlFor={`category-${category.value}`} className="text-sm font-normal">
                {category.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-sm flex items-center justify-between">
          Tình trạng
          <Badge variant="outline" className="text-[10px] font-normal px-1 py-0 h-4">Chờ BE</Badge>
        </h3>
        <RadioGroup value={selectedAvailability || 'all'} onValueChange={onAvailabilityChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="availability-all" />
            <Label htmlFor="availability-all" className="text-sm font-normal">Tất cả</Label>
          </div>
          {BOOK_AVAILABILITY_FILTERS.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`availability-${option.value}`} />
              <Label htmlFor={`availability-${option.value}`} className="text-sm font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-sm flex items-center justify-between">
          Ngôn ngữ
          <Badge variant="outline" className="text-[10px] font-normal px-1 py-0 h-4">Chờ BE</Badge>
        </h3>
        <div className="space-y-2">
          {BOOK_LANGUAGE_FILTERS.map((language) => (
            <div key={language.value} className="flex items-center space-x-2">
              <Checkbox
                id={`language-${language.value}`}
                checked={selectedLanguage === language.value}
                onCheckedChange={(checked) => onLanguageChange(language.value, checked === true)}
              />
              <Label htmlFor={`language-${language.value}`} className="text-sm font-normal">
                {language.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Button type="button" variant="outline" onClick={onClearFilters}>
        Xoá bộ lọc
      </Button>
    </div>
  );
}

/**
 * BookSearchAndFilters - Hiển thị tìm kiếm, bộ lọc và sắp xếp danh sách sách.
 *
 * State được đồng bộ lên URL để có thể chia sẻ link. Dữ liệu option của filter là mock frontend
 * vì backend chưa có API metadata riêng cho Reader Portal.
 */
export function BookSearchAndFilters({ initialKeyword }: { initialKeyword: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedCategoryId = searchParams.get('CategoryId') || '';
  const selectedLanguage = searchParams.get('Language') || '';
  const selectedAvailability = searchParams.get('AccessType') || '';
  const selectedSort = searchParams.get('Sort') || DEFAULT_SORT;

  const activeFilterCount = useMemo(() => {
    return [selectedCategoryId, selectedLanguage, selectedAvailability, selectedSort !== DEFAULT_SORT ? selectedSort : '']
      .filter(Boolean)
      .length;
  }, [selectedAvailability, selectedCategoryId, selectedLanguage, selectedSort]);

  const replaceParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    params.delete('Page');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [pathname, router, searchParams]);

  const handleSortChange = (value: string | null) => {
    const safeValue = value || DEFAULT_SORT;
    const sortOption = BOOK_SORT_OPTIONS.find((option) => option.value === safeValue) || BOOK_SORT_OPTIONS[0];

    replaceParams({
      Sort: safeValue === DEFAULT_SORT ? null : safeValue,
      SortBy: safeValue === DEFAULT_SORT ? null : sortOption.sortBy,
      SortOrder: safeValue === DEFAULT_SORT ? null : sortOption.sortOrder,
    });
  };

  const handleClearFilters = () => {
    replaceParams({
      Keyword: null,
      CategoryId: null,
      Language: null,
      AccessType: null,
      Sort: null,
      SortBy: null,
      SortOrder: null,
    });
  };

  const filterContent = (
    <FilterContent
      keyword={initialKeyword}
      selectedCategoryId={selectedCategoryId}
      selectedLanguage={selectedLanguage}
      selectedAvailability={selectedAvailability}
      selectedSort={selectedSort}
      onKeywordChange={(value) => replaceParams({ Keyword: value.trim() || null })}
      onCategoryChange={(value) => replaceParams({ CategoryId: value === 'all' ? null : value })}
      onLanguageChange={(value, checked) => replaceParams({ Language: checked ? value : null })}
      onAvailabilityChange={(value) => replaceParams({ AccessType: value === 'all' ? null : value })}
      onSortChange={handleSortChange}
      onClearFilters={handleClearFilters}
    />
  );

  return (
    <>
      <div className="hidden md:block w-64 shrink-0 space-y-6 sticky top-4 self-start">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm kiếm sách..."
            className="pl-8"
            defaultValue={initialKeyword}
            onChange={(event) => replaceParams({ Keyword: event.target.value.trim() || null })}
            aria-label="Tìm kiếm sách"
          />
        </div>
        <div className="border rounded-lg p-4 bg-card">{filterContent}</div>
      </div>

      <div className="md:hidden flex items-center gap-2 mb-4">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="outline" className="w-full flex justify-center gap-2" aria-label="Mở bộ lọc">
                <SlidersHorizontal className="w-4 h-4" />
                Bộ lọc & Sắp xếp
                {activeFilterCount > 0 && <Badge variant="secondary">{activeFilterCount}</Badge>}
              </Button>
            }
          />
          <SheetContent side="left" className="w-[300px] sm:w-[350px] overflow-y-auto p-6">
            <SheetHeader className="text-left mb-6">
              <SheetTitle>Bộ lọc sách</SheetTitle>
              <SheetDescription>
                Tìm kiếm, lọc và sắp xếp sách. Một số bộ lọc sẽ có hiệu lực đầy đủ khi backend hỗ trợ.
              </SheetDescription>
            </SheetHeader>
            {filterContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
