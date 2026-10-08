import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { api } from "../../../lib/api";
import type { Crossing } from "../../../lib/types";
import { DateTimeField, toDateStr, toTimeStr } from "../../../lib/DateTimeField";
import { Button, ErrorText, Input, colors } from "../../../lib/ui";

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const tomorrowAt = (h: number, m: number) => { const d = startOfToday(); d.setDate(d.getDate() + 1); d.setHours(h, m); return d; };

export default function NewShift() {
  const router = useRouter();
  const [crossings, setCrossings] = useState<Crossing[]>([]);
  const [crossingId, setCrossingId] = useState<number | null>(null);
  const [date, setDate] = useState(tomorrowAt(7, 30));
  const [time, setTime] = useState(tomorrowAt(7, 30));
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("15000");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.crossings.list().then(cs => { setCrossings(cs); setCrossingId(cs[0]?.id ?? null); }).catch(e => setErr(e.message)); }, []);

  async function submit() {
    if (!crossingId) return;
    setErr(""); setBusy(true);
    try {
      const s = await api.shifts.create({ crossing_id: crossingId, shift_date: toDateStr(date), start_time: toTimeStr(time), duration_minutes: Number(duration), price: Number(price), notes: notes || undefined });
      router.replace({ pathname: "/(app)/shifts/[id]", params: { id: String(s.id) } });
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
      <ErrorText msg={err} />
      <Text style={{ fontWeight: "500", fontSize: 13 }}>Сургууль / гарц</Text>
      <View style={{ gap: 6 }}>
        {crossings.map(c => (
          <Pressable key={c.id} onPress={() => setCrossingId(c.id)} style={{ padding: 12, borderRadius: 8, borderWidth: 1, borderColor: crossingId === c.id ? colors.primary : colors.border, backgroundColor: crossingId === c.id ? "#fffbeb" : colors.card }}>
            <Text style={{ fontWeight: "600" }}>{c.school?.name}</Text>
            <Text style={{ color: colors.muted }}>{c.name}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}><DateTimeField label="Огноо" mode="date" value={date} onChange={setDate} minimumDate={startOfToday()} /></View>
        <View style={{ flex: 1 }}><DateTimeField label="Эхлэх цаг" mode="time" value={time} onChange={setTime} /></View>
      </View>
      <Input label="Үргэлжлэх хугацаа (мин)" value={duration} onChangeText={setDuration} keyboardType="number-pad" />
      <Input label="Үнэ (₮)" value={price} onChangeText={setPrice} keyboardType="number-pad" />
      <Input label="Нэмэлт тэмдэглэл" value={notes} onChangeText={setNotes} multiline />
      <Button title="Захиалах" onPress={submit} loading={busy} disabled={!crossingId} />
    </ScrollView>
  );
}
