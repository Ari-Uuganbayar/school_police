"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="space-y-10 py-10">
      <section className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">Сургуулийн гарцын ээлжээ хөлсөөр гүйцэтгүүлээрэй</h1>
        <p className="mx-auto max-w-2xl text-zinc-600 dark:text-zinc-400">
          Ажилтай эцэг эх ээлжийн өдөр, цаг, гарц, үнээ оруулаад захиална. Гүйцэтгэгч ээлжийг аваад,
          гарц дээр GPS-ээр баталгаажуулж, хүүхдүүдийг аюулгүй гаргаж өгнө.
        </p>
        <div className="flex justify-center gap-3">
          {user ? (
            <Link href="/shifts" className="rounded bg-amber-500 px-5 py-2.5 font-medium text-white hover:bg-amber-600">Ээлжүүд рүү</Link>
          ) : (
            <>
              <Link href="/register?role=parent" className="rounded bg-amber-500 px-5 py-2.5 font-medium text-white hover:bg-amber-600">Эцэг эхээр бүртгүүлэх</Link>
              <Link href="/register?role=worker" className="rounded border border-zinc-300 px-5 py-2.5 font-medium hover:bg-white dark:border-zinc-700">Гүйцэтгэгчээр бүртгүүлэх</Link>
            </>
          )}
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["1. Захиалах", "Гарц, огноо, цаг, үргэлжлэх хугацаа, үнээ оруулна."],
          ["2. Гүйцэтгэх", "Гүйцэтгэгч ээлжийг авч, гарц дээр ирээд check-in хийнэ."],
          ["3. Төлөх, үнэлэх", "QPay-ээр төлбөрөө төлж, гүйцэтгэгчээ үнэлнэ."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
