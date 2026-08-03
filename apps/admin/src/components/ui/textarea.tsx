import { forwardRef, useId, type TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, className, rows = 4, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;

    return (
      <div>
        {label && (
          <label htmlFor={textareaId} className="mb-1 block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={Boolean(error)}
          className={[
            "w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors",
            "focus:ring-1",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-500"
              : "border-slate-300 focus:border-slate-900 focus:ring-slate-900",
            className ?? "",
          ].join(" ")}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
