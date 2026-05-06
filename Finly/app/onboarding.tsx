import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export const ONBOARDING_KEY = "finly_onboarding_done";
export const RENDA_KEY = "finly_renda_mensal";

// Categorias padrão criadas automaticamente (US01)
export const CATEGORIAS_PADRAO = [
  "Alimentação",
  "Mercado",
  "Moradia",
  "Contas Residenciais",
  "Transporte",
  "Combustível",
  "Saúde",
  "Farmácia",
  "Educação",
  "Lazer e Diversão",
  "Bares e Restaurantes",
  "Assinaturas e TV",
  "Vestuário",
  "Beleza e Cuidados",
  "Pets",
  "Viagem",
  "Salário",
  "Investimentos",
  "Renda Extra",
  "Transferências",
];

export default function OnboardingScreen() {
  const [renda, setRenda] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSalvar() {
    const valor = renda.replace(/[^0-9,\.]/g, "").replace(",", ".");
    const parsed = parseFloat(valor);

    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert("Valor inválido", "Por favor, insira uma renda mensal válida.");
      return;
    }

    setSaving(true);
    try {
      // Armazena renda e marca onboarding como concluído (US01)
      await AsyncStorage.setItem(RENDA_KEY, String(parsed));
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      // Categorias padrão já existem no banco (seed do schema.sql)
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar as informações.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePular() {
    // Opção de pular a configuração inicial (US01)
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", default: undefined })}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>Finly</Text>
        <Text style={styles.title}>Bem-vindo ao Finly!</Text>
        <Text style={styles.subtitle}>
          Para começar, precisamos de uma informação básica.
        </Text>

        <Text style={styles.label}>QUAL SUA RENDA MENSAL ATUAL?</Text>
        <TextInput
          style={styles.input}
          placeholder="R$ 0,00"
          keyboardType="numeric"
          value={renda}
          onChangeText={setRenda}
          autoFocus
        />

        <Text style={styles.categoriesNote}>
          ✓ Categorias padrão serão criadas automaticamente
        </Text>

        <Pressable
          style={[styles.btnPrimary, saving && styles.btnDisabled]}
          onPress={handleSalvar}
          disabled={saving}
        >
          <Text style={styles.btnPrimaryText}>
            {saving ? "Salvando..." : "Salvar e Continuar"}
          </Text>
        </Pressable>

        <Pressable style={styles.btnSkip} onPress={handlePular}>
          <Text style={styles.btnSkipText}>Pular configuração</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  logo: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2563EB",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 28,
    lineHeight: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
    marginBottom: 16,
  },
  categoriesNote: {
    fontSize: 13,
    color: "#15803D",
    marginBottom: 24,
  },
  btnPrimary: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnPrimaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  btnSkip: {
    alignItems: "center",
    padding: 8,
  },
  btnSkipText: {
    color: "#64748B",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});