"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Alert, Field, btnCls, inputCls } from "@/components/ui";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try { await login(phone, password); router.push("/shifts"); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-10 max-w-sm space-y-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-bold">Нэвтрэх</h1>
      {err && <Alert>{err}</Alert>}
      <Field label="Утасны дугаар"><input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" required /></Field>
      <Field label="Нууц үг"><input className={inputCls} type="password" value={password} onChange={e => setPassword(e.target.value)} required /></Field>
      <button className={`${btnCls} w-full`} disabled={busy}>{busy ? "..." : "Нэвтрэх"}</button>
      <p className="text-center text-sm text-zinc-500">Бүртгэлгүй юу? <Link href="/register" className="text-amber-600 underline">Бүртгүүлэх</Link></p>
    </form>
  );
}
