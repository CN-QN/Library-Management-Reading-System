import { Button } from "./button";

export function ErrorState({
  message = "Không thể tải dữ liệu.",
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-100 bg-red-50/50 p-8 text-center">
      <p className="text-sm font-medium text-red-700">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Thử lại
      </Button>
    </div>
  );
}
