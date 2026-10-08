import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Button, colors } from "./ui";

type Mode = "date" | "time";

export const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const toTimeStr = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

const WEEKDAYS = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];
const fmtDateLabel = (d: Date) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} (${WEEKDAYS[d.getDay()]})`;

/**
 * Огноо/цаг сонгох талбар. Android дээр системийн dialog, iOS дээр modal дотор spinner гаргана.
 */
export function DateTimeField({ label, mode, value, onChange, minimumDate }: {
  label: string; mode: Mode; value: Date; onChange: (d: Date) => void; minimumDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const display = mode === "date" ? fmtDateLabel(value) : toTimeStr(value);

  function onAndroidChange(e: DateTimePickerEvent, d?: Date) {
    setOpen(false);
    if (e.type === "set" && d) onChange(d);
  }

  return (
    <View style={{ gap: 4 }}>
      <Text style={s.label}>{label}</Text>
      <Pressable onPress={() => { setDraft(value); setOpen(true); }} style={({ pressed }) => [s.field, pressed && { opacity: 0.7 }]}>
        <Text style={s.value}>{display}</Text>
        <Text style={{ color: colors.muted }}>{mode === "date" ? "📅" : "🕖"}</Text>
      </Pressable>

      {open && Platform.OS === "android" && (
        <DateTimePicker value={value} mode={mode} is24Hour minimumDate={minimumDate} onChange={onAndroidChange} />
      )}

      {Platform.OS === "ios" && (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={s.backdrop} onPress={() => setOpen(false)} />
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>{label}</Text>
            <DateTimePicker
              value={draft}
              mode={mode}
              display="spinner"
              is24Hour
              minuteInterval={mode === "time" ? 5 : undefined}
              minimumDate={minimumDate}
              locale="mn-MN"
              onChange={(_, d) => d && setDraft(d)}
              style={{ alignSelf: "stretch" }}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Button title="Болих" variant="secondary" onPress={() => setOpen(false)} /></View>
              <View style={{ flex: 1 }}><Button title="Сонгох" onPress={() => { onChange(draft); setOpen(false); }} /></View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "500", color: colors.text },
  field: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, backgroundColor: colors.card },
  value: { fontSize: 15, color: colors.text },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 32, gap: 12 },
  sheetTitle: { fontWeight: "700", fontSize: 16, textAlign: "center" },
});
