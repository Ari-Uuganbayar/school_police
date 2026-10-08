"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Crossing } from "@/lib/types";
import { Alert, Field, btnCls, inputCls } from "@/components/ui";

export default function NewShiftPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [crossings, setCrossings] = useState<Crossing[]>([]);
  const [form, setForm] = useState({ crossing_id: 0, shift_date: "", start_time: "07:30", duration_minutes: 60, price: 15000, notes: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "parent")) router.replace("/shifts");
  }, [user, loading, router]);

  useEffect(() => {
    api.crossings.list().then(cs => { setCrossings(cs); if (cs[0]) setForm(f => ({ ...f, crossing_id: cs[0].id })); });
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === "number" || k === "crossing_id" ? Number(e.target.value) : e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const s = await api.shifts.create({ ...form, notes: form.notes || undefined });
      router.push(`/shifts/${s.id}`);
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-lg space-y-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-bold">Шинэ ээлж захиалах</h1>
      {err && <Alert>{err}</Alert>}
      <Field label="Сургууль / гарц">
        <select className={inputCls} value={form.crossing_id} onChange={set("crossing_id")} required>
          {crossings.map(c => <option key={c.id} value={c.id}>{c.school?.name} — {c.name}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Огноо"><input className={inputCls} type="date" value={form.shift_date} onChange={set("shift_date")} required /></Field>
        <Field label="Эхлэх цаг"><input className={inputCls} type="time" value={form.start_time} onChange={set("start_time")} required /></Field>
        <Field label="Үргэлжлэх хугацаа (мин)"><input className={inputCls} type="number" min={15} max={480} step={15} value={form.duration_minutes} onChange={set("duration_minutes")} required /></Field>
        <Field label="Үнэ (₮)"><input className={inputCls} type="number" min={1000} step={500} value={form.price} onChange={set("price")} required /></Field>
      </div>
      <Field label="Нэмэлт тэмдэглэл"><textarea className={inputCls} rows={3} value={form.notes} onChange={set("notes")} placeholder="Жишээ: улбар шар хантааз өмсөнө үү" /></Field>
      <button className={`${btnCls} w-full`} disabled={busy || !form.crossing_id}>{busy ? "..." : "Захиалах"}</button>
    </form>
  );
}
