import { Link, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { api, fmtMNT, fmtTime } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import type { Shift } from "../../../lib/types";
import { Button, Card, ErrorText, StatusBadge, colors } from "../../../lib/ui";

export default function ShiftsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const isParent = user?.role === "parent";
  const [tab, setTab] = useState<"open" | "mine">(isParent ? "mine" : "open");
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setRefreshing(true); setErr("");
    try { setShifts(await api.shifts.list(tab === "mine")); } catch (e) { setErr((e as Error).message); } finally { setRefreshing(false); }
  }, [tab]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", padding: 12, gap: 8 }}>
        {!isParent && <Tab label="Нээлттэй" active={tab === "open"} onPress={() => setTab("open")} />}
        <Tab label="Миний ээлжүүд" active={tab === "mine"} onPress={() => setTab("mine")} />
      </View>
      {err ? <View style={{ paddingHorizontal: 12 }}><ErrorText msg={err} /></View> : null}
      <FlatList
        data={shifts}
        keyExtractor={s => String(s.id)}
        contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={!refreshing ? <Text style={{ textAlign: "center", color: colors.muted, marginTop: 40 }}>Ээлж алга</Text> : null}
        renderItem={({ item: s }) => (
          <Link href={{ pathname: "/(app)/shifts/[id]", params: { id: String(s.id) } }} asChild>
            <Pressable>
              <Card>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", fontSize: 16 }}>{s.crossing?.school?.name}</Text>
                    <Text style={{ color: colors.muted }}>{s.crossing?.name}</Text>
                  </View>
                  <StatusBadge status={s.status} />
                </View>
                <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
                  <Text>📅 {s.shift_date}</Text>
                  <Text>🕖 {fmtTime(s.start_time)} · {s.duration_minutes} мин</Text>
                  <Text style={{ fontWeight: "700", color: colors.primaryDark }}>{fmtMNT(s.price)}</Text>
                </View>
              </Card>
            </Pressable>
          </Link>
        )}
      />
      {isParent && (
        <View style={{ position: "absolute", bottom: 24, left: 16, right: 16 }}>
          <Button title="+ Ээлж захиалах" onPress={() => router.push("/(app)/shifts/new")} />
        </View>
      )}
    </View>
  );
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: active ? colors.primary : colors.card, borderWidth: 1, borderColor: active ? colors.primary : colors.border }}>
      <Text style={{ color: active ? "#fff" : colors.text, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}
