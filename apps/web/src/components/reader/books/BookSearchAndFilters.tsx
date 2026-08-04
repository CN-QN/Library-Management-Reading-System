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
import { SearchFilterOption, SearchFiltersResponse } from '@/lib/api/search';

/** Giá trị tùy chọn sắp xếp mặc định nếu chưa chọn */
const DEFAULT_SORT = 'createdAt';

/** Tùy chọn danh sách ngôn ngữ tĩnh dùng trong giao diện bộ lọc */
const STATIC_LANGUAGE_OPTIONS: SearchFilterOption[] = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'Tiếng Anh' },
];

/**
 * Ánh xạ giá trị sắp xếp từ UI (VD: "createdAt", "title", "viewcount", "rating")
 * thành cặp tham số SortBy và SortOrder cho API tìm kiếm sách backend.
 *
 * @param sortValue - Giá trị tùy chọn sắp xếp được chọn
 */
function getSortByAndOrder(sortValue: string): { sortBy: string | null; sortOrder: string | null } {
  switch (sortValue) {
    case 'createdAt':
    case 'newest':
      return { sortBy: 'CreatedAt', sortOrder: 'desc' };
    case 'oldest':
      return { sortBy: 'CreatedAt', sortOrder: 'asc' };
    case 'title':
    case 'title_asc':
      return { sortBy: 'Title', sortOrder: 'asc' };
    case 'title_desc':
      return { sortBy: 'Title', sortOrder: 'desc' };
    case 'viewcount':
      return { sortBy: 'ViewCount', sortOrder: 'desc' };
    case 'rating':
      return { sortBy: 'Rating', sortOrder: 'desc' };
    default:
      return { sortBy: sortValue || null, sortOrder: 'desc' };
  }
}

export interface BookSearchAndFiltersProps {
  /** Từ khóa tìm kiếm ban đầu từ URL query parameter `Keyword` */
  initialKeyword: string;
  /** Dữ liệu bộ lọc siêu dữ liệu (thể loại, tình trạng, tùy chọn sắp xếp) được fetch từ API backend */
  filtersData: SearchFiltersResponse | null;
}

type FilterContentProps = {
  keyword: string;
  selectedCategoryId: string;
  selectedLanguage: string;
  selectedAvailability: string;
  selectedSort: string;
  categoryOptions: { value: string; label: string }[];
  availabilityOptions: SearchFilterOption[];
  sortOptions: SearchFilterOption[];
  onKeywordChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onLanguageChange: (value: string, checked: boolean) => void;
  onAvailabilityChange: (value: string) => void;
  onSortChange: (value: string | null) => void;
  onClearFilters: () => void;
};

/**
 * Component FilterContent - Dựng nội dung bảng lọc và sắp xếp.
 * Được tái sử dụng ở cả giao diện Desktop (Sidebar) và Mobile (Sheet Drawer).
 */
