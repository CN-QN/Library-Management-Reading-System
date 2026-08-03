import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

/**
 * Component Pagination bọc ngoài cùng cho thanh điều hướng trang.
 * Dùng trong các danh sách có phân trang như Book Reviews, Danh sách sách.
 */
function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

/**
 * Container danh sách chứa các phần tử điều hướng phân trang (ul).
 */
function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

/**
 * Phần tử con cho từng nút hoặc ký hiệu dấu ba chấm trong danh sách (li).
 */
function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  /** Trạng thái đánh dấu trang hiện tại đang active */
  isActive?: boolean
} & React.ComponentProps<"button">

/**
 * Nút chuyển tới một trang cụ thể (1, 2, 3...).
 * Tự động tô nổi bật màu primary khi `isActive` là true.
 */
function PaginationLink({
  className,
  isActive,
  ...props
}: PaginationLinkProps) {
  return (
    <button
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size: "icon",
        }),
        "h-8 w-8 cursor-pointer rounded-md text-xs",
        isActive && "border-primary bg-primary/10 font-bold text-primary",
        className
      )}
      {...props}
    />
  )
}

/**
 * Nút quay lại trang trước đó.
 * Vô hiệu hóa và hiển thị mờ khi ở trang 1 (disabled).
 */
function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      aria-label="Đi tới trang trước"
      data-slot="pagination-previous"
      className={cn(
        buttonVariants({
          variant: "ghost",
          size: "sm",
        }),
        "h-8 gap-1 px-2.5 text-xs cursor-pointer disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span>Trước</span>
    </button>
  )
}

/**
 * Nút chuyển sang trang tiếp theo.
 * Vô hiệu hóa và hiển thị mờ khi ở trang cuối (disabled).
 */
function PaginationNext({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      aria-label="Đi tới trang sau"
      data-slot="pagination-next"
      className={cn(
        buttonVariants({
          variant: "ghost",
          size: "sm",
        }),
        "h-8 gap-1 px-2.5 text-xs cursor-pointer disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      {...props}
    >
      <span>Sau</span>
      <ChevronRight className="h-4 w-4" />
    </button>
  )
}

/**
 * Hiển thị biểu tượng dấu ba chấm (...) biểu thị dải trang bị ẩn.
 */
function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex h-8 w-8 items-center justify-center text-xs text-muted-foreground", className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">Thêm trang</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
