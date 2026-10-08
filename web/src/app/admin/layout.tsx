import { AdminShell } from "@/components/AdminShell";

// Админ хэсэг нэвтрэлтээс хамаарч child-аа нуудаг тул instant-navigation validation-аас хасна.
export const instant = false;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
