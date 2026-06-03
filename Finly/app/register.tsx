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
  Alert,
} from "react-native";
import { useAuth } from "@/src/context/AuthContext";
import { apiRequest } from "@/src/services/api";

export default function RegisterScreen() {
  const { user, loading } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && user && user.id_usuario !== 1) {
    return <Redirect href="/(tabs)" />;
  }

  async function handleRegister() {
    if (!nome.trim() || !email.trim() || !senha.trim() || !confirmSenha.trim()) {
      setError("Preencha todos os campos.");
      return;
    }
    if (senha !== confirmSenha) {
      setError("As senhas não coincidem.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await apiRequest<{ mensagem: string }>("/usuarios", {
        method: "POST",
        body: JSON.stringify({ nome: nome.trim(), email: email.trim(), senha }),
      });
      Alert.alert("Sucesso", "Conta criada com sucesso. Faça login.", [
        { text: "OK", onPress: () => router.replace("/login") },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar conta.");
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
        <Text style={styles.title}>Criar Conta</Text>
        <Text style={styles.subtitle}>Abra seu acesso e comece a organizar suas finanças.</Text>

        <TextInput
          autoCapitalize="words"
          placeholder="Nome"
          style={styles.input}
          value={nome}
          onChangeText={setNome}
        />
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
        <TextInput
          placeholder="Confirme a senha"
          secureTextEntry
          style={styles.input}
          value={confirmSenha}
          onChangeText={setConfirmSenha}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, submitting && styles.buttonDisabled]}
          disabled={submitting}
          onPress={handleRegister}
        >
          {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Criar Conta</Text>}
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
