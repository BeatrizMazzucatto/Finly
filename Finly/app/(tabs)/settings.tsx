import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/src/context/AuthContext";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing, Shadow } from "@/constants/theme";
import { Card, Button, ProgressBar } from "@/components/ui";
import { formatCurrency, formatMoneyInput } from "@/utils/formatters";
import { CATEGORIAS } from "@/constants/categories";

const LIMITE_KEY = "finly_limite_gastos";
const RENDA_KEY = "finly_renda_mensal";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [limite, setLimite] = useState("");
  const [renda, setRenda] = useState("");
  const [editingLimite, setEditingLimite] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const [limiteStored, rendaStored, customCatsStored] = await Promise.all([
        AsyncStorage.getItem(LIMITE_KEY),
        AsyncStorage.getItem(RENDA_KEY),
        AsyncStorage.getItem("finly_custom_categories")
      ]);
      if (limiteStored) setLimite(Number(limiteStored).toLocaleString("pt-BR", { minimumFractionDigits: 2 }));
      if (rendaStored) setRenda(Number(rendaStored).toLocaleString("pt-BR", { minimumFractionDigits: 2 }));
      if (customCatsStored) setCustomCategories(JSON.parse(customCatsStored));
    }
    loadSettings();
  }, []);

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    const updated = [...customCategories, newCategoryName.trim()];
    setCustomCategories(updated);
    setNewCategoryName("");
    await AsyncStorage.setItem("finly_custom_categories", JSON.stringify(updated));
    Alert.alert("Sucesso", "Categoria criada!");
  }

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
    Alert.alert(
      "Sair da conta",
      "Tem certeza que deseja sair?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/login");
          },
        },
      ]
    );
  }

  const limiteNum = parseFloat(limite.replace(/\./g, "").replace(",", ".")) || 0;
  const rendaNum = parseFloat(renda.replace(/\./g, "").replace(",", ".")) || 0;
  const limitePercent = rendaNum > 0 ? (limiteNum / rendaNum) * 100 : 0;

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

      {/* Profile Card */}
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.nome?.charAt(0).toUpperCase() ?? "U"}
              </Text>
            </View>
            <Pressable style={styles.editAvatarBtn}>
              <Feather name="camera" size={14} color={Colors.textInverse} />
            </Pressable>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.nome ?? "Usuário"}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? "email@exemplo.com"}</Text>
          </View>
          <Pressable style={styles.editProfileBtn}>
            <Feather name="edit-2" size={18} color={Colors.primary} />
          </Pressable>
        </View>
      </Card>

      {/* Limite de Gastos */}
      <Card style={styles.limiteCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Feather name="shield" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Limite de Gastos Mensal</Text>
          </View>
          {!editingLimite && (
            <Pressable onPress={() => setEditingLimite(true)}>
              <Feather name="edit-2" size={18} color={Colors.primary} />
            </Pressable>
          )}
        </View>

        {editingLimite ? (
          <View style={styles.editContainer}>
            <View style={styles.editInputRow}>
              <Text style={styles.currencyPrefix}>R$</Text>
              <TextInput
                style={styles.editInput}
                value={limite}
                onChangeText={(text) => setLimite(formatMoneyInput(text))}
                keyboardType="numeric"
                autoFocus
              />
            </View>
            <View style={styles.editActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setEditingLimite(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={handleSaveLimite}>
                <Feather name="check" size={18} color={Colors.textInverse} />
                <Text style={styles.saveBtnText}>Salvar</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.limiteValue}>R$ {limite || "0,00"}</Text>
            <View style={styles.limiteInfo}>
              <ProgressBar 
                progress={limitePercent} 
                color={Colors.primary}
                height={8}
              />
              <Text style={styles.limitePercent}>
                {limitePercent.toFixed(0)}% da sua renda mensal
              </Text>
            </View>
          </>
        )}
      </Card>

      {/* Categorias */}
      <Card style={styles.sectionCard}>
        <Pressable style={styles.menuItem} onPress={() => setShowCategories(!showCategories)}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: Colors.warning + "15" }]}>
              <Feather name="tag" size={20} color={Colors.warning} />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>Categorias</Text>
              <Text style={styles.menuItemSubtitle}>{CATEGORIAS.length + customCategories.length} categorias configuradas</Text>
            </View>
          </View>
          <Feather name={showCategories ? "chevron-down" : "chevron-right"} size={20} color={Colors.textMuted} />
        </Pressable>

        {showCategories && (
          <View style={{ padding: 15, backgroundColor: Colors.background, borderRadius: 10, marginTop: 10, marginBottom: 10 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 10, color: Colors.textPrimary }}>Minhas Categorias Customizadas</Text>
            {customCategories.length === 0 ? (
              <Text style={{ color: Colors.textMuted, fontSize: 12, marginBottom: 10 }}>Nenhuma categoria customizada criada ainda.</Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 }}>
                {customCategories.map((c, idx) => (
                  <View key={idx} style={{ backgroundColor: Colors.primary + "15", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                    <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 12 }}>{c}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput 
                style={[styles.editInput, { flex: 1, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, fontSize: 14, borderRadius: 8, height: 46 }]} 
                placeholder="Nome da categoria..." 
                value={newCategoryName} 
                onChangeText={setNewCategoryName} 
              />
              <Pressable style={[styles.saveBtn, { paddingHorizontal: 20, height: 46 }]} onPress={handleAddCategory}>
                <Feather name="plus" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.menuDivider} />

        <Pressable style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: Colors.secondary + "15" }]}>
              <Feather name="credit-card" size={20} color={Colors.secondary} />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>Carteiras</Text>
              <Text style={styles.menuItemSubtitle}>Gerencie suas contas</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={Colors.textMuted} />
        </Pressable>

        <View style={styles.menuDivider} />

        <Pressable style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: Colors.income + "15" }]}>
              <Feather name="target" size={20} color={Colors.income} />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>Metas</Text>
              <Text style={styles.menuItemSubtitle}>Defina objetivos financeiros</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={Colors.textMuted} />
        </Pressable>
      </Card>

      {/* Preferências */}
      <Card style={styles.sectionCard}>
        <Text style={styles.cardTitle}>Preferências</Text>

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceLeft}>
            <View style={[styles.menuIcon, { backgroundColor: Colors.info + "15" }]}>
              <Feather name="bell" size={20} color={Colors.info} />
            </View>
            <View>
              <Text style={styles.preferenceTitle}>Notificações</Text>
              <Text style={styles.preferenceSubtitle}>Alertas de gastos e lembretes</Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: Colors.border, true: Colors.primary + "50" }}
            thumbColor={notificationsEnabled ? Colors.primary : Colors.textMuted}
          />
        </View>

        <View style={styles.menuDivider} />

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceLeft}>
            <View style={[styles.menuIcon, { backgroundColor: Colors.textPrimary + "15" }]}>
              <Feather name="moon" size={20} color={Colors.textPrimary} />
            </View>
            <View>
              <Text style={styles.preferenceTitle}>Modo Escuro</Text>
              <Text style={styles.preferenceSubtitle}>Em breve</Text>
            </View>
          </View>
          <Switch
            value={darkModeEnabled}
            onValueChange={setDarkModeEnabled}
            trackColor={{ false: Colors.border, true: Colors.primary + "50" }}
            thumbColor={darkModeEnabled ? Colors.primary : Colors.textMuted}
            disabled
          />
        </View>

        <View style={styles.menuDivider} />

        <View style={styles.preferenceItem}>
          <View style={styles.preferenceLeft}>
            <View style={[styles.menuIcon, { backgroundColor: Colors.expense + "15" }]}>
              <Feather name="lock" size={20} color={Colors.expense} />
            </View>
            <View>
              <Text style={styles.preferenceTitle}>Biometria</Text>
              <Text style={styles.preferenceSubtitle}>Desbloqueio com digital</Text>
            </View>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={setBiometricEnabled}
            trackColor={{ false: Colors.border, true: Colors.primary + "50" }}
            thumbColor={biometricEnabled ? Colors.primary : Colors.textMuted}
          />
        </View>
      </Card>

      {/* Suporte */}
      <Card style={styles.sectionCard}>
        <Text style={styles.cardTitle}>Suporte</Text>

        <Pressable style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: Colors.textMuted + "15" }]}>
              <Feather name="help-circle" size={20} color={Colors.textMuted} />
            </View>
            <Text style={styles.menuItemTitle}>Central de Ajuda</Text>
          </View>
          <Feather name="chevron-right" size={20} color={Colors.textMuted} />
        </Pressable>

        <View style={styles.menuDivider} />

        <Pressable style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: Colors.textMuted + "15" }]}>
              <Feather name="message-circle" size={20} color={Colors.textMuted} />
            </View>
            <Text style={styles.menuItemTitle}>Fale Conosco</Text>
          </View>
          <Feather name="chevron-right" size={20} color={Colors.textMuted} />
        </Pressable>

        <View style={styles.menuDivider} />

        <Pressable style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: Colors.textMuted + "15" }]}>
              <Feather name="file-text" size={20} color={Colors.textMuted} />
            </View>
            <Text style={styles.menuItemTitle}>Termos de Uso</Text>
          </View>
          <Feather name="chevron-right" size={20} color={Colors.textMuted} />
        </Pressable>
      </Card>

      {/* Logout */}
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Feather name="log-out" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Sair da Conta</Text>
      </Pressable>

      {/* Version */}
      <Text style={styles.version}>Finly v1.0.0</Text>
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
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  profileCard: {
    marginBottom: Spacing.lg,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.textSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  profileEmail: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  editProfileBtn: {
    padding: Spacing.sm,
  },
  limiteCard: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  limiteValue: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  limiteInfo: {
    gap: Spacing.sm,
  },
  limitePercent: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  editContainer: {
    gap: Spacing.md,
  },
  editInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  currencyPrefix: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    marginRight: Spacing.sm,
  },
  editInput: {
    flex: 1,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  editActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  saveBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },
  sectionCard: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  menuItemSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  preferenceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  preferenceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  preferenceTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  preferenceSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    marginBottom: Spacing.xl,
  },
  logoutText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.error,
  },
  version: {
    textAlign: "center",
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
});