"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/types";

export function Nav() {
  const { user, logout } = useAuth();
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-amber-600">🚸 School Police</Link>
        <nav className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link href="/shifts" className="hover:underline">Ээлжүүд</Link>
              {user.role === "parent" && <Link href="/shifts/new" className="rounded bg-amber-500 px-3 py-1.5 font-medium text-white hover:bg-amber-600">+ Ээлж захиалах</Link>}
              <span className="text-zinc-500">{user.full_name} · {ROLE_LABEL[user.role]}</span>
              <button onClick={logout} className="text-zinc-500 hover:underline">Гарах</button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">Нэвтрэх</Link>
              <Link href="/register" className="rounded bg-amber-500 px-3 py-1.5 font-medium text-white hover:bg-amber-600">Бүртгүүлэх</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
