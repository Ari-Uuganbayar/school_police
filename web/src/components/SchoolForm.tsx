"use client";
import { useState } from "react";
import type { SchoolInput } from "@/lib/api";
import { Alert, Field, btnCls, btnSecondaryCls, inputCls } from "@/components/ui";

type FormState = { name: string; district: string; khoroo: string; address: string; lat: string; lng: string };
const EMPTY: FormState = { name: "", district: "", khoroo: "", address: "", lat: "", lng: "" };

export function SchoolForm({ initial, onSubmit, onCancel, submitLabel = "Хадгалах" }: {
  initial?: Partial<SchoolInput>; onSubmit: (d: SchoolInput) => Promise<void>; onCancel?: () => void; submitLabel?: string;
}) {
  const [f, setF] = useState<FormState>({
    ...EMPTY,
    name: initial?.name ?? "", district: initial?.district ?? "", khoroo: initial?.khoroo ?? "", address: initial?.address ?? "",
    lat: initial?.lat?.toString() ?? "", lng: initial?.lng?.toString() ?? "",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => setF(v => ({ ...v, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      await onSubmit({
        name: f.name.trim(),
        district: f.district || null, khoroo: f.khoroo || null, address: f.address || null,
        lat: f.lat === "" ? null : Number(f.lat),
        lng: f.lng === "" ? null : Number(f.lng),
      });
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {err && <Alert>{err}</Alert>}
      <Field label="Сургуулийн нэр *"><input className={inputCls} value={f.name} onChange={set("name")} required /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Дүүрэг"><input className={inputCls} value={f.district} onChange={set("district")} /></Field>
        <Field label="Хороо"><input className={inputCls} value={f.khoroo} onChange={set("khoroo")} /></Field>
      </div>
      <Field label="Хаяг"><input className={inputCls} value={f.address} onChange={set("address")} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Өргөрөг (lat)"><input className={inputCls} type="number" step="any" value={f.lat} onChange={set("lat")} placeholder="47.9195" /></Field>
        <Field label="Уртраг (lng)"><input className={inputCls} type="number" step="any" value={f.lng} onChange={set("lng")} placeholder="106.9177" /></Field>
      </div>
      <div className="flex gap-2">
        <button className={btnCls} disabled={busy}>{busy ? "..." : submitLabel}</button>
        {onCancel && <button type="button" className={btnSecondaryCls} onClick={onCancel}>Болих</button>}
      </div>
    </form>
  );
}
