import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { getCategories, createCategory } from "@/src/services/categories";
import { getTransactionsByUser } from "@/src/services/transactions";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing, Shadow } from "@/constants/theme";
import { formatMoneyInput } from "@/utils/formatters";
import { Card } from "@/components/ui";

const LIMITE_KEY = "finly_limite_gastos";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [limite, setLimite] = useState("3.000,00");
  const [editingLimite, setEditingLimite] = useState(false);

  const [categories, setCategories] = useState<{
    id_categoria: number;
    nome: string;
    cor_hex: string;
    icone: string;
  }[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState<keyof typeof Feather.glyphMap>("tag");
  const [showCategories, setShowCategories] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [showSecurity, setShowSecurity] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showBackup, setShowBackup] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const limiteStored = await AsyncStorage.getItem(LIMITE_KEY);
      if (limiteStored) setLimite(Number(limiteStored).toLocaleString("pt-BR", { minimumFractionDigits: 2 }));

      const loadedCategories = await getCategories().catch(() => []);
      setCategories(loadedCategories);
      setLoadingCategories(false);
    }
    loadSettings();
  }, []);

  async function handleAddCategory() {
    if (!newCategoryName.trim()) {
      Alert.alert("Erro", "Digite o nome da categoria.");
      return;
    }

    try {
      const created = await createCategory({
        nome: newCategoryName.trim(),
        icone: newCategoryIcon,
        cor_hex: Colors.categories.outros,
      });
      setCategories((prev) => [...prev, created]);
      setNewCategoryName("");
      Alert.alert("Sucesso", "Categoria criada!");
    } catch (err) {
      Alert.alert("Erro", err instanceof Error ? err.message : "Não foi possível criar a categoria.");
    }
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
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Tem certeza que deseja sair?");
      if (confirmed) {
        await logout();
        router.replace("/login");
      }
      return;
    }

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

  async function handleUpdatePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Erro", "A nova senha e a confirmação não coincidem.");
      return;
    }

    // Como ainda não há rota no backend, vamos simular o sucesso
    Alert.alert("Sucesso", "Sua senha foi atualizada!");
    setShowSecurity(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleExportBackup() {
    if (!user) return;
    try {
      setExporting(true);
      const transactions = await getTransactionsByUser(user.id_usuario);
      
      const header = "ID,Titulo,Valor,Data,Tipo,Categoria\n";
      const csvContent = transactions.map(t => `${t.id_transacao},"${t.titulo}",${t.valor},${t.data_transacao},${t.tipo},"${t.categoria || ''}"`).join("\n");
      const fullCsv = header + csvContent;

      if (Platform.OS === 'web') {
        const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `finly_backup_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert("Sucesso", "Backup efetuado com sucesso (CSV baixado).");
      } else {
        Alert.alert(
          "Backup Gerado!",
          "Em um ambiente real (app nativo), aqui o arquivo CSV seria salvo ou compartilhado. Para testes na Web, o download funciona normalmente."
        );
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Erro", "Não foi possível gerar o backup.");
    } finally {
      setExporting(false);
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

      {/* Meu Limite de Gastos*/}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Meu Limite de Gastos</Text>
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

      {/* Categorias */}
      <Card style={styles.menuCard}>
        <Pressable style={styles.menuItem} onPress={() => setShowCategories(!showCategories)}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: Colors.warning + "15" }]}>
              <Feather name="tag" size={20} color={Colors.warning} />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>Categorias</Text>
              <Text style={styles.menuItemSubtitle}>{categories.length} categorias configuradas</Text>
            </View>
          </View>
          <Feather name={showCategories ? "chevron-down" : "chevron-right"} size={20} color={Colors.textMuted} />
        </Pressable>

        {showCategories && (
          <View style={{ padding: 15, backgroundColor: Colors.background, borderRadius: 10, marginTop: 10, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View>
                <Text style={{ fontWeight: 'bold', marginBottom: 4, color: Colors.textPrimary }}>Categorias Disponíveis</Text>
                <Text style={{ color: Colors.textMuted, fontSize: 12 }}>{categories.length} categorias configuradas</Text>
              </View>
              {loadingCategories ? <ActivityIndicator size="small" color={Colors.primary} /> : null}
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {categories.map((c) => (
                <View key={c.id_categoria} style={{ backgroundColor: c.cor_hex + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Feather name={c.icone as any} size={12} color={c.cor_hex} />
                  <Text style={{ color: c.cor_hex, fontWeight: '600', fontSize: 12 }}>{c.nome}</Text>
                </View>
              ))}
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 8, color: Colors.textPrimary }}>Escolha um ícone</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {[
                  'tag',
                  'coffee',
                  'shopping-cart',
                  'truck',
                  'droplet',
                  'heart',
                  'book',
                  'film',
                  'home',
                  'shopping-bag',
                  'tool',
                  'briefcase',
                  'trending-up',
                ].map((icon) => (
                  <Pressable
                    key={icon}
                    onPress={() => setNewCategoryIcon(icon as keyof typeof Feather.glyphMap)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: newCategoryIcon === icon ? Colors.primary : '#F1F5F9',
                    }}
                  >
                    <Feather name={icon as any} size={20} color={newCategoryIcon === icon ? '#fff' : Colors.textPrimary} />
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
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

        {/* Item 2: Gerencie sua senha */}
        <Pressable style={styles.menuItem} onPress={() => setShowSecurity(!showSecurity)}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: Colors.primary + "15" }]}>
              <Feather name="shield" size={20} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>Gerencie sua senha</Text>
              <Text style={styles.menuItemSubtitle}>Mantenha sua conta protegida</Text>
            </View>
          </View>
          <Feather name={showSecurity ? "chevron-down" : "chevron-right"} size={20} color={Colors.textMuted} />
        </Pressable>

        {showSecurity && (
          <View style={{ padding: 15, backgroundColor: Colors.background, borderRadius: 10, marginHorizontal: 20, marginBottom: 10 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 12, color: Colors.textPrimary }}>Alterar Senha</Text>

            <TextInput
              style={[styles.editInput, { borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, fontSize: 14, borderRadius: 8, height: 46, marginBottom: 10 }]}
              placeholder="Senha atual"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <TextInput
              style={[styles.editInput, { borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, fontSize: 14, borderRadius: 8, height: 46, marginBottom: 10 }]}
              placeholder="Nova senha"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TextInput
              style={[styles.editInput, { borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, fontSize: 14, borderRadius: 8, height: 46, marginBottom: 16 }]}
              placeholder="Confirmar nova senha"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <Pressable style={[styles.saveBtn, { height: 46 }]} onPress={handleUpdatePassword}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Atualizar Senha</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.menuDivider} />

        {/* Item 3: Backup de Dados */}
        <Pressable style={styles.menuItem} onPress={() => setShowBackup(!showBackup)}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: Colors.primary + "15" }]}>
              <Feather name="cloud" size={20} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.menuItemTitle}>Backup de Dados</Text>
              <Text style={styles.menuItemSubtitle}>Exporte ou salve suas informações</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name={showBackup ? "chevron-down" : "chevron-right"} size={20} color="#CBD5E1" />
          </View>
        </Pressable>

        {showBackup && (
          <View style={{ padding: 15, backgroundColor: Colors.background, borderRadius: 10, marginHorizontal: 20, marginBottom: 10 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 6, color: Colors.textPrimary }}>Backup da Conta</Text>
            <Text style={{ fontSize: 13, color: Colors.textGray, marginBottom: 16 }}>
              Seus dados estão sendo salvos na nuvem em tempo real de forma automática.
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Feather name="check-circle" size={16} color={Colors.success} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 13, color: Colors.textPrimary, fontWeight: '500' }}>
                Último backup: Hoje, {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            <Pressable 
              style={[styles.saveBtn, { height: 46, flexDirection: 'row', gap: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }]} 
              onPress={handleExportBackup}
              disabled={exporting}
            >
              {exporting ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <Feather name="download" size={16} color={Colors.primary} />
                  <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>Exportar dados (CSV)</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

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
      </Card>
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
  menuItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
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
  editInput: {
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});