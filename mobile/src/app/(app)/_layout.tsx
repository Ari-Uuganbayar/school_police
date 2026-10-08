import { Stack } from "expo-router";
import { Pressable, Text } from "react-native";
import { useAuth } from "../../lib/auth";
import { colors } from "../../lib/ui";

export default function AppLayout() {
  const { logout } = useAuth();
  return (
    <Stack screenOptions={{ headerTintColor: colors.primaryDark, headerTitleStyle: { fontWeight: "700", color: colors.text }, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="shifts/index" options={{ title: "Ээлжүүд", headerRight: () => <Pressable onPress={logout}><Text style={{ color: colors.muted }}>Гарах</Text></Pressable> }} />
      <Stack.Screen name="shifts/new" options={{ title: "Шинэ ээлж", presentation: "modal" }} />
      <Stack.Screen name="shifts/[id]" options={{ title: "Ээлж" }} />
    </Stack>
  );
}
