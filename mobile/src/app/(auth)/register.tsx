import { Link } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { useAuth } from "../../lib/auth";
import { Button, ErrorText, Input, colors } from "../../lib/ui";

export default function Register() {
  const { register } = useAuth();
  const [role, setRole] = useState<"parent" | "worker">("parent");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr(""); setBusy(true);
    try { await register({ phone, full_name: fullName, password, role }); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "center", padding: 24, gap: 14, backgroundColor: colors.bg }}>
      <Text style={{ fontSize: 24, fontWeight: "700", textAlign: "center" }}>Бүртгүүлэх</Text>
      <ErrorText msg={err} />
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(["parent", "worker"] as const).map(r => (
          <Pressable key={r} onPress={() => setRole(r)} style={{ flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, alignItems: "center", borderColor: role === r ? colors.primary : colors.border, backgroundColor: role === r ? "#fffbeb" : colors.card }}>
            <Text style={{ fontWeight: role === r ? "700" : "400", color: role === r ? colors.primaryDark : colors.text }}>{r === "parent" ? "Эцэг эх" : "Гүйцэтгэгч"}</Text>
          </Pressable>
        ))}
      </View>
      <Input label="Овог нэр" value={fullName} onChangeText={setFullName} />
      <Input label="Утасны дугаар" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Input label="Нууц үг (6+ тэмдэгт)" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Бүртгүүлэх" onPress={submit} loading={busy} />
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}>
        <Text style={{ color: colors.muted }}>Бүртгэлтэй юу?</Text>
        <Link href="/(auth)/login" style={{ color: colors.primaryDark, fontWeight: "600" }}>Нэвтрэх</Link>
      </View>
    </KeyboardAvoidingView>
  );
}
