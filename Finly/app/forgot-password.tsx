import { useState } from "react";
import { Redirect, router } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";
import { useAuth } from "@/src/context/AuthContext";

export default function ForgotPasswordScreen() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && user && user.id_usuario !== 1) {
    return <Redirect href="/(tabs)" />;
  }

  async function handleSubmit() {
    if (!email.trim()) {
      setError("Digite um email válido.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      Alert.alert(
        "Verificação enviada",
        "Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.",
        [{ text: "OK", onPress: () => router.replace("/login") }]
      );
    } catch {
      setError("Falha ao processar a solicitação.");
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
        <Text style={styles.title}>Esqueci minha senha</Text>
        <Text style={styles.subtitle}>Informe seu email e receba orientações para redefinir a senha.</Text>

        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, submitting && styles.buttonDisabled]}
          disabled={submitting}
          onPress={handleSubmit}
        >
          {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Enviar</Text>}
        </Pressable>

        <View style={styles.linkRow}>
          <Pressable onPress={() => router.replace("/login")}> 
            <Text style={styles.linkText}>Voltar ao login</Text>
          </Pressable>
        </View>
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
  linkRow: {
    marginTop: 16,
    alignItems: "center",
  },
  linkText: {
    color: "#2563EB",
    fontWeight: "600",
    fontSize: 14,
  },
});
