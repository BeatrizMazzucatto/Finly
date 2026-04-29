import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/src/context/AuthContext";

export default function AccountScreen() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conta</Text>
      <Text style={styles.description}>Sessão autenticada com o backend.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nome</Text>
        <Text style={styles.value}>{user?.nome ?? "-"}</Text>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email ?? "-"}</Text>
        <Text style={styles.label}>ID do usuário</Text>
        <Text style={styles.value}>{user?.id_usuario ?? "-"}</Text>
      </View>

      <Pressable style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Sair</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 8,
  },
  description: {
    color: "#475569",
    marginBottom: 16,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 4,
  },
  label: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 8,
  },
  value: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "600",
  },
  button: {
    marginTop: 20,
    width: "100%",
    maxWidth: 520,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
