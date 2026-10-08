"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Тойм" },
  { href: "/admin/schools", label: "Сургууль, гарц" },
];

function SideNav() {
  const pathname = usePathname();
  return (
    <aside className="space-y-1 md:border-r md:border-zinc-200 md:pr-4 dark:md:border-zinc-800">
      <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Админ самбар</div>
      {NAV.map(n => {
        const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
        return (
          <Link key={n.href} href={n.href} className={`block rounded px-2 py-1.5 text-sm ${active ? "bg-amber-100 font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" : "hover:bg-zinc-100 dark:hover:bg-zinc-900"}`}>
            {n.label}
          </Link>
        );
      })}
    </aside>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace(user ? "/shifts" : "/login");
  }, [user, loading, router]);

  if (!user || user.role !== "admin") return null;

  return (
    <div className="grid gap-6 md:grid-cols-[180px_1fr]">
      <Suspense fallback={<aside />}><SideNav /></Suspense>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
