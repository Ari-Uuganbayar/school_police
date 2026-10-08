"use client";
import { useState } from "react";
import type { CrossingInput } from "@/lib/api";
import { Alert, Field, btnCls, btnSecondaryCls, inputCls } from "@/components/ui";

export function CrossingForm({ initial, onSubmit, onCancel, submitLabel = "Хадгалах" }: {
  initial?: Partial<CrossingInput>; onSubmit: (d: CrossingInput) => Promise<void>; onCancel?: () => void; submitLabel?: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [lat, setLat] = useState(initial?.lat?.toString() ?? "");
  const [lng, setLng] = useState(initial?.lng?.toString() ?? "");
  const [radius, setRadius] = useState(String(initial?.checkin_radius_m ?? 100));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  function useMyLocation() {
    if (!navigator.geolocation) return setErr("Байршил дэмжихгүй байна");
    navigator.geolocation.getCurrentPosition(
      p => { setLat(p.coords.latitude.toFixed(6)); setLng(p.coords.longitude.toFixed(6)); },
      e => setErr(`Байршил авч чадсангүй: ${e.message}`),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      await onSubmit({ name: name.trim(), description: description || null, lat: Number(lat), lng: Number(lng), checkin_radius_m: Number(radius) });
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  const mapsHref = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null;

  return (
    <form onSubmit={submit} className="space-y-3">
      {err && <Alert>{err}</Alert>}
      <Field label="Гарцын нэр *"><input className={inputCls} value={name} onChange={e => setName(e.target.value)} required placeholder="Урд хаалганы гарц" /></Field>
      <Field label="Тайлбар"><input className={inputCls} value={description ?? ""} onChange={e => setDescription(e.target.value)} placeholder="Хаанаас хайх, онцлог" /></Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Өргөрөг (lat) *"><input className={inputCls} type="number" step="any" value={lat} onChange={e => setLat(e.target.value)} required /></Field>
        <Field label="Уртраг (lng) *"><input className={inputCls} type="number" step="any" value={lng} onChange={e => setLng(e.target.value)} required /></Field>
        <Field label="Check-in радиус (м)"><input className={inputCls} type="number" min={10} max={2000} value={radius} onChange={e => setRadius(e.target.value)} required /></Field>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button type="button" className={btnSecondaryCls} onClick={useMyLocation}>📍 Миний байршлыг авах</button>
        {mapsHref && <a href={mapsHref} target="_blank" rel="noreferrer" className="text-amber-600 underline">Газрын зураг дээр шалгах</a>}
      </div>
      <div className="flex gap-2">
        <button className={btnCls} disabled={busy}>{busy ? "..." : submitLabel}</button>
        {onCancel && <button type="button" className={btnSecondaryCls} onClick={onCancel}>Болих</button>}
      </div>
    </form>
  );
}
