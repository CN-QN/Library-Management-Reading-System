"use client";

import type { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { StatCardData } from "@/lib/api/reports";

type CardVariant = "blue" | "emerald" | "amber" | "rose" | "violet" | "default";

const variantStyles: Record<CardVariant, { bg: string; icon: string; badge: string; value: string }> = {
  blue:    { bg: "bg-white", icon: "bg-blue-100 text-blue-600",    badge: "bg-blue-50 text-blue-700",    value: "text-blue-700" },
  emerald: { bg: "bg-white", icon: "bg-emerald-100 text-emerald-600", badge: "bg-emerald-50 text-emerald-700", value: "text-emerald-700" },
  amber:   { bg: "bg-white", icon: "bg-amber-100 text-amber-600",   badge: "bg-amber-50 text-amber-700",   value: "text-amber-700" },
  rose:    { bg: "bg-white", icon: "bg-rose-100 text-rose-600",     badge: "bg-rose-50 text-rose-700",     value: "text-rose-700" },
  violet:  { bg: "bg-white", icon: "bg-violet-100 text-violet-600", badge: "bg-violet-50 text-violet-700", value: "text-violet-700" },
  default: { bg: "bg-white", icon: "bg-slate-100 text-slate-600",   badge: "bg-slate-50 text-slate-700",   value: "text-slate-800" },
};

export function StatCard({
  label,
  stat,
  icon,
  variant = "default",
  trend,
  suffix,
}: {
  label: string;
  stat: StatCardData;
  icon?: ReactNode;
  variant?: CardVariant;
  trend?: { value: number; label: string };
  suffix?: string;
}) {
  const styles = variantStyles[variant];

  return (
    <div className={`${styles.bg} rounded-2xl shadow-sm ring-1 ring-slate-100 p-5 flex flex-col gap-3`}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon && (
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles.icon}`}>
            {icon}
          </div>
        )}
      </div>

      <p className={`text-3xl font-bold tracking-tight ${styles.value}`}>
        {stat.value.toLocaleString("vi-VN")}
        {suffix && <span className="ml-1 text-base font-normal text-slate-400">{suffix}</span>}
      </p>

      {trend && (
        <div className={`inline-flex items-center gap-1 self-start rounded-full px-2 py-0.5 text-xs font-semibold ${styles.badge}`}>
          {trend.value >= 0 ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>{trend.label}</span>
        </div>
      )}
    </div>
  );
}
