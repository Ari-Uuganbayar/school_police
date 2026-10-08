import type { Crossing, Payment, School, Shift, User } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const TOKEN_KEY = "sp_token";

export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** FastAPI-ийн detail: string эсвэл pydantic-ийн [{loc, msg}] жагсаалт. */
function formatDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map(e => {
      const field = Array.isArray(e.loc) ? e.loc.filter((x: unknown) => x !== "body").join(".") : "";
      return field ? `${field}: ${e.msg}` : String(e.msg);
    }).join("; ");
  }
  return JSON.stringify(detail);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(init.headers as Record<string, string>) };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      msg = formatDetail(body.detail);
    } catch {}
    throw new ApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

const get = <T>(p: string) => request<T>(p);
const post = <T>(p: string, body?: unknown) => request<T>(p, { method: "POST", body: body ? JSON.stringify(body) : undefined });
const patch = <T>(p: string, body: unknown) => request<T>(p, { method: "PATCH", body: JSON.stringify(body) });
const del = (p: string) => request<void>(p, { method: "DELETE" });

export interface AuthResponse { access_token: string; user: User }
export interface SchoolInput { name: string; district?: string | null; khoroo?: string | null; address?: string | null; lat?: number | null; lng?: number | null }
export interface CrossingInput { name: string; description?: string | null; lat: number; lng: number; checkin_radius_m: number }

export const api = {
  auth: {
    login: (phone: string, password: string) => post<AuthResponse>("/auth/login", { phone, password }),
    register: (d: { phone: string; full_name: string; password: string; role: "parent" | "worker" }) =>
      post<AuthResponse>("/auth/register", d),
    me: () => get<User>("/auth/me"),
  },
  schools: {
    list: (q?: string) => get<School[]>(`/schools${q ? `?q=${encodeURIComponent(q)}` : ""}`),
    get: (id: number) => get<School>(`/schools/${id}`),
    create: (d: SchoolInput) => post<School>("/schools", d),
    update: (id: number, d: Partial<SchoolInput>) => patch<School>(`/schools/${id}`, d),
    remove: (id: number) => del(`/schools/${id}`),
  },
  crossings: {
    list: (school_id?: number) => get<Crossing[]>(`/crossings${school_id ? `?school_id=${school_id}` : ""}`),
    create: (d: CrossingInput & { school_id: number }) => post<Crossing>("/crossings", d),
    update: (id: number, d: Partial<CrossingInput>) => patch<Crossing>(`/crossings/${id}`, d),
    remove: (id: number) => del(`/crossings/${id}`),
  },
  shifts: {
    list: (params: { mine?: boolean; status?: string } = {}) => {
      const q = new URLSearchParams();
      if (params.mine) q.set("mine", "true");
      if (params.status) q.set("status_", params.status);
      const s = q.toString();
      return get<Shift[]>(`/shifts${s ? `?${s}` : ""}`);
    },
    get: (id: number) => get<Shift>(`/shifts/${id}`),
    create: (d: { crossing_id: number; shift_date: string; start_time: string; duration_minutes: number; price: number; notes?: string }) =>
      post<Shift>("/shifts", d),
    update: (id: number, d: Partial<{ shift_date: string; start_time: string; duration_minutes: number; price: number; notes: string }>) =>
      patch<Shift>(`/shifts/${id}`, d),
    accept: (id: number) => post<Shift>(`/shifts/${id}/accept`),
    checkin: (id: number, lat: number, lng: number) => post<Shift>(`/shifts/${id}/checkin`, { lat, lng }),
    checkout: (id: number) => post<Shift>(`/shifts/${id}/checkout`),
    cancel: (id: number) => post<Shift>(`/shifts/${id}/cancel`),
  },
  payments: {
    invoice: (shiftId: number) => post<Payment>(`/payments/shifts/${shiftId}/invoice`),
    get: (shiftId: number) => get<Payment>(`/payments/shifts/${shiftId}`),
    check: (shiftId: number) => post<Payment>(`/payments/shifts/${shiftId}/check`),
  },
  reviews: {
    create: (d: { shift_id: number; rating: number; comment?: string }) => post(`/reviews`, d),
  },
};

export const fmtMNT = (n: number) => `${n.toLocaleString("mn-MN")}₮`;
export const fmtTime = (t: string) => t.slice(0, 5);
