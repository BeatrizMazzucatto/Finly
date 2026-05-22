import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  StatusBar,
  Image,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/src/context/AuthContext";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing, Shadow } from "@/constants/theme";
import { formatMoneyInput } from "@/utils/formatters";

const LIMITE_KEY = "finly_limite_gastos";
const RENDA_KEY = "finly_renda_mensal";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [limite, setLimite] = useState("3.000,00");
  const [editingLimite, setEditingLimite] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const limiteStored = await AsyncStorage.getItem(LIMITE_KEY);
      if (limiteStored) {
        setLimite(Number(limiteStored).toLocaleString("pt-BR", { minimumFractionDigits: 2 }));
      }
    }
    loadSettings();
  }, []);

  async function handleSaveLimite() {
    const limiteNum = parseFloat(limite.replace(/\./g, "").replace(",", ".")) || 0;
    if (limiteNum <= 0) {
      Alert.alert("Erro", "Digite um valor válido para o limite.");
      return;
    }
    await AsyncStorage.setItem(LIMITE_KEY, String(limiteNum));
    setEditingLimite(false);
    Alert.alert("Sucesso", "Limite atualizado!");
  }

  async function handleLogout() {
    const doLogout = async () => {
      await logout();
      await AsyncStorage.removeItem("finly_onboarding_done");
      router.replace("/onboarding");
    };

    if (Platform.OS === "web") {
      if (window.confirm("Sair da conta\n\nTem certeza que deseja sair?")) {
        doLogout();
      }
    } else {
      Alert.alert(
        "Sair da conta",
        "Tem certeza que deseja sair?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Sair",
            style: "destructive",
            onPress: doLogout,
          },
        ]
      );
    }
  }

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nome ?? "Lucas")}&background=4F46E5&color=fff`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Configurações</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Image source={{ uri: avatarUrl }} style={styles.profileAvatar} />
        <View>
          <Text style={styles.profileName}>{user?.nome ?? "Lucas Silva"}</Text>
          <Text style={styles.profileEmail}>{user?.email ?? "lucas.silva@email.com"}</Text>
        </View>
      </View>

      {/* Meu Limite de Gastos (Pessoal) */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Meu Limite de Gastos (Pessoal)</Text>
        {editingLimite ? (
          <View style={styles.editLimitCard}>
            <View style={styles.editInputRow}>
              <Text style={styles.currencyPrefix}>R$</Text>
              <TextInput
                style={styles.editLimitInput}
                value={limite}
                onChangeText={(text) => setLimite(formatMoneyInput(text))}
                keyboardType="numeric"
                autoFocus
              />
            </View>
            <View style={styles.editLimitActions}>
              <Pressable style={styles.editLimitSaveBtn} onPress={handleSaveLimite}>
                <Feather name="check" size={16} color={Colors.textInverse} />
              </Pressable>
              <Pressable style={styles.editLimitCancelBtn} onPress={() => setEditingLimite(false)}>
                <Feather name="x" size={16} color={Colors.textPrimary} />
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.limitDisplayCard} onPress={() => setEditingLimite(true)}>
            <Text style={styles.limitDisplayValue}>R$ {limite || "0,00"}</Text>
            <Feather name="edit-2" size={16} color={Colors.primary} />
          </Pressable>
        )}
      </View>

      {/* Settings Options Card */}
      <View style={styles.menuCard}>
        {/* Item 1: Gerenciar Categorias */}
        <Pressable style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Feather name="tag" size={20} color={Colors.primary} style={styles.menuItemIcon} />
            <Text style={styles.menuItemText}>Gerenciar Categorias</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#CBD5E1" />
        </Pressable>

        <View style={styles.menuDivider} />

        {/* Item 2: Segurança e Senha */}
        <Pressable style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Feather name="shield" size={20} color={Colors.primary} style={styles.menuItemIcon} />
            <Text style={styles.menuItemText}>Segurança e Senha</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#CBD5E1" />
        </Pressable>

        <View style={styles.menuDivider} />

        {/* Item 3: Backup de Dados */}
        <View style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Feather name="cloud" size={20} color={Colors.primary} style={styles.menuItemIcon} />
            <Text style={styles.menuItemText}>Backup de Dados</Text>
          </View>
          <Text style={styles.backupActiveBadge}>ATIVO</Text>
        </View>

        <View style={styles.menuDivider} />

        {/* Item 4: Sair da Conta */}
        <Pressable style={styles.menuItem} onPress={handleLogout}>
          <View style={styles.menuItemLeft}>
            <Feather name="log-out" size={20} color={Colors.error} style={styles.menuItemIcon} />
            <Text style={[styles.menuItemText, { color: Colors.error, fontWeight: FontWeight.semibold }]}>
              Sair da Conta
            </Text>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.xl,
    paddingTop: 50,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 30,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileName: {
    fontSize: 20,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textGray,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
    color: Colors.textGray,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  limitDisplayCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    padding: 16,
    ...Shadow.sm,
  },
  limitDisplayValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  editLimitCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    padding: 16,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  editInputRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currencyPrefix: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginRight: Spacing.xs,
  },
  editLimitInput: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },
  editLimitActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  editLimitSaveBtn: {
    backgroundColor: Colors.success,
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  editLimitCancelBtn: {
    backgroundColor: Colors.borderLight,
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    paddingVertical: 0,
    paddingHorizontal: 0,
    overflow: "hidden",
    marginTop: 24,
    ...Shadow.sm,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemIcon: {
    width: 20,
    textAlign: "center",
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  backupActiveBadge: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
  },
});