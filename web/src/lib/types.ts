export type UserRole = "parent" | "worker" | "admin";
export type ShiftStatus = "open" | "accepted" | "in_progress" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface User {
  id: number;
  phone: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  rating_avg: number;
  rating_count: number;
}

export interface UserPublic {
  id: number;
  full_name: string;
  avatar_url: string | null;
  rating_avg: number;
  rating_count: number;
}

export interface School {
  id: number;
  name: string;
  district: string | null;
  khoroo: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  crossing_count: number;
}

export interface Crossing {
  id: number;
  school_id: number;
  name: string;
  description: string | null;
  lat: number;
  lng: number;
  checkin_radius_m: number;
  school: School | null;
}

export interface Shift {
  id: number;
  parent_id: number;
  worker_id: number | null;
  crossing_id: number;
  shift_date: string;
  start_time: string;
  duration_minutes: number;
  price: number;
  notes: string | null;
  status: ShiftStatus;
  checked_in_at: string | null;
  checked_out_at: string | null;
  created_at: string;
  crossing: Crossing | null;
  parent: UserPublic | null;
  worker: UserPublic | null;
}

export interface Payment {
  id: number;
  shift_id: number;
  amount: number;
  platform_fee: number;
  provider: string;
  provider_invoice_id: string | null;
  qr_text: string | null;
  qr_image: string | null;
  deeplinks: string | null;
  status: PaymentStatus;
  paid_at: string | null;
}

export const STATUS_LABEL: Record<ShiftStatus, string> = {
  open: "Нээлттэй",
  accepted: "Авсан",
  in_progress: "Явагдаж байна",
  completed: "Дууссан",
  cancelled: "Цуцлагдсан",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  parent: "Эцэг эх",
  worker: "Гүйцэтгэгч",
  admin: "Админ",
};
