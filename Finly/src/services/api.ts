import Constants from "expo-constants";
import { Platform } from "react-native";

const FALLBACK_PORT = "3000";

function resolveApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
  if (configuredUrl) {
    return configuredUrl;
  }

  if (Platform.OS === "android") {
    return `http://10.0.2.2:${FALLBACK_PORT}`;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:${FALLBACK_PORT}`;
  }

  return `http://localhost:${FALLBACK_PORT}`;
}

export const API_BASE_URL = resolveApiBaseUrl();

export async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data && typeof data.erro === "string" ? data.erro : "Erro na API";
    throw new Error(message);
  }

  return data as T;
}
