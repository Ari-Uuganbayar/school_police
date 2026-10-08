import { Redirect, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../lib/auth";
import { colors } from "../lib/ui";

function Gate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const inAuth = segments[0] === "(auth)";
  if (loading) return <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator color={colors.primary} size="large" /></View>;
  if (!user && !inAuth) return <Redirect href="/(auth)/login" />;
  if (user && inAuth) return <Redirect href="/(app)/shifts" />;
  return (
    <Stack screenOptions={{ headerTintColor: colors.primaryDark, headerTitleStyle: { fontWeight: "700" }, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Gate />
    </AuthProvider>
  );
}
