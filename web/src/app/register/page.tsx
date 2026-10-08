"use client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Alert, Field, btnCls, inputCls } from "@/components/ui";

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState<"parent" | "worker">(params.get("role") === "worker" ? "worker" : "parent");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try { await register({ phone, full_name: fullName, password, role }); router.push("/shifts"); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-10 max-w-sm space-y-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-bold">Бүртгүүлэх</h1>
      {err && <Alert>{err}</Alert>}
      <div className="grid grid-cols-2 gap-2">
        {(["parent", "worker"] as const).map(r => (
          <button type="button" key={r} onClick={() => setRole(r)}
            className={`rounded border px-3 py-2 text-sm ${role === r ? "border-amber-500 bg-amber-50 font-medium text-amber-700" : "border-zinc-300 dark:border-zinc-700"}`}>
            {r === "parent" ? "Эцэг эх" : "Гүйцэтгэгч"}
          </button>
        ))}
      </div>
      <Field label="Овог нэр"><input className={inputCls} value={fullName} onChange={e => setFullName(e.target.value)} required /></Field>
      <Field label="Утасны дугаар"><input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" required /></Field>
      <Field label="Нууц үг (6+ тэмдэгт)"><input className={inputCls} type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required /></Field>
      <button className={`${btnCls} w-full`} disabled={busy}>{busy ? "..." : "Бүртгүүлэх"}</button>
      <p className="text-center text-sm text-zinc-500">Бүртгэлтэй юу? <Link href="/login" className="text-amber-600 underline">Нэвтрэх</Link></p>
    </form>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
