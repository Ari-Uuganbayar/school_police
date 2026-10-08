"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { School } from "@/lib/types";
import { SchoolForm } from "@/components/SchoolForm";
import { Alert, btnCls, inputCls } from "@/components/ui";

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<School[] | null>(null);
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(() => api.schools.list(q || undefined).then(setSchools).catch(e => setErr(e.message)), [q]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  async function remove(s: School) {
    if (!confirm(`"${s.name}" сургуулийг устгах уу? Гарцууд нь хамт устана.`)) return;
    setErr("");
    try { await api.schools.remove(s.id); await load(); } catch (e) { setErr((e as Error).message); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Сургууль</h1>
        <button className={btnCls} onClick={() => setAdding(v => !v)}>{adding ? "Хаах" : "+ Сургууль нэмэх"}</button>
      </div>
      {err && <Alert>{err}</Alert>}
      {adding && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-5 dark:border-amber-900 dark:bg-amber-950/20">
          <h2 className="mb-3 font-semibold">Шинэ сургууль</h2>
          <SchoolForm submitLabel="Нэмэх" onCancel={() => setAdding(false)}
            onSubmit={async d => { await api.schools.create(d); setAdding(false); await load(); }} />
        </div>
      )}
      <input className={`${inputCls} max-w-sm`} placeholder="Нэрээр хайх..." value={q} onChange={e => setQ(e.target.value)} />
      {schools === null ? <p className="text-zinc-500">Ачаалж байна...</p> : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-500 dark:bg-zinc-800">
              <tr><th className="px-4 py-2">Нэр</th><th className="px-4 py-2">Дүүрэг / хороо</th><th className="px-4 py-2">Хаяг</th><th className="px-4 py-2 text-center">Гарц</th><th className="px-4 py-2"></th></tr>
            </thead>
            <tbody>
              {schools.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-zinc-500">Сургууль алга</td></tr>}
              {schools.map(s => (
                <tr key={s.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-4 py-2 font-medium"><Link href={`/admin/schools/${s.id}`} className="hover:underline">{s.name}</Link></td>
                  <td className="px-4 py-2">{[s.district, s.khoroo && `${s.khoroo}-р хороо`].filter(Boolean).join(", ") || "-"}</td>
                  <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{s.address || "-"}</td>
                  <td className="px-4 py-2 text-center">{s.crossing_count}</td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <Link href={`/admin/schools/${s.id}`} className="text-amber-600 hover:underline">Засах / гарц</Link>
                    <button onClick={() => remove(s)} className="ml-3 text-red-600 hover:underline">Устгах</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
