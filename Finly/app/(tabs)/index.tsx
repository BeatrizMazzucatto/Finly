import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  StatusBar,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "@/src/context/AuthContext";
import { apiRequest } from "@/src/services/api";
import { getTransactionsByUser } from "@/src/services/transactions";
import type { Transaction } from "@/src/types/api";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing, Shadow } from "@/constants/theme";
import { Card, ProgressBar, TransactionItem } from "@/components/ui";
import { formatCurrency, getGreeting, getCurrentMonthYear } from "@/utils/formatters";

const { width } = Dimensions.get("window");
const LIMITE_KEY = "finly_limite_gastos";

export default function HomeScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limite, setLimite] = useState(2000);

  const totalReceitas = useMemo(
    () => transactions.filter((t) => t.tipo === "RECEITA").reduce((a, t) => a + Number(t.valor), 0),
    [transactions]
  );
  const totalDespesas = useMemo(
    () => transactions.filter((t) => t.tipo === "DESPESA").reduce((a, t) => a + Number(t.valor), 0),
    [transactions]
  );
  const saldo = totalReceitas - totalDespesas;
  const limiteProgress = (totalDespesas / limite) * 100;
  const recentTransactions = transactions.slice(0, 4);

  async function loadData(isPullToRefresh = false) {
    if (!user) return;
    try {
      setError(null);
      if (isPullToRefresh) setRefreshing(true);
      else setLoading(true);

      const [data, limiteStored] = await Promise.all([
        getTransactionsByUser(user.id_usuario),
        AsyncStorage.getItem(LIMITE_KEY),
      ]);

      if (limiteStored) setLimite(Number(limiteStored));

      const sorted = [...data].sort(
        (a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime()
      );
      setTransactions(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user?.id_usuario]);

  function handleEdit(item: Transaction) {
    router.push({
      pathname: "/transaction-form",
      params: {
        id_transacao: String(item.id_transacao),
        titulo: item.titulo,
        valor: String(item.valor),
        tipo: item.tipo,
        categoria_nome: item.categoria ?? "",
        data_transacao: item.data_transacao,
      },
    });
  }

  function handleDelete(item: Transaction) {
    Alert.alert(
      "Excluir transação",
      `Deseja excluir "${item.titulo}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await apiRequest(`/transacoes/${item.id_transacao}`, { method: "DELETE" });
              await loadData();
            } catch (err) {
              Alert.alert("Erro", err instanceof Error ? err.message : "Não foi possível excluir.");
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" />

      {/* Header com Saldo */}
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.nome ?? "Usuário"}</Text>
          </View>
          <Pressable style={styles.notificationBtn}>
            <Feather name="bell" size={22} color={Colors.textInverse} />
            <View style={styles.notificationBadge} />
          </Pressable>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo atual</Text>
          <Text style={[styles.balanceValue, { color: saldo >= 0 ? Colors.income : Colors.error }]}>
            {formatCurrency(saldo)}
          </Text>
          <Text style={styles.monthLabel}>{getCurrentMonthYear()}</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStatItem}>
            <View style={[styles.quickStatIcon, { backgroundColor: Colors.incomeLight }]}>
              <Feather name="arrow-up" size={16} color={Colors.income} />
            </View>
            <View>
              <Text style={styles.quickStatLabel}>Receitas</Text>
              <Text style={[styles.quickStatValue, { color: Colors.income }]}>
                {formatCurrency(totalReceitas)}
              </Text>
            </View>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <View style={[styles.quickStatIcon, { backgroundColor: Colors.expenseLight }]}>
              <Feather name="arrow-down" size={16} color={Colors.expense} />
            </View>
            <View>
              <Text style={styles.quickStatLabel}>Despesas</Text>
              <Text style={[styles.quickStatValue, { color: Colors.expense }]}>
                {formatCurrency(totalDespesas)}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Pressable style={styles.quickActionItem} onPress={() => router.push("/transaction-form")}>
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary + "15" }]}>
            <Feather name="plus" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.quickActionText}>Adicionar</Text>
        </Pressable>
        <Pressable style={styles.quickActionItem} onPress={() => router.push("/(tabs)/statistics")}>
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.secondary + "15" }]}>
            <Feather name="pie-chart" size={24} color={Colors.secondary} />
          </View>
          <Text style={styles.quickActionText}>Estatísticas</Text>
        </Pressable>
        <Pressable style={styles.quickActionItem} onPress={() => router.push("/(tabs)/history")}>
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.warning + "15" }]}>
            <Feather name="clock" size={24} color={Colors.warning} />
          </View>
          <Text style={styles.quickActionText}>Histórico</Text>
        </Pressable>
        <Pressable style={styles.quickActionItem} onPress={() => router.push("/(tabs)/settings")}>
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.textMuted + "15" }]}>
            <Feather name="settings" size={24} color={Colors.textMuted} />
          </View>
          <Text style={styles.quickActionText}>Config</Text>
        </Pressable>
      </View>

      {/* Limite de Gastos */}
      <Card style={styles.limiteCard}>
        <View style={styles.limiteHeader}>
          <View style={styles.limiteTitleRow}>
            <Feather name="shield" size={20} color={Colors.primary} />
            <Text style={styles.limiteTitle}>Limite de Gastos</Text>
          </View>
          <Text style={[
            styles.limitePercent,
            { color: limiteProgress > 80 ? Colors.error : limiteProgress > 60 ? Colors.warning : Colors.primary },
          ]}>
            {Math.round(limiteProgress)}%
          </Text>
        </View>
        <ProgressBar
          progress={limiteProgress}
          color={limiteProgress > 80 ? Colors.error : limiteProgress > 60 ? Colors.warning : Colors.primary}
          height={10}
          showOverflow
        />
        <View style={styles.limiteFooter}>
          <Text style={styles.limiteUsed}>{formatCurrency(totalDespesas)}</Text>
          <Text style={styles.limiteTotal}>de {formatCurrency(limite)}</Text>
        </View>
        {limiteProgress > 80 && (
          <View style={styles.limiteAlert}>
            <Feather name="alert-triangle" size={16} color={Colors.error} />
            <Text style={styles.limiteAlertText}>
              Você está próximo do limite mensal!
            </Text>
          </View>
        )}
      </Card>

      {/* Transações Recentes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Atividade Recente</Text>
          <Pressable onPress={() => router.push("/(tabs)/history")}>
            <Text style={styles.seeAllText}>Ver tudo</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator size="large" style={{ marginVertical: Spacing.xxl }} />
        ) : error ? (
          <Card variant="error" style={styles.errorCard}>
            <Feather name="alert-circle" size={24} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : recentTransactions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Feather name="inbox" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Nenhuma transação</Text>
            <Text style={styles.emptySubtitle}>
              Comece adicionando sua primeira transação
            </Text>
            <Pressable style={styles.emptyButton} onPress={() => router.push("/transaction-form")}>
              <Feather name="plus" size={18} color={Colors.textInverse} />
              <Text style={styles.emptyButtonText}>Adicionar transação</Text>
            </Pressable>
          </Card>
        ) : (
          <View style={styles.transactionsList}>
            {recentTransactions.map((item) => (
              <TransactionItem
                key={item.id_transacao}
                id={item.id_transacao}
                titulo={item.titulo}
                valor={Number(item.valor)}
                tipo={item.tipo}
                categoria={item.categoria ?? "Outros"}
                data={item.data_transacao}
                onPress={() => handleEdit(item)}
              />
            ))}
          </View>
        )}
      </View>

      {/* Dica do dia */}
      <Card style={styles.tipCard}>
        <View style={styles.tipIcon}>
          <Feather name="zap" size={20} color={Colors.warning} />
        </View>
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>Dica do dia</Text>
          <Text style={styles.tipText}>
            Defina metas de economia para alcançar seus objetivos financeiros mais rapidamente.
          </Text>
        </View>
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
    paddingBottom: 100,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: FontSize.sm,
    color: Colors.textInverse,
    opacity: 0.8,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  balanceCard: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  balanceLabel: {
    fontSize: FontSize.sm,
    color: Colors.textInverse,
    opacity: 0.8,
    marginBottom: Spacing.xs,
  },
  balanceValue: {
    fontSize: 40,
    fontWeight: FontWeight.bold,
  },
  monthLabel: {
    fontSize: FontSize.sm,
    color: Colors.textInverse,
    opacity: 0.7,
    marginTop: Spacing.xs,
  },
  quickStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  quickStatItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  quickStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  quickStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textInverse,
    opacity: 0.8,
  },
  quickStatValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: Spacing.lg,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    marginTop: -Spacing.xl,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadow.md,
  },
  quickActionItem: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  limiteCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  limiteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  limiteTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  limiteTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  limitePercent: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  limiteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  limiteUsed: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  limiteTotal: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  limiteAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  limiteAlertText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    flex: 1,
  },
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  seeAllText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  transactionsList: {
    gap: Spacing.sm,
  },
  errorCard: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  emptyButtonText: {
    color: Colors.textInverse,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  tipCard: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.warningLight,
    alignItems: "center",
    justifyContent: "center",
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  tipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});