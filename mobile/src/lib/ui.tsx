import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import type { ShiftStatus } from "./types";
import { STATUS_LABEL } from "./types";

export const colors = { primary: "#f59e0b", primaryDark: "#d97706", bg: "#fafafa", card: "#fff", border: "#e4e4e7", text: "#18181b", muted: "#71717a", danger: "#dc2626" };

export function Button({ title, onPress, variant = "primary", disabled, loading }: { title: string; onPress: () => void; variant?: "primary" | "secondary" | "danger"; disabled?: boolean; loading?: boolean }) {
  const bg = variant === "primary" ? colors.primary : variant === "danger" ? colors.danger : colors.card;
  const fg = variant === "secondary" ? colors.text : "#fff";
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [s.btn, { backgroundColor: bg, borderWidth: variant === "secondary" ? 1 : 0, opacity: disabled || loading ? 0.5 : pressed ? 0.85 : 1 }]}>
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[s.btnText, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

export function Input({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} {...props} style={s.input} />
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function ErrorText({ msg }: { msg: string }) {
  return msg ? <Text style={s.error}>{msg}</Text> : null;
}

const STATUS_COLOR: Record<ShiftStatus, [string, string]> = {
  open: ["#d1fae5", "#065f46"], accepted: ["#dbeafe", "#1e40af"], in_progress: ["#fef3c7", "#92400e"],
  completed: ["#e4e4e7", "#3f3f46"], cancelled: ["#fee2e2", "#991b1b"],
};
export function StatusBadge({ status }: { status: ShiftStatus }) {
  const [bg, fg] = STATUS_COLOR[status];
  return <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}><Text style={{ color: fg, fontSize: 12, fontWeight: "600" }}>{STATUS_LABEL[status]}</Text></View>;
}

const s = StyleSheet.create({
  btn: { borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center", borderColor: colors.border },
  btnText: { fontWeight: "600", fontSize: 15 },
  label: { fontSize: 13, fontWeight: "500", color: colors.text },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: colors.card, color: colors.text },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 8 },
  error: { color: colors.danger, backgroundColor: "#fef2f2", padding: 10, borderRadius: 8, fontSize: 14 },
});
