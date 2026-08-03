import { Spinner } from "./spinner";

/**
 * Absolutely-positioned overlay. Place inside a `relative` container
 * (e.g. a form wrapper) and render conditionally while `isLoading`.
 */
export function LoadingOverlay({
  message,
  isFullScreen = false,
}: {
  message?: string;
  isFullScreen?: boolean;
}) {
  return (
    <div
      className={[
        "z-20 flex flex-col items-center justify-center gap-2 bg-white/70 backdrop-blur-sm",
        isFullScreen ? "fixed inset-0" : "absolute inset-0 rounded-xl",
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      <Spinner className="h-8 w-8 text-slate-900" />
      {message && <p className="text-sm font-medium text-slate-700">{message}</p>}
    </div>
  );
}
