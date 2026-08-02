import { Card } from "@/components/ui/card";
import type { StatCardData } from "@/lib/api/reports";

export function StatCard({
  label,
  stat,
}: {
  label: string;
  stat: StatCardData;
}) {
  return (
    <Card className="p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">
        {stat.value.toLocaleString("vi-VN")}
      </p>
    </Card>
  );
}
