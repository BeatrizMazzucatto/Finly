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
  ScrollView,
  Dimensions,
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing, Shadow } from "@/constants/theme";
import { ProgressBar } from "@/components/ui";
import { formatMoneyInput } from "@/utils/formatters";

export const ONBOARDING_KEY = "finly_onboarding_done";
export const RENDA_KEY = "finly_renda_mensal";
export const LIMITE_KEY = "finly_limite_gastos";

const { width, height } = Dimensions.get("window");

const QUICK_VALUES = [
  { label: "R$ 1.500", value: 1500 },
  { label: "R$ 3.000", value: 3000 },
  { label: "R$ 5.000", value: 5000 },
  { label: "R$ 8.000", value: 8000 },
];

const FEATURES = [
  { icon: "pie-chart" as const, title: "Estatísticas", desc: "Visualize seus gastos" },
  { icon: "target" as const, title: "Metas", desc: "Defina objetivos" },
  { icon: "bell" as const, title: "Alertas", desc: "Nunca perca um prazo" },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [renda, setRenda] = useState("");
  const [limite, setLimite] = useState("");
  const [saving, setSaving] = useState(false);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  async function handleSalvar() {
    const rendaNum = parseFloat(renda.replace(/\./g, "").replace(",", ".")) || 0;
    const limiteNum = parseFloat(limite.replace(/\./g, "").replace(",", ".")) || 0;

    if (rendaNum <= 0) {
      Alert.alert("Valor inválido", "Por favor, insira uma renda mensal válida.");
      return;
    }

    setSaving(true);
    try {
      await AsyncStorage.setItem(RENDA_KEY, String(rendaNum));
      await AsyncStorage.setItem(LIMITE_KEY, String(limiteNum || rendaNum * 0.7));
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar as informações.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePular() {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/(tabs)");
  }

  function handleNext() {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSalvar();
    }
  }

  function handleBack() {
    if (step > 1) {
      setStep(step - 1);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", default: undefined })}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.logoRow}>
            <View style={styles.logoCircle}>
              <Feather name="dollar-sign" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.logoText}>Finly</Text>
          </View>
          
          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressInfo}>
              <Text style={styles.stepText}>Etapa {step} de {totalSteps}</Text>
              <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
            </View>
            <ProgressBar 
              progress={progress} 
              color={Colors.textInverse}
              backgroundColor="rgba(255,255,255,0.3)"
              height={6}
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Boas-vindas */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <View style={styles.welcomeIcon}>
              <Feather name="smile" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Bem-vindo ao Finly!</Text>
            <Text style={styles.subtitle}>
              Vamos configurar sua conta em poucos passos para você ter o controle total das suas finanças.
            </Text>

            {/* Features */}
            <View style={styles.featuresGrid}>
              {FEATURES.map((feature, index) => (
                <View key={index} style={styles.featureCard}>
                  <View style={[styles.featureIcon, { backgroundColor: Colors.primary + "15" }]}>
                    <Feather name={feature.icon} size={24} color={Colors.primary} />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Step 2: Renda Mensal */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <Feather name="trending-up" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Qual sua renda mensal?</Text>
            <Text style={styles.subtitle}>
              Isso nos ajuda a criar metas personalizadas para você.
            </Text>

            <View style={styles.inputLarge}>
              <Text style={styles.currencyPrefix}>R$</Text>
              <TextInput
                style={styles.largeInput}
                placeholder="0,00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={renda}
                onChangeText={(text) => setRenda(formatMoneyInput(text))}
                autoFocus
              />
            </View>

            {/* Quick Values */}
            <View style={styles.quickValues}>
              {QUICK_VALUES.map((item) => (
                <Pressable
                  key={item.value}
                  style={[
                    styles.quickValueBtn,
                    renda === item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) && styles.quickValueBtnActive,
                  ]}
                  onPress={() => setRenda(item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 }))}
                >
                  <Text style={[
                    styles.quickValueText,
                    renda === item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) && styles.quickValueTextActive,
                  ]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Step 3: Limite de Gastos */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <Feather name="shield" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Defina seu limite mensal</Text>
            <Text style={styles.subtitle}>
              Vamos te alertar quando você estiver chegando perto do limite.
            </Text>

            <View style={styles.inputLarge}>
              <Text style={styles.currencyPrefix}>R$</Text>
              <TextInput
                style={styles.largeInput}
                placeholder="0,00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={limite}
                onChangeText={(text) => setLimite(formatMoneyInput(text))}
                autoFocus
              />
            </View>

            {/* Sugestão */}
            <View style={styles.suggestionCard}>
              <Feather name="info" size={20} color={Colors.info} />
              <View style={styles.suggestionContent}>
                <Text style={styles.suggestionTitle}>Dica</Text>
                <Text style={styles.suggestionText}>
                  Recomendamos um limite de 70% da sua renda para gastos variáveis.
                </Text>
              </View>
            </View>

            {/* Categorias */}
            <View style={styles.categoriesPreview}>
              <Text style={styles.categoriesTitle}>
                <Feather name="check-circle" size={16} color={Colors.success} /> Categorias padrão criadas
              </Text>
              <Text style={styles.categoriesText}>
                Alimentação, Transporte, Saúde, Lazer, Moradia e mais...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          {step > 1 && (
            <Pressable style={styles.backButton} onPress={handleBack}>
              <Feather name="arrow-left" size={20} color={Colors.textSecondary} />
              <Text style={styles.backButtonText}>Voltar</Text>
            </Pressable>
          )}
          
          <Pressable
            style={[styles.nextButton, saving && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={saving}
          >
            <Text style={styles.nextButtonText}>
              {step === totalSteps ? (saving ? "Salvando..." : "Começar") : "Continuar"}
            </Text>
            <Feather name={step === totalSteps ? "check" : "arrow-right"} size={20} color={Colors.textInverse} />
          </Pressable>
        </View>

        <Pressable style={styles.skipButton} onPress={handlePular}>
          <Text style={styles.skipButtonText}>Pular configuração</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  headerContent: {
    gap: Spacing.lg,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.textInverse,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  progressContainer: {
    gap: Spacing.sm,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepText: {
    fontSize: FontSize.sm,
    color: Colors.textInverse,
    opacity: 0.9,
  },
  progressPercent: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.xl,
  },
  stepContent: {
    alignItems: "center",
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  stepIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: Spacing.xxl,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.md,
    width: "100%",
  },
  featureCard: {
    width: (width - Spacing.xl * 2 - Spacing.md * 2) / 3,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  featureTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: "center",
  },
  inputLarge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    width: "100%",
    marginBottom: Spacing.xl,
    ...Shadow.md,
  },
  currencyPrefix: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    marginRight: Spacing.sm,
  },
  largeInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  quickValues: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
    width: "100%",
  },
  quickValueBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickValueBtnActive: {
    backgroundColor: Colors.primary + "15",
    borderColor: Colors.primary,
  },
  quickValueText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  quickValueTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  suggestionCard: {
    flexDirection: "row",
    backgroundColor: Colors.infoLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    width: "100%",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.info,
    marginBottom: 2,
  },
  suggestionText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  categoriesPreview: {
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    width: "100%",
  },
  categoriesTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.success,
    marginBottom: Spacing.xs,
  },
  categoriesText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  footer: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  backButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  nextButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    gap: Spacing.sm,
    ...Shadow.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  nextButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  skipButtonText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textDecorationLine: "underline",
  },
});