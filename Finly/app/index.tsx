import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ONBOARDING_KEY } from "./onboarding";
import { Colors } from "@/constants/theme";

export default function Index() {
  return <Redirect href="/login" />;
}
