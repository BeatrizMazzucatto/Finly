import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { PhoneShell } from "@/components/PhoneShell";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider } from "@/src/context/AuthContext";
import { Colors } from "@/constants/theme";

export const unstable_settings = {
  anchor: "(tabs)",
};

// Tema personalizado Finly
const FinlyLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.textPrimary,
    border: Colors.border,
    notification: Colors.error,
  },
};

const FinlyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.primary,
    background: "#0F172A",
    card: "#1E293B",
    text: "#F8FAFC",
    border: "#334155",
    notification: Colors.error,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <PhoneShell>
        <ThemeProvider value={colorScheme === "dark" ? FinlyDarkTheme : FinlyLightTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="transaction-form"
              options={{
                presentation: "modal",
                headerShown: false,
              }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </PhoneShell>
    </AuthProvider>
  );
}