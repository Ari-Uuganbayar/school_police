"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Shift } from "@/lib/types";
import { STATUS_LABEL, type ShiftStatus } from "@/lib/types";

export default function AdminHome() {
  const [stats, setStats] = useState<{ schools: number; crossings: number; shifts: Record<string, number> } | null>(null);

  useEffect(() => {
    Promise.all([api.schools.list(), api.crossings.list(), api.shifts.list()]).then(([schools, crossings, shifts]) => {
      const byStatus: Record<string, number> = {};
      (shifts as Shift[]).forEach(s => { byStatus[s.status] = (byStatus[s.status] ?? 0) + 1; });
      setStats({ schools: schools.length, crossings: crossings.length, shifts: byStatus });
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Тойм</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Сургууль" value={stats?.schools} href="/admin/schools" />
        <Stat label="Гарц" value={stats?.crossings} href="/admin/schools" />
        <Stat label="Нийт ээлж" value={stats ? Object.values(stats.shifts).reduce((a, b) => a + b, 0) : undefined} href="/shifts" />
      </div>
      {stats && (
        <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 font-semibold">Ээлж төлвөөр</h2>
          <ul className="grid gap-2 sm:grid-cols-5">
            {(Object.keys(STATUS_LABEL) as ShiftStatus[]).map(st => (
              <li key={st} className="rounded bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800">
                <div className="text-zinc-500">{STATUS_LABEL[st]}</div>
                <div className="text-lg font-semibold">{stats.shifts[st] ?? 0}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value?: number; href: string }) {
  return (
    <Link href={href} className="rounded-lg border border-zinc-200 bg-white p-5 hover:border-amber-400 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="text-3xl font-bold">{value ?? "…"}</div>
    </Link>
  );
}
