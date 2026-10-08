import { Link } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { useAuth } from "../../lib/auth";
import { Button, ErrorText, Input, colors } from "../../lib/ui";

export default function Login() {
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr(""); setBusy(true);
    try { await login(phone, password); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "center", padding: 24, gap: 14, backgroundColor: colors.bg }}>
      <Text style={{ fontSize: 32, textAlign: "center" }}>🚸</Text>
      <Text style={{ fontSize: 24, fontWeight: "700", textAlign: "center" }}>School Police</Text>
      <ErrorText msg={err} />
      <Input label="Утасны дугаар" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoCapitalize="none" />
      <Input label="Нууц үг" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Нэвтрэх" onPress={submit} loading={busy} />
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}>
        <Text style={{ color: colors.muted }}>Бүртгэлгүй юу?</Text>
        <Link href="/(auth)/register" style={{ color: colors.primaryDark, fontWeight: "600" }}>Бүртгүүлэх</Link>
      </View>
    </KeyboardAvoidingView>
  );
}