function FilterContent({
  keyword,
  selectedCategoryId,
  selectedLanguage,
  selectedAvailability,
  selectedSort,
  categoryOptions,
  availabilityOptions,
  sortOptions,
  onKeywordChange,
  onCategoryChange,
  onLanguageChange,
  onAvailabilityChange,
  onSortChange,
  onClearFilters,
}: FilterContentProps) {
  const activeSort =
    sortOptions.find((option) => option.value === selectedSort) ||
    sortOptions[0] ||
    { value: 'createdAt', label: 'Mới nhất' };

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

      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Sắp xếp</h3>
        <Select value={selectedSort} onValueChange={onSortChange}>
          <SelectTrigger className="w-full" aria-label="Sắp xếp sách">
            <span className="flex flex-1 text-left line-clamp-1">{activeSort.label}</span>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} sideOffset={4}>
            {sortOptions.map((option, index) => {
              const optionValue = option.value || `sort-${index}`;
              return (
                <SelectItem key={optionValue} value={optionValue}>
                  <span>{option.label}</span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Thể loại</h3>
        <RadioGroup value={selectedCategoryId || 'all'} onValueChange={onCategoryChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="category-all" />
            <Label htmlFor="category-all" className="text-sm font-normal cursor-pointer">
              Tất cả thể loại
            </Label>
          </div>
          {categoryOptions.map((category) => (
            <div key={category.value} className="flex items-center space-x-2">
              <RadioGroupItem value={category.value} id={`category-${category.value}`} />
              <Label htmlFor={`category-${category.value}`} className="text-sm font-normal cursor-pointer">
                {category.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Tình trạng</h3>
        <RadioGroup value={selectedAvailability || 'all'} onValueChange={onAvailabilityChange}>
          {availabilityOptions.map((option, index) => {
            const rawVal = option.value || 'all';
            const idKey = `availability-${rawVal || index}`;
            return (
              <div key={idKey} className="flex items-center space-x-2">
                <RadioGroupItem value={rawVal} id={idKey} />
                <Label htmlFor={idKey} className="text-sm font-normal cursor-pointer">
                  {option.label}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Ngôn ngữ</h3>
        <div className="space-y-2">
          {STATIC_LANGUAGE_OPTIONS.map((language) => (
            <div key={language.value ?? 'vi'} className="flex items-center space-x-2">
              <Checkbox
                id={`language-${language.value}`}
                checked={selectedLanguage === language.value}
                onCheckedChange={(checked) => onLanguageChange(language.value ?? '', checked === true)}
              />
              <Label htmlFor={`language-${language.value}`} className="text-sm font-normal cursor-pointer">
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
 * BookSearchAndFilters - Hiển thị bộ lọc và tìm kiếm danh sách sách.
 * Nhận dữ liệu bộ lọc thật từ API backend qua prop `filtersData` và đồng bộ URL query.
 *
 * @param props - Prop chứa từ khóa ban đầu và dữ liệu siêu dữ liệu bộ lọc từ API backend
 */
export function BookSearchAndFilters({ initialKeyword, filtersData }: BookSearchAndFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedCategoryId = searchParams.get('CategoryId') || '';
  const selectedLanguage = searchParams.get('Language') || '';
  const selectedAvailability = searchParams.get('Availability') || '';
  const selectedSort = searchParams.get('Sort') || searchParams.get('SortBy') || DEFAULT_SORT;

  // Chuyển đổi danh sách thể loại từ dữ liệu API backend
  const categoryOptions = useMemo(() => {
    return filtersData?.categories?.map((c) => ({ value: c.id, label: c.name })) ?? [];
  }, [filtersData]);

  // Tùy chọn tình trạng sách từ API backend với fallback an toàn
  const availabilityOptions = useMemo(() => {
    if (filtersData?.availabilityOptions && filtersData.availabilityOptions.length > 0) {
      return filtersData.availabilityOptions;
    }
    return [
      { value: null, label: 'Tất cả' },
      { value: 'AVAILABLE', label: 'Còn bản sao' },
      { value: 'UNAVAILABLE', label: 'Hết bản sao' },
    ];
  }, [filtersData]);

  // Tùy chọn sắp xếp từ API backend với fallback an toàn
  const sortOptions = useMemo(() => {
    if (filtersData?.sortOptions && filtersData.sortOptions.length > 0) {
      return filtersData.sortOptions;
    }
    return [
      { value: 'createdAt', label: 'Mới nhất' },
      { value: 'title', label: 'Tên sách (A-Z)' },
      { value: 'viewcount', label: 'Lượt xem nhiều nhất' },
      { value: 'rating', label: 'Đánh giá cao nhất' },
    ];
  }, [filtersData]);

  const activeFilterCount = useMemo(() => {
    return [
      selectedCategoryId,
      selectedLanguage,
      selectedAvailability,
      selectedSort !== DEFAULT_SORT ? selectedSort : '',
    ].filter(Boolean).length;
  }, [selectedAvailability, selectedCategoryId, selectedLanguage, selectedSort]);

  const replaceParams = useCallback(
    (updates: Record<string, string | null>) => {
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
    },
    [pathname, router, searchParams]
  );

  const handleSortChange = (value: string | null) => {
    const safeValue = value || DEFAULT_SORT;
    const { sortBy, sortOrder } = getSortByAndOrder(safeValue);

    replaceParams({
      Sort: safeValue === DEFAULT_SORT ? null : safeValue,
      SortBy: safeValue === DEFAULT_SORT ? null : sortBy,
      SortOrder: safeValue === DEFAULT_SORT ? null : sortOrder,
    });
  };

  const handleClearFilters = () => {
    replaceParams({
      Keyword: null,
      CategoryId: null,
      Language: null,
      Availability: null,
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
      categoryOptions={categoryOptions}
      availabilityOptions={availabilityOptions}
      sortOptions={sortOptions}
      onKeywordChange={(value) => replaceParams({ Keyword: value || null })}
      onCategoryChange={(value) => replaceParams({ CategoryId: value === 'all' ? null : value })}
      onLanguageChange={(value, checked) => replaceParams({ Language: checked ? value : null })}
      onAvailabilityChange={(value) => replaceParams({ Availability: value === 'all' ? null : value })}
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
            onChange={(event) => replaceParams({ Keyword: event.target.value || null })}
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
                Tìm kiếm, lọc theo thể loại, tình trạng và sắp xếp danh sách sách.
              </SheetDescription>
            </SheetHeader>
            {filterContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

