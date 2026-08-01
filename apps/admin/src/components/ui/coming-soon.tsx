export function ComingSoon({ title, epic }: { title: string; epic: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 text-center">
      <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
      <p className="text-sm text-slate-500">
        Chưa triển khai — thuộc task <span className="font-mono">{epic}</span>.
      </p>
    </div>
  );
}
