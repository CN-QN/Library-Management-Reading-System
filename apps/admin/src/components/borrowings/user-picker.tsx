"use client";

import { useCallback, useState } from "react";
import { useAsync } from "@/hooks/use-async";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usersApi, type AppUser } from "@/lib/api/users";
import { Input } from "@/components/ui/input";

export function UserPicker({
  selected,
  onSelect,
}: {
  selected: AppUser | null;
  onSelect: (user: AppUser) => void;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const fetchUsers = useCallback(() => {
    if (!debouncedSearch) return Promise.resolve({ items: [], page: 1, limit: 5, totalItems: 0, totalPages: 0, hasNext: false });
    return usersApi.search({ search: debouncedSearch, page: 1, limit: 5 });
  }, [debouncedSearch]);

  const { data } = useAsync(fetchUsers);

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-md border border-slate-300 bg-slate-50 px-3 py-2">
        <div>
          <p className="text-sm font-medium text-slate-900">{selected.fullName}</p>
          <p className="text-xs text-slate-500">
            {selected.email} · {selected.studentCode}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSearch("");
            onSelect(null as unknown as AppUser);
          }}
          className="text-sm text-slate-400 hover:text-slate-700"
        >
          Đổi
        </button>
      </div>
    );
  }

  return (
    <div>
      <Input
        placeholder="Tìm theo tên, email hoặc mã sinh viên..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {data && data.items.length > 0 && (
        <div className="mt-1 divide-y divide-slate-100 rounded-md border border-slate-200 bg-white shadow-sm">
          {data.items.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => onSelect(user)}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span className="font-medium text-slate-900">{user.fullName}</span>{" "}
              <span className="text-slate-400">
                ({user.email} · {user.studentCode})
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
