"use client";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { api, fmtMNT, fmtTime } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Payment, Shift } from "@/lib/types";
import { Alert, StatusBadge, btnCls, btnSecondaryCls, inputCls } from "@/components/ui";

function ShiftDetail() {
  const { id } = useParams<{ id: string }>();
  const shiftId = Number(id);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [shift, setShift] = useState<Shift | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewed, setReviewed] = useState(false);

  const load = useCallback(async () => {
    const s = await api.shifts.get(shiftId);
    setShift(s);
    if (s.status === "completed" || s.status === "in_progress") {
      api.payments.get(shiftId).then(setPayment).catch(() => setPayment(null));
    }
  }, [shiftId]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (user) load().catch(e => setErr(e.message));
  }, [user, loading, router, load]);

  async function run(fn: () => Promise<unknown>, okMsg?: string) {
    setErr(""); setInfo(""); setBusy(true);
    try { await fn(); await load(); if (okMsg) setInfo(okMsg); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  function checkin() {
    if (!navigator.geolocation) return setErr("Энэ төхөөрөмж байршил дэмжихгүй байна");
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      pos => run(() => api.shifts.checkin(shiftId, pos.coords.latitude, pos.coords.longitude), "Check-in амжилттай"),
      e => { setErr(`Байршил авч чадсангүй: ${e.message}`); setBusy(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  if (!user || !shift) return err ? <Alert>{err}</Alert> : <p className="text-zinc-500">Ачаалж байна...</p>;

  const isParent = shift.parent_id === user.id;
  const isWorker = shift.worker_id === user.id;
  const deeplinks: { name: string; link: string }[] = payment?.deeplinks ? JSON.parse(payment.deeplinks) : [];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{shift.crossing?.school?.name}</h1>
            <p className="text-zinc-600 dark:text-zinc-400">{shift.crossing?.name}</p>
          </div>
          <StatusBadge status={shift.status} />
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Item k="Огноо" v={shift.shift_date} />
          <Item k="Эхлэх" v={fmtTime(shift.start_time)} />
          <Item k="Хугацаа" v={`${shift.duration_minutes} мин`} />
          <Item k="Үнэ" v={fmtMNT(shift.price)} />
          <Item k="Захиалагч" v={shift.parent?.full_name ?? "-"} />
          <Item k="Гүйцэтгэгч" v={shift.worker ? `${shift.worker.full_name} ⭐${shift.worker.rating_avg}` : "Хүлээгдэж байна"} />
          {shift.checked_in_at && <Item k="Check-in" v={new Date(shift.checked_in_at).toLocaleTimeString("mn-MN")} />}
          {shift.checked_out_at && <Item k="Check-out" v={new Date(shift.checked_out_at).toLocaleTimeString("mn-MN")} />}
        </dl>
        {shift.notes && <p className="mt-4 rounded bg-zinc-50 p-3 text-sm dark:bg-zinc-800">{shift.notes}</p>}
        {shift.crossing && (
          <a target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-amber-600 underline"
            href={`https://www.google.com/maps?q=${shift.crossing.lat},${shift.crossing.lng}`}>Газрын зураг дээр харах</a>
        )}
      </div>

      {err && <Alert>{err}</Alert>}
      {info && <Alert kind="info">{info}</Alert>}

      <div className="flex flex-wrap gap-2">
        {user.role === "worker" && shift.status === "open" && <button className={btnCls} disabled={busy} onClick={() => run(() => api.shifts.accept(shiftId), "Ээлжийг авлаа")}>Ээлж авах</button>}
        {isWorker && shift.status === "accepted" && <button className={btnCls} disabled={busy} onClick={checkin}>📍 Check-in (гарц дээр)</button>}
        {isWorker && shift.status === "in_progress" && <button className={btnCls} disabled={busy} onClick={() => run(() => api.shifts.checkout(shiftId), "Ээлж дууслаа")}>Check-out</button>}
        {isWorker && shift.status === "accepted" && <button className={btnSecondaryCls} disabled={busy} onClick={() => run(() => api.shifts.cancel(shiftId))}>Татгалзах</button>}
        {isParent && (shift.status === "open" || shift.status === "accepted") && <button className={btnSecondaryCls} disabled={busy} onClick={() => confirm("Ээлжийг цуцлах уу?") && run(() => api.shifts.cancel(shiftId))}>Цуцлах</button>}
      </div>

      {isParent && shift.status === "completed" && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-semibold">Төлбөр</h2>
          {payment?.status === "paid" ? (
            <p className="mt-2 text-emerald-700">✅ {fmtMNT(payment.amount)} төлөгдсөн</p>
          ) : payment ? (
            <div className="mt-3 space-y-3 text-sm">
              <p>Дүн: <b>{fmtMNT(payment.amount)}</b> (үүнээс платформын шимтгэл {fmtMNT(payment.platform_fee)})</p>
              {payment.qr_image && <img alt="QPay QR" className="h-48 w-48 rounded border" src={`data:image/png;base64,${payment.qr_image}`} />}
              {deeplinks.length > 0 && (
                <div className="flex flex-wrap gap-2">{deeplinks.map(d => <a key={d.link} href={d.link} className={btnSecondaryCls}>{d.name}</a>)}</div>
              )}
              <button className={btnCls} disabled={busy} onClick={() => run(() => api.payments.check(shiftId))}>Төлбөр шалгах</button>
            </div>
          ) : (
            <button className={`${btnCls} mt-3`} disabled={busy} onClick={() => run(() => api.payments.invoice(shiftId))}>QPay нэхэмжлэх үүсгэх</button>
          )}
        </div>
      )}

      {(isParent || isWorker) && shift.status === "completed" && !reviewed && (
        <form className="space-y-3 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
          onSubmit={e => { e.preventDefault(); run(() => api.reviews.create({ shift_id: shiftId, rating, comment: comment || undefined }).then(() => setReviewed(true)), "Үнэлгээ илгээгдлээ"); }}>
          <h2 className="font-semibold">{isParent ? "Гүйцэтгэгчийг үнэлэх" : "Захиалагчийг үнэлэх"}</h2>
          <div className="flex gap-1 text-2xl">
            {[1, 2, 3, 4, 5].map(n => <button type="button" key={n} onClick={() => setRating(n)} className={n <= rating ? "text-amber-500" : "text-zinc-300"}>★</button>)}
          </div>
          <textarea className={inputCls} rows={2} placeholder="Сэтгэгдэл" value={comment} onChange={e => setComment(e.target.value)} />
          <button className={btnCls} disabled={busy}>Илгээх</button>
        </form>
      )}
    </div>
  );
}

export default function ShiftDetailPage() {
  return <Suspense fallback={<p className="text-zinc-500">Ачаалж байна...</p>}><ShiftDetail /></Suspense>;
}

function Item({ k, v }: { k: string; v: string }) {
  return <div><dt className="text-zinc-500">{k}</dt><dd className="font-medium">{v}</dd></div>;
}
