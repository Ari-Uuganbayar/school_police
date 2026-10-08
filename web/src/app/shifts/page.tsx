"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, fmtMNT, fmtTime } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Shift } from "@/lib/types";
import { Alert, StatusBadge } from "@/components/ui";

export default function ShiftsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tabChoice, setTab] = useState<"open" | "mine" | null>(null);
  const tab = tabChoice ?? (user?.role === "parent" ? "mine" : "open");
  // Үр дүнг tab-аар нь хадгална: tab солиход хуучин жагсаалт, алдаа харагдахгүй
  const [result, setResult] = useState<{ tab: string; shifts?: Shift[]; err?: string } | null>(null);
  const shifts = result?.tab === tab ? result.shifts ?? null : null;
  const err = result?.tab === tab ? result.err ?? "" : "";

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    api.shifts.list({ mine: tab === "mine" })
      .then(r => active && setResult({ tab, shifts: r }))
      .catch(e => active && setResult({ tab, err: e.message }));
    return () => { active = false; };
  }, [user, tab]);

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ээлжүүд</h1>
        <div className="flex gap-1 rounded border border-zinc-200 p-0.5 text-sm dark:border-zinc-800">
          {user.role !== "parent" && <TabBtn active={tab === "open"} onClick={() => setTab("open")}>Нээлттэй</TabBtn>}
          <TabBtn active={tab === "mine"} onClick={() => setTab("mine")}>Миний ээлжүүд</TabBtn>
        </div>
      </div>
      {err && <Alert>{err}</Alert>}
      {shifts === null ? <p className="text-zinc-500">Ачаалж байна...</p> : shifts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-700">
          Ээлж алга. {user.role === "parent" && <Link href="/shifts/new" className="text-amber-600 underline">Шинэ ээлж захиалах</Link>}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {shifts.map(s => (
            <li key={s.id}>
              <Link href={`/shifts/${s.id}`} className="block rounded-lg border border-zinc-200 bg-white p-4 hover:border-amber-400 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{s.crossing?.school?.name}</div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">{s.crossing?.name}</div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span>📅 {s.shift_date}</span>
                  <span>🕖 {fmtTime(s.start_time)} · {s.duration_minutes} мин</span>
                  <span className="font-semibold text-amber-700">{fmtMNT(s.price)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`rounded px-3 py-1 ${active ? "bg-amber-500 text-white" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}>{children}</button>;
}
