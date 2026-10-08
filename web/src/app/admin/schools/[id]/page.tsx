"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Crossing, School } from "@/lib/types";
import { CrossingForm } from "@/components/CrossingForm";
import { SchoolForm } from "@/components/SchoolForm";
import { Alert, btnCls } from "@/components/ui";

function AdminSchoolDetail() {
  const { id } = useParams<{ id: string }>();
  const schoolId = Number(id);
  const router = useRouter();
  const [school, setSchool] = useState<School | null>(null);
  const [crossings, setCrossings] = useState<Crossing[]>([]);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingCrossing, setEditingCrossing] = useState<number | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(
    () => Promise.all([api.schools.get(schoolId), api.crossings.list(schoolId)]).then(([s, cs]) => { setSchool(s); setCrossings(cs); }),
    [schoolId],
  );
  useEffect(() => { load().catch(e => setErr(e.message)); }, [load]);

  async function removeCrossing(c: Crossing) {
    if (!confirm(`"${c.name}" гарцыг устгах уу?`)) return;
    setErr("");
    try { await api.crossings.remove(c.id); await load(); } catch (e) { setErr((e as Error).message); }
  }

  async function removeSchool() {
    if (!school || !confirm(`"${school.name}" сургуулийг устгах уу?`)) return;
    try { await api.schools.remove(school.id); router.push("/admin/schools"); } catch (e) { setErr((e as Error).message); }
  }

  if (!school) return err ? <Alert>{err}</Alert> : <p className="text-zinc-500">Ачаалж байна...</p>;

  return (
    <div className="space-y-6">
      <div className="text-sm text-zinc-500"><Link href="/admin/schools" className="hover:underline">Сургууль</Link> / {school.name}</div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        {editing ? (
          <>
            <h2 className="mb-3 font-semibold">Сургууль засах</h2>
            <SchoolForm initial={school} onCancel={() => setEditing(false)}
              onSubmit={async d => { await api.schools.update(school.id, d); setEditing(false); await load(); }} />
          </>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{school.name}</h1>
              <p className="text-zinc-600 dark:text-zinc-400">{[school.district, school.khoroo && `${school.khoroo}-р хороо`, school.address].filter(Boolean).join(", ") || "Хаяг оруулаагүй"}</p>
              {school.lat != null && school.lng != null && (
                <a className="text-sm text-amber-600 underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${school.lat},${school.lng}`}>{school.lat}, {school.lng}</a>
              )}
            </div>
            <div className="flex gap-3 text-sm">
              <button onClick={() => setEditing(true)} className="text-amber-600 hover:underline">Засах</button>
              <button onClick={removeSchool} className="text-red-600 hover:underline">Устгах</button>
            </div>
          </div>
        )}
      </section>

      {err && <Alert>{err}</Alert>}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Замын гарцууд ({crossings.length})</h2>
          <button className={btnCls} onClick={() => { setAdding(v => !v); setEditingCrossing(null); }}>{adding ? "Хаах" : "+ Гарц нэмэх"}</button>
        </div>
        {adding && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-5 dark:border-amber-900 dark:bg-amber-950/20">
            <h3 className="mb-3 font-semibold">Шинэ гарц</h3>
            <CrossingForm submitLabel="Нэмэх" initial={{ lat: school.lat ?? undefined, lng: school.lng ?? undefined }} onCancel={() => setAdding(false)}
              onSubmit={async d => { await api.crossings.create({ ...d, school_id: school.id }); setAdding(false); await load(); }} />
          </div>
        )}
        {crossings.length === 0 && !adding && (
          <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">Гарц бүртгээгүй байна</div>
        )}
        <ul className="space-y-2">
          {crossings.map(c => (
            <li key={c.id} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              {editingCrossing === c.id ? (
                <CrossingForm initial={c} onCancel={() => setEditingCrossing(null)}
                  onSubmit={async d => { await api.crossings.update(c.id, d); setEditingCrossing(null); await load(); }} />
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    {c.description && <div className="text-sm text-zinc-600 dark:text-zinc-400">{c.description}</div>}
                    <div className="mt-1 text-xs text-zinc-500">
                      <a className="underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${c.lat},${c.lng}`}>{c.lat}, {c.lng}</a> · радиус {c.checkin_radius_m} м
                    </div>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <button onClick={() => { setEditingCrossing(c.id); setAdding(false); }} className="text-amber-600 hover:underline">Засах</button>
                    <button onClick={() => removeCrossing(c)} className="text-red-600 hover:underline">Устгах</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<p className="text-zinc-500">Ачаалж байна...</p>}><AdminSchoolDetail /></Suspense>;
}
