"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Component Progress hiển thị thanh tiến độ phần trăm (0-100).
 *
 * Dùng ở: InProgressBooksTab và các trang theo dõi tiến độ đọc.
 *
 * @param value - Giá trị phần trăm tiến độ từ 0 đến 100
 */
function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<"div"> & { value?: number }) {
  const percentage = Math.min(100, Math.max(0, value ?? 0))
  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="h-full w-full flex-1 bg-primary transition-all duration-300"
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  )
}

export { Progress }
