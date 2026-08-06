import type { ReactNode, TableHTMLAttributes } from "react";
import { TableSkeleton } from "./skeleton";

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
      <table className={`w-full text-left text-sm ${className ?? ""}`} {...props} />
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead className="bg-slate-50 text-xs uppercase text-slate-500">{children}</thead>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}

export function TableRow({ children }: { children: ReactNode }) {
  return <tr className="bg-white hover:bg-slate-50/70 transition-colors">{children}</tr>;
}

export function TableHeadCell({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}

export function TableCell({ children }: { children: ReactNode }) {
  return <td className="px-4 py-3 text-slate-700">{children}</td>;
}

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
}

/**
 * Generic list table: pass `columns` + `data` and get a fully wired
 * table with loading/empty states. Intended for the CRUD list pages
 * (books, users, borrowings, ...).
 */
export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "Không có dữ liệu.",
  getRowKey,
}: {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  getRowKey: (row: T) => string;
}) {
  if (isLoading) {
    return <TableSkeleton columns={columns.length} />;
  }

  if (data.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100 ring-dashed">
        {emptyMessage}
      </div>
    );
  }

  return (
    <Table>
      <TableHead>
        <tr>
          {columns.map((col) => (
            <TableHeadCell key={col.key}>{col.header}</TableHeadCell>
          ))}
        </tr>
      </TableHead>
      <TableBody>
        {data.map((row) => (
          <TableRow key={getRowKey(row)}>
            {columns.map((col) => (
              <TableCell key={col.key}>{col.render(row)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
