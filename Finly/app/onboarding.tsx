import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BorderRadius, FontSize, FontWeight, Spacing } from "@/constants/theme";
import { formatMoneyInput } from "@/utils/formatters";
import { useAuth } from "@/src/context/AuthContext";
import { apiRequest } from "@/src/services/api";

export const ONBOARDING_KEY = "finly_onboarding_done";
export const RENDA_KEY = "finly_renda_mensal";
export const LIMITE_KEY = "finly_limite_gastos";

export default function OnboardingScreen() {
  const { user, updateUser } = useAuth();
  const [renda, setRenda] = useState("5.000,00");
  const [saving, setSaving] = useState(false);

  async function handleStart() {
    const rendaNum = parseFloat(renda.replace(/\./g, "").replace(",", ".")) || 0;
    if (rendaNum <= 0) {
      Alert.alert("Valor inválido", "Informe uma renda mensal válida.");
      return;
    }

    setSaving(true);
    try {
      await AsyncStorage.setItem(RENDA_KEY, String(rendaNum));
      await AsyncStorage.setItem(LIMITE_KEY, String(rendaNum * 0.7));
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");

      if (user && user.id_usuario !== 1) {
        const response = await apiRequest<{ id_carteira: number }>(
          `/usuarios/${user.id_usuario}/onboarding`,
          {
            method: "POST",
            body: JSON.stringify({ renda_mensal: rendaNum }),
          }
        );
        await updateUser({ ...user, id_carteira_pessoal: response.id_carteira });
      }

      router.replace("/(tabs)");
    } catch (err) {
      console.error(err);
      Alert.alert("Erro", "Não foi possível concluir o cadastro. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/(tabs)");
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <StatusBar barStyle="dark-content" />
        <View style={styles.content}>
          <View style={styles.hero}>
            <Image
              source={require("../assets/images/logoFinly.jpeg")}
              style={{ width: 120, height: 120, borderRadius: 24, marginBottom: 20 }}
              resizeMode="contain"
            />
            <Text style={styles.title}>Bem-vindo ao Finly</Text>
            <Text style={styles.subtitle}>
              O controle inteligente para a sua vida financeira e familiar.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>QUAL SUA RENDA MENSAL ATUAL?</Text>
            <TextInput
              style={styles.currencyInput}
              value={`R$ ${renda}`}
              onChangeText={(text) => setRenda(formatMoneyInput(text.replace(/^R\$\s?/, "")))}
              onFocus={() => {
                if (renda === "5.000,00") setRenda("0,00");
              }}
              keyboardType="numeric"
            />
            <View style={styles.currencyLine} />
            <Pressable style={styles.primaryButton} onPress={handleStart} disabled={saving}>
              <LinearGradient
                colors={["#072d19", "#072d19"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryGradient}
              >
                <Text style={styles.primaryButtonText}>{saving ? "Salvando..." : "Começar Agora"}</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={handleSkip}>
              <Text style={styles.skipText}>Pular configuração inicial</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6c8452",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  hero: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    transform: [{ rotate: "-10deg" }],
    shadowColor: "rgba(79, 70, 229, 0.4)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: "#072d19",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#072d19",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  card: {
    backgroundColor: "#86a46e",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    textAlign: "center",
    color: "#072d19",
    fontSize: 12,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  currencyInput: {
    fontSize: 36,
    fontWeight: FontWeight.extrabold,
    color: "#072d19",
    textAlign: "center",
    paddingBottom: 10,
  },
  currencyLine: {
    height: 2,
    backgroundColor: "#E2E8F0",
    marginBottom: 30,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 10,
    shadowColor: "rgba(7, 45, 25, 0.3)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 4,
  },
  primaryGradient: {
    paddingVertical: 18,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: FontWeight.semibold,
  },
  skipText: {
    textAlign: "center",
    color: "#072d19",
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    paddingVertical: 12,
  },
});
