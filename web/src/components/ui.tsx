"use client";
import type { ShiftStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";

export const inputCls = "w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900";
export const btnCls = "rounded bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50";
export const btnSecondaryCls = "rounded border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900";

const STATUS_COLOR: Record<ShiftStatus, string> = {
  open: "bg-emerald-100 text-emerald-800",
  accepted: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-zinc-200 text-zinc-700",
  cancelled: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: ShiftStatus }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function Alert({ children, kind = "error" }: { children: React.ReactNode; kind?: "error" | "info" }) {
  const cls = kind === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-blue-200 bg-blue-50 text-blue-700";
  return <div className={`rounded border px-3 py-2 text-sm ${cls}`}>{children}</div>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      {children}
    </label>
  );
}
