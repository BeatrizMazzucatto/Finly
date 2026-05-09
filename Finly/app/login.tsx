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
  Dimensions,
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/src/context/AuthContext";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing, Shadow } from "@/constants/theme";

const ONBOARDING_KEY = "finly_onboarding_done";
const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

      const onboardingDone = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (!onboardingDone) {
        router.replace("/onboarding");
      } else {
        router.replace("/(tabs)");
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
      <StatusBar barStyle="light-content" />
      
      {/* Header com gradiente */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.headerGradient}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Feather name="dollar-sign" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.logoText}>Finly</Text>
            <Text style={styles.tagline}>Controle financeiro inteligente</Text>
          </View>
        </LinearGradient>
        
        {/* Curva decorativa */}
        <View style={styles.curve} />
      </View>

      {/* Card de Login */}
      <View style={styles.formContainer}>
        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>Bem-vindo de volta!</Text>
          <Text style={styles.welcomeSubtitle}>
            Entre para continuar gerenciando suas finanças
          </Text>

          {/* Input Email */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>SEU E-MAIL</Text>
            <View style={[styles.inputContainer, error && styles.inputError]}>
              <Feather name="mail" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="exemplo@email.com"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError(null);
                }}
              />
            </View>
          </View>

          {/* Input Senha */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>SUA SENHA</Text>
            <View style={[styles.inputContainer, error && styles.inputError]}>
              <Feather name="lock" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                placeholder="Digite sua senha"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                style={styles.input}
                value={senha}
                onChangeText={(text) => {
                  setSenha(text);
                  setError(null);
                }}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Feather 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color={Colors.textMuted} 
                />
              </Pressable>
            </View>
          </View>

          {/* Link Esqueci Senha */}
          <Pressable style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
          </Pressable>

          {/* Erro */}
          {error && (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Botão Login */}
          <Pressable
            style={[styles.loginButton, submitting && styles.buttonDisabled]}
            disabled={submitting}
            onPress={handleLogin}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Entrar</Text>
                <Feather name="arrow-right" size={20} color={Colors.textInverse} />
              </>
            )}
          </Pressable>

          {/* Divisor */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>ou continue com</Text>
            <View style={styles.divider} />
          </View>

          {/* Social Login */}
          <View style={styles.socialButtons}>
            <Pressable style={styles.socialButton}>
              <Feather name="smartphone" size={20} color={Colors.textPrimary} />
            </Pressable>
            <Pressable style={styles.socialButton}>
              <Feather name="github" size={20} color={Colors.textPrimary} />
            </Pressable>
          </View>

          {/* Link Cadastro */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Ainda nao tem uma conta? </Text>
            <Pressable onPress={() => router.push("/login")}>
              <Text style={styles.signupLink}>Cadastre-se</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    height: height * 0.32,
  },
  headerGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: "center",
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.textInverse,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    ...Shadow.lg,
  },
  logoText: {
    fontSize: 36,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: FontSize.sm,
    color: Colors.textInverse,
    opacity: 0.9,
    marginTop: Spacing.xs,
  },
  curve: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    marginTop: -Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadow.lg,
  },
  welcomeTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  inputWrapper: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.lg,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  eyeBtn: {
    padding: Spacing.sm,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: Spacing.lg,
  },
  forgotPasswordText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.errorLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    flex: 1,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: Colors.textInverse,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.xl,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginHorizontal: Spacing.md,
  },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  signupText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  signupLink: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
});