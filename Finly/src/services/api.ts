import Constants from "expo-constants";
import { Platform } from "react-native";

const FALLBACK_PORT = "3000";

function resolveApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
  if (configuredUrl) {
    return configuredUrl;
  }


  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:${FALLBACK_PORT}`;
  }

  return `http://localhost:${FALLBACK_PORT}`;
}

export const API_BASE_URL = resolveApiBaseUrl();

const REQUEST_TIMEOUT_MS = 8000;

export async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
      signal: controller.signal,
      ...options,
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        data && typeof data.erro === "string" ? data.erro : "Erro na API";
      throw new Error(message);
    }

    return data as T;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Tempo de resposta excedido. Verifique sua conexão.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
