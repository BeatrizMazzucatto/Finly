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
} from "react-native";

import { useAuth } from "@/src/context/AuthContext";

export default function LoginScreen() {
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && user) {
    return <Redirect href="/(tabs)" />;
  }

  async function handleLogin() {
    if (!email.trim() || !senha.trim()) {
      setError("Preencha email e senha.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await login(email.trim(), senha);
      router.replace("/(tabs)");
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
        <Text style={styles.title}>Finly</Text>
        <Text style={styles.subtitle}>Controle financeiro conectado ao seu backend.</Text>

        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Senha"
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
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F6FF",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    padding: 20,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1D4ED8",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 18,
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
  },
  error: {
    color: "#B91C1C",
    marginBottom: 12,
    fontSize: 13,
  },
  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#2563EB",
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
});
