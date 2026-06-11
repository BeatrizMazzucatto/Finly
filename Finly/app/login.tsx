import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";

import { useAuth } from "@/src/context/AuthContext";

const ONBOARDING_KEY = "finly_onboarding_done";

export default function LoginScreen() {
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Consider GUEST_USER (id_usuario: 1) as not logged in
  if (!loading && user && user.id_usuario !== 1) {
    const hasCompletedOnboarding =
      user.id_carteira_pessoal &&
      (user.id_usuario === 1 || user.id_carteira_pessoal !== 1);

    if (hasCompletedOnboarding) {
      return <Redirect href="/(tabs)" />;
    } else {
      return <Redirect href="/onboarding" />;
    }
  }

  async function handleLogin() {
    if (!email.trim() || !senha.trim()) {
      setError("Preencha email e senha.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const loggedInUser = await login(email.trim(), senha);

      const hasCompletedOnboarding =
        loggedInUser.id_carteira_pessoal &&
        (loggedInUser.id_usuario === 1 || loggedInUser.id_carteira_pessoal !== 1);

      if (hasCompletedOnboarding) {
        await AsyncStorage.setItem(ONBOARDING_KEY, "true");
        router.replace("/(tabs)");
      } else {
        const onboardingDone = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (!onboardingDone) {
          router.replace("/onboarding");
        } else {
          router.replace("/(tabs)");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao entrar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", default: undefined })}
      style={styles.container}
    >
      <View style={styles.card}>
        <Image
          source={require("../assets/images/logoFinly.jpeg")}
          style={{ width: 120, height: 120, alignSelf: 'center', marginBottom: 16, borderRadius: 20 }}
          resizeMode="contain"
        />
        <Text style={styles.title}>Finly</Text>

        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor="#64748B"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Senha"
          placeholderTextColor="#64748B"
          secureTextEntry
          style={styles.input}
          value={senha}
          onChangeText={setSenha}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, submitting && styles.buttonDisabled]}
          disabled={submitting}
          onPress={handleLogin}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </Pressable>

        <View style={styles.linkRow}>
          <Pressable onPress={() => router.push('/forgot-password')}>
            <Text style={styles.linkText}>Esqueceu a senha?</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/register')}>
            <Text style={styles.linkText}>Criar conta</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6c8452",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    padding: 20,
    backgroundColor: "#86a46e",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#072d19",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15,
    backgroundColor: "#FFFFFF",
    color: "#475569",
  },
  error: {
    color: "#B91C1C",
    marginBottom: 12,
    fontSize: 13,
  },
  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#072d19",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  linkRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  linkText: {
    color: "#072d19",
    fontWeight: "600",
    fontSize: 14,
  },
});
