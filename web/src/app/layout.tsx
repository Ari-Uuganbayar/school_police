import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "School Police",
  description: "Сургуулийн замын гарцын ээлж захиалгын систем",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <AuthProvider>
          <Nav />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
