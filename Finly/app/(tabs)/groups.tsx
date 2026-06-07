import React from "react";
import {
  StyleSheet, Text, View, StatusBar, Modal, TextInput, Pressable, ActivityIndicator, ScrollView
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing, FontSize, FontWeight } from "@/constants/theme";
import { PieChart, LineChart } from "react-native-gifted-charts";
import { useGroupsViewModel } from "@/src/viewmodels/useGroupsViewModel";
import { TransactionItem } from "@/components/ui/TransactionItem";
import { CategoryCard } from "@/components/CategoryCard";
import { Chip, Card } from "@/components/ui";
import { formatCurrency, formatDateMD } from "@/utils/formatters";
import { getCategoryColor } from "@/constants/categories";
import { useDashboardViewModel } from "@/src/viewmodels/useDashboardViewModel";
import { router } from "expo-router";

export default function GroupsScreen() {
  const {
    user,
    activeMembers,
    currentUserRole,
    modalCreateVisible,
    modalJoinVisible,
    modalEditVisible,
    modalSettingsVisible,
    newWalletName,
    newWalletLimit,
    joinCode,
    loadingAction,
    totalDespesasConjuntas,
    tetoLimit,
    progressPercentage,
    progressBarColor,
    setModalCreateVisible,
    setModalJoinVisible,
    setModalEditVisible,
    setModalSettingsVisible,
    setNewWalletName,
    setNewWalletLimit,
    setJoinCode,
    handleShowInviteCode,
    handleCreateWallet,
    handleJoinWallet,
    handleEditWallet,
    openEditModal,
    openDeleteFromSettings,
    openLeaveFromSettings,
    saldo,
    totalReceitas,
    expensesByCategory,
    incomesByCategory,
    recentTransactions,
    historyFilter, setHistoryFilter, activeMonthFilter, historyTransactions,
    histReceitas, histDespesas, histLucro, navigateMonth, canGoPrev, canGoNext,
    lineDataBalance, handleEdit, handleDelete, formatDateHeader,
  } = useGroupsViewModel();

  const [viewMode, setViewMode] = React.useState<'INICIO' | 'HISTORICO' | 'LIMITE'>('INICIO');
  const [chartType, setChartType] = React.useState<'DESPESA' | 'RECEITA'>('DESPESA');
  const activeCats = chartType === "DESPESA" ? expensesByCategory : incomesByCategory;

  const { createTransaction } = useDashboardViewModel();
  const [txModalVisible, setTxModalVisible] = React.useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={styles.headerTitle}>Carteira Conjunta</Text>
        {user?.id_carteira_conjunta && (
          <Pressable onPress={() => setModalSettingsVisible(true)} style={styles.settingsIcon}>
            <Feather name="settings" size={24} color={Colors.textPrimary} />
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {!user?.id_carteira_conjunta ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <View style={styles.iconContainer}>
              <Feather name="users" size={40} color={Colors.jointPrimary} />
            </View>
            <Text style={styles.title}>Carteira Conjunta</Text>
            <Text style={styles.subtitle}>
              Você ainda não participa de nenhuma Carteira Conjunta. Crie uma nova para compartilhar despesas ou entre com um código de convite.
            </Text>

            <View style={{ marginTop: 30, width: '100%', gap: 12 }}>
              <Pressable style={styles.btnPrimary} onPress={() => setModalCreateVisible(true)}>
                <Feather name="plus" size={18} color="white" />
                <Text style={styles.btnPrimaryText}>Criar Carteira Conjunta</Text>
              </Pressable>
              <Pressable style={styles.btnSecondary} onPress={() => setModalJoinVisible(true)}>
                <Feather name="log-in" size={18} color={Colors.jointPrimary} />
                <Text style={styles.btnSecondaryText}>Entrar com Código</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20, gap: 10, marginTop: 10 }}>
              <Chip label="Início" selected={viewMode === 'INICIO'} color={Colors.jointPrimary} onPress={() => setViewMode('INICIO')} />
              <Chip label="Histórico" selected={viewMode === 'HISTORICO'} color={Colors.jointPrimary} onPress={() => setViewMode('HISTORICO')} />
              <Chip label="Limite" selected={viewMode === 'LIMITE'} color={Colors.jointPrimary} onPress={() => setViewMode('LIMITE')} />
            </View>

            {viewMode === 'INICIO' && (
              <>
                {/* DASHBOARD: Balanço do Período */}
                <View style={{ alignItems: 'center', marginBottom: 30, marginTop: 10 }}>
                  <Text style={{ color: '#64748B', fontSize: 14, fontWeight: '600', textTransform: 'uppercase' }}>Balanço do Período</Text>
                  <Text style={{ fontSize: 38, fontWeight: 'bold', color: '#0F172A' }}>{formatCurrency(saldo)}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
                  <Pressable onPress={() => setChartType("DESPESA")} style={[{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }, chartType === "DESPESA" ? { backgroundColor: '#FEE2E2' } : { backgroundColor: 'transparent' }]}>
                    <Text style={{ color: chartType === "DESPESA" ? '#EF4444' : '#64748B', fontWeight: 'bold' }}>Despesas</Text>
                  </Pressable>
                  <Pressable onPress={() => setChartType("RECEITA")} style={[{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }, chartType === "RECEITA" ? { backgroundColor: '#D1FAE5' } : { backgroundColor: 'transparent' }]}>
                    <Text style={{ color: chartType === "RECEITA" ? '#10B981' : '#64748B', fontWeight: 'bold' }}>Receitas</Text>
                  </Pressable>
                </View>

                <View style={{ alignItems: 'center', marginBottom: 40 }}>
                  {Object.entries(activeCats).length > 0 ? (
                    <PieChart
                      data={Object.entries(activeCats).map(([cat, val]) => ({
                        value: val,
                        color: getCategoryColor(cat),
                      }))}
                      donut
                      radius={100}
                      innerRadius={70}
                      innerCircleColor={'#F8FAFC'}
                      centerLabelComponent={() => (
                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ fontSize: 12, color: '#64748B', fontWeight: 'bold' }}>{chartType === "DESPESA" ? "Despesas" : "Receitas"}</Text>
                          <Text style={{ fontSize: 20, color: chartType === "DESPESA" ? '#EF4444' : '#10B981', fontWeight: 'bold' }}>
                            {formatCurrency(chartType === "DESPESA" ? totalDespesasConjuntas : totalReceitas)}
                          </Text>
                        </View>
                      )}
                    />
                  ) : (
                    <View style={styles.ringContainer}>
                      <View style={styles.ringInner}>
                        <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600' }}>{chartType === "DESPESA" ? "Despesas" : "Receitas"}</Text>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0F172A' }}>
                          {formatCurrency(chartType === "DESPESA" ? totalDespesasConjuntas : totalReceitas)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Category Cards */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0F172A' }}>
                    {chartType === 'DESPESA' ? 'Gastos por Categoria' : 'Receitas por Categoria'}
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 16, marginBottom: 20 }}>
                  {Object.entries(activeCats).length === 0 ? (
                    <Text style={{ color: '#64748B', paddingHorizontal: 16 }}>
                      {chartType === 'DESPESA' ? 'Nenhum gasto registrado.' : 'Nenhuma receita registrada.'}
                    </Text>
                  ) : (
                    Object.entries(activeCats).map(([cat, val]) => (
                      <CategoryCard key={cat} category={cat} value={val} />
                    ))
                  )}
                </ScrollView>

                {/* Transações Recentes */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0F172A' }}>Transações Recentes</Text>
                </View>
                
                {recentTransactions.length === 0 ? (
                  <View style={{ alignItems: 'center', padding: 20, backgroundColor: 'white', borderRadius: 20, elevation: 2 }}>
                    <Feather name="inbox" size={40} color={Colors.textMuted} style={{ marginBottom: 10 }} />
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary }}>Nenhuma transação encontrada</Text>
                    <Text style={{ color: Colors.textGray }}>Ainda não há lançamentos neste grupo.</Text>
                  </View>
                ) : (
                  recentTransactions.map((t, idx) => (
                    <TransactionItem
                      key={t.id_transacao || idx}
                      id={t.id_transacao}
                      id_carteira={t.id_carteira}
                      usuario_nome={t.usuario_nome}
                      titulo={t.titulo}
                      valor={Number(t.valor)}
                      tipo={t.tipo}
                      categoria={t.categoria || "Outros"}
                      data={formatDateMD(t.data_transacao)}
                      style={{ marginBottom: 12 }}
                    />
                  ))
                )}
              </>
            )}

            {viewMode === 'HISTORICO' && (
              <>
                {/* HISTÓRICO */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
                  {['Todos', 'Receitas', 'Despesas'].map(f => (
                    <Chip key={f} label={f} selected={historyFilter === f} color={Colors.jointPrimary} onPress={() => setHistoryFilter(f)} />
                  ))}
                </View>

                <View style={styles.monthSelector}>
                  <Pressable onPress={() => navigateMonth('prev')} style={{ opacity: canGoPrev ? 1 : 0.3 }} disabled={!canGoPrev}>
                    <Feather name="chevron-left" size={24} color={Colors.textSecondary} />
                  </Pressable>
                  <Text style={styles.monthLabel}>{activeMonthFilter ? activeMonthFilter.label : "Selecione"}</Text>
                  <Pressable onPress={() => navigateMonth('next')} style={{ opacity: canGoNext ? 1 : 0.3 }} disabled={!canGoNext}>
                    <Feather name="chevron-right" size={24} color={Colors.textSecondary} />
                  </Pressable>
                </View>

                <Card style={{ marginBottom: Spacing.lg }}>
                  <View style={{ flexDirection: "row", marginBottom: Spacing.md }}>
                    <View style={{ flex: 1, alignItems: "center" }}>
                      <Text style={{ fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.xs }}>Receitas</Text>
                      <Text style={{ fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.income }}>+{formatCurrency(histReceitas)}</Text>
                    </View>
                    <View style={{ width: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.lg }} />
                    <View style={{ flex: 1, alignItems: "center" }}>
                      <Text style={{ fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.xs }}>Despesas</Text>
                      <Text style={{ fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.expense }}>-{formatCurrency(histDespesas)}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border }}>
                    <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary }}>Lucro</Text>
                    <Text style={{ fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: histLucro >= 0 ? Colors.income : Colors.expense }}>
                      {formatCurrency(histLucro)}
                    </Text>
                  </View>
                </Card>

                {historyFilter === 'Todos' && lineDataBalance.length > 0 && (
                  <Card style={{ marginBottom: Spacing.lg }}>
                    <Text style={{ fontSize: 14, fontWeight: "bold", color: Colors.textPrimary, marginBottom: 12 }}>Saldo</Text>
                    <View style={{ alignItems: "center" }}>
                      <LineChart
                        data={lineDataBalance}
                        areaChart hideDataPoints
                        startFillColor={Colors.jointPrimary} startOpacity={0.3}
                        endFillColor={Colors.jointPrimary}   endOpacity={0.02}
                        color={Colors.jointPrimary} thickness={2}
                        xAxisThickness={0} yAxisThickness={0}
                        hideYAxisText hideRules curved height={100} width={250}
                      />
                    </View>
                  </Card>
                )}

                {historyTransactions.length === 0 ? (
                  <View style={{ alignItems: 'center', padding: 30, backgroundColor: 'white', borderRadius: 20, elevation: 2, marginTop: 20 }}>
                    <Feather name="inbox" size={48} color={Colors.textMuted} style={{ marginBottom: 15 }} />
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, textAlign: 'center' }}>Nenhuma transação encontrada</Text>
                    <Text style={{ color: Colors.textGray, textAlign: 'center', marginTop: 8 }}>Tente ajustar seus filtros</Text>
                  </View>
                ) : (
                  historyTransactions.map((t, idx) => {
                    const isNewDate = idx === 0 || t.data_transacao !== historyTransactions[idx - 1].data_transacao;
                    return (
                      <React.Fragment key={t.id_transacao || idx}>
                        {isNewDate && (
                          <Text style={{ fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: "uppercase", letterSpacing: 0.5, marginTop: Spacing.md }}>
                            {formatDateHeader(t.data_transacao)}
                          </Text>
                        )}
                        <TransactionItem
                          id={t.id_transacao}
                          id_carteira={t.id_carteira}
                          usuario_nome={t.usuario_nome}
                          titulo={t.titulo}
                          valor={Number(t.valor)}
                          tipo={t.tipo}
                          categoria={t.categoria || "Outros"}
                          data={formatDateMD(t.data_transacao)}
                          showActions
                          onEdit={() => handleEdit(t)}
                          onDelete={() => handleDelete(t)}
                          style={{ marginBottom: 12 }}
                        />
                      </React.Fragment>
                    );
                  })
                )}
              </>
            )}

            {viewMode === 'LIMITE' && (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Limite Mensal do Grupo</Text>
                  <PieChart
                    donut
                    radius={80}
                    innerRadius={60}
                    data={[
                      { value: totalDespesasConjuntas, color: progressBarColor },
                      { value: Math.max(tetoLimit - totalDespesasConjuntas, 0), color: Colors.border },
                    ]}
                    centerLabelComponent={() => (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: progressBarColor }}>{progressPercentage}%</Text>
                      </View>
                    )}
                  />
                  <Text style={styles.limitText}>Gasto: R$ {totalDespesasConjuntas.toFixed(2)} / R$ {tetoLimit.toFixed(2)}</Text>

                  {progressPercentage >= 80 && (
                    <View style={styles.alertBox}>
                      <Feather name="alert-triangle" size={20} color={Colors.warning} />
                      <Text style={styles.alertText}>Atenção: O grupo atingiu {progressPercentage}% do limite mensal!</Text>
                    </View>
                  )}
                </View>

                <View style={styles.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <Text style={styles.cardTitle}>Membros do Grupo</Text>
                    <Feather name="users" size={24} color={Colors.jointPrimary} />
                  </View>

                  {activeMembers.length > 0 ? (
                    activeMembers.map((member) => (
                      <View key={member.id_usuario} style={styles.memberRow}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberInitials}>{member.nome.substring(0, 2).toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.memberName}>{member.nome} {member.id_usuario === user?.id_usuario && "(Você)"}</Text>
                          <Text style={styles.memberRole}>{member.papel === 'PROPRIETARIO' ? 'Administrador' : 'Membro'}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: Colors.textMuted }}>Carregando membros...</Text>
                  )}

                  <View style={styles.inviteButtonContainer}>
                    <Text style={styles.inviteLink} onPress={handleShowInviteCode}>
                      <Feather name="plus" size={16} /> Convidar novo membro
                    </Text>
                  </View>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* MODAL: CRIAR CARTEIRA */}
      <Modal visible={modalCreateVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Criar Carteira Conjunta</Text>
            <Text style={styles.modalLabel}>Nome da Carteira</Text>
            <TextInput style={styles.modalInput} placeholder="Ex: Viagem pro Chile" value={newWalletName} onChangeText={setNewWalletName} />
            <Text style={styles.modalLabel}>Limite Mensal (R$)</Text>
            <TextInput style={styles.modalInput} placeholder="Ex: 5000" value={newWalletLimit} onChangeText={setNewWalletLimit} keyboardType="numeric" />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => setModalCreateVisible(false)}>
                <Text style={{ color: '#64748B', fontWeight: 'bold' }}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: Colors.jointPrimary }]} onPress={handleCreateWallet} disabled={loadingAction}>
                {loadingAction ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold' }}>Criar</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: EDITAR CARTEIRA */}
      <Modal visible={modalEditVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Carteira</Text>
            <Text style={styles.modalLabel}>Novo Nome</Text>
            <TextInput style={styles.modalInput} placeholder="Ex: Despesas de Casa" value={newWalletName} onChangeText={setNewWalletName} />
            <Text style={styles.modalLabel}>Novo Limite Mensal (R$)</Text>
            <TextInput style={styles.modalInput} placeholder="Ex: 8000" value={newWalletLimit} onChangeText={setNewWalletLimit} keyboardType="numeric" />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => setModalEditVisible(false)}>
                <Text style={{ color: '#64748B', fontWeight: 'bold' }}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: Colors.jointPrimary }]} onPress={handleEditWallet} disabled={loadingAction}>
                {loadingAction ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold' }}>Salvar</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: ENTRAR COM CÓDIGO */}
      <Modal visible={modalJoinVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Entrar em Carteira</Text>
            <Text style={styles.modalLabel}>Código de Convite</Text>
            <TextInput style={styles.modalInput} placeholder="Ex: JOIN-A1B2C3" value={joinCode} onChangeText={setJoinCode} autoCapitalize="characters" />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => setModalJoinVisible(false)}>
                <Text style={{ color: '#64748B', fontWeight: 'bold' }}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: Colors.jointPrimary }]} onPress={handleJoinWallet} disabled={loadingAction}>
                {loadingAction ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold' }}>Entrar</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: SETTINGS */}
      <Modal visible={modalSettingsVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Opções da Carteira</Text>
            <View style={{ gap: 15, marginTop: 10 }}>
              {currentUserRole === 'PROPRIETARIO' ? (
                <>
                  <Pressable style={styles.settingsMenuBtn} onPress={openEditModal}>
                    <Feather name="edit" size={20} color={Colors.textPrimary} />
                    <Text style={styles.settingsMenuText}>Editar Carteira</Text>
                  </Pressable>
                  <Pressable style={styles.settingsMenuBtn} onPress={openDeleteFromSettings}>
                    <Feather name="trash-2" size={20} color={Colors.error} />
                    <Text style={[styles.settingsMenuText, { color: Colors.error }]}>Apagar Carteira</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable style={styles.settingsMenuBtn} onPress={openLeaveFromSettings}>
                  <Feather name="log-out" size={20} color={Colors.error} />
                  <Text style={[styles.settingsMenuText, { color: Colors.error }]}>Sair da Carteira</Text>
                </Pressable>
              )}
              <Pressable style={[styles.settingsMenuBtn, { justifyContent: 'center', backgroundColor: '#F1F5F9', borderWidth: 0 }]} onPress={() => setModalSettingsVisible(false)}>
                <Text style={{ fontWeight: 'bold', color: Colors.textPrimary }}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {user?.id_carteira_conjunta && viewMode === 'INICIO' && (
        <Pressable style={styles.fab} onPress={() => router.push('/transaction-form?carteira=CONJUNTA')}>
          <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>+</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 50, paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xl },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: Colors.textPrimary },
  settingsIcon: { padding: 8 },
  content: { flex: 1, paddingHorizontal: 20, paddingBottom: 50 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center", marginBottom: 20, elevation: 5 },
  title: { fontSize: 22, fontWeight: "bold", color: Colors.textPrimary, marginBottom: 12, textAlign: "center" },
  subtitle: { color: Colors.textGray, textAlign: "center", lineHeight: 24, fontSize: 16 },
  btnPrimary: { flexDirection: 'row', backgroundColor: Colors.jointPrimary, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnPrimaryText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  btnSecondary: { flexDirection: 'row', backgroundColor: Colors.jointLight, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: Colors.jointPrimary },
  btnSecondaryText: { color: Colors.jointPrimary, fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: Colors.surface, padding: 20, borderRadius: 20, width: '100%', alignItems: 'center', marginBottom: 20, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 20, width: '100%' },
  limitText: { marginTop: 16, color: Colors.textMuted, fontWeight: '600' },
  alertBox: { flexDirection: 'row', backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15, gap: 10, width: '100%' },
  alertText: { color: '#92400E', fontSize: 12, fontWeight: 'bold', flex: 1 },
  memberRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 15, gap: 15 },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.jointPrimary + '20', justifyContent: 'center', alignItems: 'center' },
  memberInitials: { color: Colors.jointPrimary, fontWeight: 'bold' },
  memberName: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary },
  memberRole: { fontSize: 12, color: Colors.textMuted },
  inviteButtonContainer: { width: '100%', marginTop: 10, borderTopWidth: 1, borderColor: Colors.border, paddingTop: 15 },
  inviteLink: { color: Colors.jointPrimary, fontWeight: 'bold', textAlign: 'center', padding: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', width: '85%', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 20, textAlign: 'center' },
  modalLabel: { fontSize: 12, fontWeight: 'bold', color: Colors.textSecondary, marginBottom: 8, marginTop: 10 },
  modalInput: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 16, fontSize: 16, color: Colors.textPrimary, marginBottom: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 20 },
  modalBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  settingsMenuBtn: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  settingsMenuText: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary },
  ringContainer: { alignSelf: 'center', width: 200, height: 200, borderRadius: 100, borderWidth: 15, borderColor: Colors.jointPrimary, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  ringInner: { alignItems: 'center' },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Colors.surface, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, marginBottom: 20 },
  monthLabel: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary },
  summaryCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.border, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryItemLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  summaryItemValue: { fontSize: 16, fontWeight: 'bold' },
  summaryDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  chartContainer: { backgroundColor: Colors.surface, borderRadius: 20, padding: 20, paddingBottom: 30, marginBottom: 20, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  chartTitle: { fontSize: 14, fontWeight: "bold", color: Colors.textSecondary, marginBottom: 20 },
  fab: { position: 'absolute', bottom: 100, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.jointPrimary, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.jointPrimary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5, zIndex: 1000 },
});
