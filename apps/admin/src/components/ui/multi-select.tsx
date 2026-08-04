"use client";

import { useEffect, useRef, useState } from "react";

export interface MultiSelectOption {
  id: string;
  name: string;
}

export function MultiSelect({
  label,
  options,
  selectedIds,
  onChange,
  placeholder = "— Chọn —",
}: {
  label?: string;
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]
    );
  }

  const selectedNames = options
    .filter((o) => selectedIds.includes(o.id))
    .map((o) => o.name);

  return (
    <div ref={containerRef} className="relative">
      {label && <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
      >
        {selectedNames.length > 0 ? (
          <span className="text-slate-900">{selectedNames.join(", ")}</span>
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg">
          {options.length === 0 && (
            <p className="px-2 py-1.5 text-sm text-slate-400">Không có lựa chọn nào.</p>
          )}
          {options.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(option.id)}
                onChange={() => toggle(option.id)}
                className="h-4 w-4"
              />
              {option.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
