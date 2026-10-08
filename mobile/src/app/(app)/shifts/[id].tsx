import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Image, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { api, fmtMNT, fmtTime } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import type { Payment, Shift } from "../../../lib/types";
import { Button, Card, ErrorText, Input, StatusBadge, colors } from "../../../lib/ui";

export default function ShiftDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shiftId = Number(id);
  const { user } = useAuth();
  const [shift, setShift] = useState<Shift | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewed, setReviewed] = useState(false);

  const load = useCallback(
    () => api.shifts.get(shiftId).then(s => {
      setShift(s);
      if (s.status === "completed") api.payments.get(shiftId).then(setPayment).catch(() => setPayment(null));
    }),
    [shiftId],
  );

  useEffect(() => { load().catch(e => setErr(e.message)); }, [load]);

  async function run(fn: () => Promise<unknown>, ok?: string) {
    setErr(""); setBusy(true);
    try { await fn(); await load(); if (ok) Alert.alert(ok); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  async function checkin() {
    setErr(""); setBusy(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") throw new Error("Байршлын зөвшөөрөл олгоно уу");
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await api.shifts.checkin(shiftId, pos.coords.latitude, pos.coords.longitude);
      await load();
      Alert.alert("Check-in амжилттай");
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  if (!shift || !user) return <View style={{ padding: 16 }}><ErrorText msg={err} />{!err && <Text style={{ color: colors.muted }}>Ачаалж байна...</Text>}</View>;

  const isParent = shift.parent_id === user.id;
  const isWorker = shift.worker_id === user.id;
  const deeplinks: { name: string; link: string }[] = payment?.deeplinks ? JSON.parse(payment.deeplinks) : [];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "700" }}>{shift.crossing?.school?.name}</Text>
            <Text style={{ color: colors.muted }}>{shift.crossing?.name}</Text>
          </View>
          <StatusBadge status={shift.status} />
        </View>
        <Row k="Огноо" v={shift.shift_date} />
        <Row k="Эхлэх цаг" v={fmtTime(shift.start_time)} />
        <Row k="Хугацаа" v={`${shift.duration_minutes} мин`} />
        <Row k="Үнэ" v={fmtMNT(shift.price)} />
        <Row k="Захиалагч" v={shift.parent?.full_name ?? "-"} />
        <Row k="Гүйцэтгэгч" v={shift.worker ? `${shift.worker.full_name} ⭐${shift.worker.rating_avg}` : "Хүлээгдэж байна"} />
        {shift.notes ? <Text style={{ backgroundColor: colors.bg, padding: 10, borderRadius: 8 }}>{shift.notes}</Text> : null}
        {shift.crossing && (
          <Pressable onPress={() => Linking.openURL(`https://www.google.com/maps?q=${shift.crossing!.lat},${shift.crossing!.lng}`)}>
            <Text style={{ color: colors.primaryDark, textDecorationLine: "underline" }}>Газрын зураг дээр харах</Text>
          </Pressable>
        )}
      </Card>

      <ErrorText msg={err} />

      {user.role === "worker" && shift.status === "open" && <Button title="Ээлж авах" onPress={() => run(() => api.shifts.accept(shiftId), "Ээлжийг авлаа")} loading={busy} />}
      {isWorker && shift.status === "accepted" && <Button title="📍 Check-in (гарц дээр)" onPress={checkin} loading={busy} />}
      {isWorker && shift.status === "in_progress" && <Button title="Check-out" onPress={() => run(() => api.shifts.checkout(shiftId), "Ээлж дууслаа")} loading={busy} />}
      {isWorker && shift.status === "accepted" && <Button title="Татгалзах" variant="secondary" onPress={() => run(() => api.shifts.cancel(shiftId))} loading={busy} />}
      {isParent && (shift.status === "open" || shift.status === "accepted") && (
        <Button title="Цуцлах" variant="danger" onPress={() => Alert.alert("Ээлжийг цуцлах уу?", undefined, [{ text: "Үгүй" }, { text: "Тийм", style: "destructive", onPress: () => run(() => api.shifts.cancel(shiftId)) }])} loading={busy} />
      )}

      {isParent && shift.status === "completed" && (
        <Card>
          <Text style={{ fontWeight: "700" }}>Төлбөр</Text>
          {payment?.status === "paid" ? (
            <Text style={{ color: "#047857" }}>✅ {fmtMNT(payment.amount)} төлөгдсөн</Text>
          ) : payment ? (
            <View style={{ gap: 10 }}>
              <Text>Дүн: {fmtMNT(payment.amount)} (шимтгэл {fmtMNT(payment.platform_fee)})</Text>
              {payment.qr_image ? <Image source={{ uri: `data:image/png;base64,${payment.qr_image}` }} style={{ width: 180, height: 180, alignSelf: "center" }} /> : null}
              {deeplinks.map(d => <Button key={d.link} title={d.name} variant="secondary" onPress={() => Linking.openURL(d.link)} />)}
              <Button title="Төлбөр шалгах" onPress={() => run(() => api.payments.check(shiftId))} loading={busy} />
            </View>
          ) : (
            <Button title="QPay нэхэмжлэх үүсгэх" onPress={() => run(() => api.payments.invoice(shiftId))} loading={busy} />
          )}
        </Card>
      )}

      {(isParent || isWorker) && shift.status === "completed" && !reviewed && (
        <Card>
          <Text style={{ fontWeight: "700" }}>{isParent ? "Гүйцэтгэгчийг үнэлэх" : "Захиалагчийг үнэлэх"}</Text>
          <View style={{ flexDirection: "row", gap: 4 }}>
            {[1, 2, 3, 4, 5].map(n => <Pressable key={n} onPress={() => setRating(n)}><Text style={{ fontSize: 30, color: n <= rating ? colors.primary : colors.border }}>★</Text></Pressable>)}
          </View>
          <Input label="Сэтгэгдэл" value={comment} onChangeText={setComment} multiline />
          <Button title="Илгээх" onPress={() => run(() => api.reviews.create({ shift_id: shiftId, rating, comment: comment || undefined }).then(() => setReviewed(true)), "Үнэлгээ илгээгдлээ")} loading={busy} />
        </Card>
      )}
    </ScrollView>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={{ color: colors.muted }}>{k}</Text><Text style={{ fontWeight: "500" }}>{v}</Text></View>;
}
