import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ONBOARDING_KEY } from "./onboarding";
import { Colors } from "@/constants/theme";

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const done = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (done === "true") {
          router.replace("/(tabs)");
        } else {
          router.replace("/onboarding");
        }
      } catch {
        router.replace("/onboarding");
      } finally {
        setLoading(false);
      }
    }
    checkOnboarding();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
