import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Crossing, Payment, Shift, User } from "./types";

const BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000/api";
const TOKEN_KEY = "sp_token";
let cachedToken: string | null = null;

export const tokenStore = {
  load: async () => (cachedToken = await AsyncStorage.getItem(TOKEN_KEY)),
  set: async (t: string) => { cachedToken = t; await AsyncStorage.setItem(TOKEN_KEY, t); },
  clear: async () => { cachedToken = null; await AsyncStorage.removeItem(TOKEN_KEY); },
};

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
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
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cachedToken) headers.Authorization = `Bearer ${cachedToken}`;
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = formatDetail((await res.json()).detail); } catch {}
    throw new ApiError(res.status, msg);
  }
  return res.json();
}

const get = <T,>(p: string) => request<T>(p);
const post = <T,>(p: string, body?: unknown) => request<T>(p, { method: "POST", body: body ? JSON.stringify(body) : undefined });

export interface AuthResponse { access_token: string; user: User }

export const api = {
  auth: {
    login: (phone: string, password: string) => post<AuthResponse>("/auth/login", { phone, password }),
    register: (d: { phone: string; full_name: string; password: string; role: "parent" | "worker" }) => post<AuthResponse>("/auth/register", d),
    me: () => get<User>("/auth/me"),
  },
  crossings: { list: () => get<Crossing[]>("/crossings") },
  shifts: {
    list: (mine: boolean) => get<Shift[]>(`/shifts${mine ? "?mine=true" : ""}`),
    get: (id: number) => get<Shift>(`/shifts/${id}`),
    create: (d: { crossing_id: number; shift_date: string; start_time: string; duration_minutes: number; price: number; notes?: string }) => post<Shift>("/shifts", d),
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
  reviews: { create: (d: { shift_id: number; rating: number; comment?: string }) => post("/reviews", d) },
};

export const fmtMNT = (n: number) => `${n.toLocaleString("en-US")}₮`;
export const fmtTime = (t: string) => t.slice(0, 5);
