import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing, Shadow } from "@/constants/theme";
import { Card } from "@/components/ui";
import { useSettingsViewModel } from "@/src/viewmodels/useSettingsViewModel";

export default function SettingsScreen() {
  const {
    user,
    limite,
    editingLimite,
    categories,
    newCategoryName,
    newCategoryIcon,
    showCategories,
    loadingCategories,
    showSecurity,
    currentPassword,
    newPassword,
    confirmPassword,
    showBackup,
    exporting,
    editingCategoryId,
    setEditingLimite,
    setNewCategoryName,
    setNewCategoryIcon,
    setShowCategories,
    setShowSecurity,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    setShowBackup,
    handleAddCategory,
    handleDeleteCategory,
    handleEditCategory,
    handleCancelEditCategory,
    handleSaveLimite,
    handleLogout,
    handleUpdatePassword,
    handleExportBackup,
    handleLimiteChange,
  } = useSettingsViewModel();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Configurações</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={[styles.profileAvatar, { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
            {(user?.nome ?? "Lucas Silva").substring(0, 2).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.profileName}>{user?.nome ?? "Lucas Silva"}</Text>
          <Text style={styles.profileEmail}>{user?.email ?? "lucas.silva@email.com"}</Text>
        </View>
      </View>

      {/* Meu Limite de Gastos */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Meu Limite de Gastos</Text>
        {editingLimite ? (
          <View style={styles.editLimitCard}>
            <View style={styles.editInputRow}>
              <Text style={styles.currencyPrefix}>R$</Text>
              <TextInput
                style={styles.editLimitInput}
                value={limite}
                onChangeText={handleLimiteChange}
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

      {/* Menu Card */}
      <Card style={styles.menuCard}>
        {/* Categorias */}
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
                <Pressable
                  key={c.id_categoria}
                  onPress={() => handleEditCategory(c as any)}
                  style={{
                    backgroundColor: c.cor_hex + '20',
                    paddingHorizontal: 12, paddingVertical: 6,
                    borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6,
                    borderWidth: editingCategoryId === c.id_categoria ? 1 : 0,
                    borderColor: c.cor_hex
                  }}
                >
                  <Feather name={c.icone as any} size={12} color={c.cor_hex} />
                  <Text style={{ color: c.cor_hex, fontWeight: '600', fontSize: 12 }}>{c.nome}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 8, color: Colors.textPrimary }}>
                {editingCategoryId ? "Editar categoria" : "Escolha um ícone"}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(['tag', 'coffee', 'shopping-cart', 'truck', 'droplet', 'heart', 'book', 'film', 'home', 'shopping-bag', 'tool', 'briefcase', 'trending-up'] as const).map((icon) => (
                  <Pressable
                    key={icon}
                    onPress={() => setNewCategoryIcon(icon)}
                    style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: newCategoryIcon === icon ? Colors.primary : '#F1F5F9' }}
                  >
                    <Feather name={icon} size={20} color={newCategoryIcon === icon ? '#fff' : Colors.textPrimary} />
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <TextInput
                style={[styles.editInput, { flex: 1, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, fontSize: 14, borderRadius: 8, height: 46 }]}
                placeholder="Nome da categoria..."
                placeholderTextColor={Colors.textMuted}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
              />
              {editingCategoryId && (
                <>
                  <Pressable style={[styles.saveBtn, { paddingHorizontal: 15, height: 46, backgroundColor: Colors.error }]} onPress={() => handleDeleteCategory(editingCategoryId)}>
                    <Feather name="trash-2" size={18} color="#fff" />
                  </Pressable>
                  <Pressable style={[styles.saveBtn, { paddingHorizontal: 15, height: 46, backgroundColor: '#64748B' }]} onPress={handleCancelEditCategory}>
                    <Feather name="x" size={18} color="#fff" />
                  </Pressable>
                </>
              )}
              <Pressable style={[styles.saveBtn, { paddingHorizontal: 20, height: 46 }]} onPress={handleAddCategory}>
                <Feather name={editingCategoryId ? "check" : "plus"} size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.menuDivider} />

        {/* Segurança */}
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
            <TextInput style={[styles.editInput, { borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, fontSize: 14, borderRadius: 8, height: 46, marginBottom: 10 }]} placeholder="Senha atual" placeholderTextColor={Colors.textMuted} secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
            <TextInput style={[styles.editInput, { borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, fontSize: 14, borderRadius: 8, height: 46, marginBottom: 10 }]} placeholder="Nova senha" placeholderTextColor={Colors.textMuted} secureTextEntry value={newPassword} onChangeText={setNewPassword} />
            <TextInput style={[styles.editInput, { borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, fontSize: 14, borderRadius: 8, height: 46, marginBottom: 16 }]} placeholder="Confirmar nova senha" placeholderTextColor={Colors.textMuted} secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
            <Pressable style={[styles.saveBtn, { height: 46 }]} onPress={handleUpdatePassword}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Atualizar Senha</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.menuDivider} />

        {/* Backup */}
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
          <Feather name={showBackup ? "chevron-down" : "chevron-right"} size={20} color="#CBD5E1" />
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
            <View style={{ flexDirection: 'column', gap: 10 }}>
              <Pressable
                style={[styles.saveBtn, { height: 46, flexDirection: 'row', gap: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.primary }]}
                onPress={() => handleExportBackup("PESSOAL")}
                disabled={exporting}
              >
                {exporting ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <>
                    <Feather name="download" size={16} color={Colors.primary} />
                    <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>Exportar Pessoal (CSV)</Text>
                  </>
                )}
              </Pressable>
              
              {user?.id_carteira_conjunta && (
                <Pressable
                  style={[styles.saveBtn, { height: 46, flexDirection: 'row', gap: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.jointPrimary }]}
                  onPress={() => handleExportBackup("CONJUNTA")}
                  disabled={exporting}
                >
                  {exporting ? (
                    <ActivityIndicator size="small" color={Colors.jointPrimary} />
                  ) : (
                    <>
                      <Feather name="download" size={16} color={Colors.jointPrimary} />
                      <Text style={{ color: Colors.jointPrimary, fontWeight: 'bold' }}>Exportar Conjunta (CSV)</Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          </View>
        )}

        <View style={styles.menuDivider} />

        {/* Logout */}
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
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingTop: 50, paddingBottom: 100 },
  header: { marginBottom: 20 },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  profileSection: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 30 },
  profileAvatar: { width: 60, height: 60, borderRadius: 30 },
  profileName: { fontSize: 20, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  profileEmail: { fontSize: 14, color: Colors.textGray, marginTop: 2 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: FontWeight.bold, color: Colors.textGray, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  limitDisplayCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: Colors.surface, borderRadius: BorderRadius.xxl, padding: 16, ...Shadow.sm },
  limitDisplayValue: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  editLimitCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: Colors.surface, borderRadius: BorderRadius.xxl, padding: 16, gap: Spacing.md, ...Shadow.sm },
  editInputRow: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: Colors.background, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  currencyPrefix: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginRight: Spacing.xs },
  editLimitInput: { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, paddingVertical: Spacing.sm },
  editLimitActions: { flexDirection: "row", gap: Spacing.sm },
  editLimitSaveBtn: { backgroundColor: Colors.success, width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: "center", justifyContent: "center" },
  editLimitCancelBtn: { backgroundColor: Colors.borderLight, width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border },
  menuCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xxl, paddingVertical: 0, paddingHorizontal: 0, overflow: "hidden", marginTop: 24, ...Shadow.sm },
  menuItem: { paddingVertical: 16, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  menuItemLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuItemIcon: { width: 20, textAlign: "center" },
  menuItemText: { fontSize: 15, fontWeight: "500", color: Colors.textPrimary },
  menuItemTitle: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  menuItemSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  menuIcon: { width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: "center", justifyContent: "center" },
  menuDivider: { height: 1, backgroundColor: "#F1F5F9" },
  editInput: { backgroundColor: Colors.surface, color: Colors.textPrimary },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, alignItems: "center", justifyContent: "center" },
});