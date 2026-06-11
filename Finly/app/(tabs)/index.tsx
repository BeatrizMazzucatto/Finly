import React from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { getCategoryColor } from "@/constants/categories";
import { TransactionItem } from "@/components/ui/TransactionItem";
import { CategoryCard } from "@/components/CategoryCard";
import { Chip } from "@/components/ui";
import { useDashboardViewModel } from "@/src/viewmodels/useDashboardViewModel";
import { router } from "expo-router";
import { Colors } from "@/constants/theme";

export default function DashboardScreen() {
  const {
    user,
    recentTransactions,
    loadingData,
    refreshing,
    modalVisible,
    focusedCat,
    chartType,
    walletFilter,
    saldo,
    totalDespesas,
    totalReceitas,
    expensesByCategory,
    incomesByCategory,
    setModalVisible,
    setFocusedCat,
    setChartType,
    setWalletFilter,
    handleRefresh,
    formatCurrency,
    formatDate,
  } = useDashboardViewModel();

  const activeCats = chartType === "DESPESA" ? expensesByCategory : incomesByCategory;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.dashHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                {user?.nome ? user.nome.substring(0, 2).toUpperCase() : 'US'}
              </Text>
            </View>
            <View>
              <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600' }}>Olá!</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0F172A' }}>{user?.nome}</Text>
            </View>
          </View>
        </View>

        {/* Wallet Filter Toggle Removido (Apenas Pessoal) */}

        <View style={styles.balanceContainer}>
          <Text style={{ color: '#64748B', fontSize: 14, fontWeight: '600', textTransform: 'uppercase' }}>Balanço do Período</Text>
          <Text style={{ fontSize: 38, fontWeight: 'bold', color: '#0F172A' }}>{formatCurrency(saldo)}</Text>
        </View>

        {/* Chart Type Toggle */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
          <Pressable onPress={() => { setChartType("DESPESA"); setFocusedCat(null); }} style={[{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }, chartType === "DESPESA" ? { backgroundColor: '#FEE2E2' } : { backgroundColor: 'transparent' }]}>
            <Text style={{ color: chartType === "DESPESA" ? '#EF4444' : '#64748B', fontWeight: 'bold' }}>Despesas</Text>
          </Pressable>
          <Pressable onPress={() => { setChartType("RECEITA"); setFocusedCat(null); }} style={[{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }, chartType === "RECEITA" ? { backgroundColor: '#D1FAE5' } : { backgroundColor: 'transparent' }]}>
            <Text style={{ color: chartType === "RECEITA" ? '#10B981' : '#64748B', fontWeight: 'bold' }}>Receitas</Text>
          </Pressable>
        </View>

        {/* Pie Chart */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          {Object.entries(activeCats).length > 0 ? (
            <PieChart
              data={Object.entries(activeCats).map(([cat, val]) => ({
                value: val,
                color: getCategoryColor(cat),
                focused: focusedCat?.name === cat,
                onPress: () => {
                  if (focusedCat?.name === cat) setFocusedCat(null);
                  else setFocusedCat({ name: cat, value: val });
                },
              }))}
              donut
              focusOnPress
              toggleFocusOnPress
              radius={100}
              innerRadius={70}
              innerCircleColor={'#F8FAFC'}
              centerLabelComponent={() => {
                if (focusedCat) {
                  return (
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, color: getCategoryColor(focusedCat.name), fontWeight: 'bold' }}>{focusedCat.name}</Text>
                      <Text style={{ fontSize: 20, color: '#0F172A', fontWeight: 'bold' }}>{formatCurrency(focusedCat.value)}</Text>
                    </View>
                  );
                }
                return (
                  <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: '#64748B', fontWeight: 'bold' }}>{chartType === "DESPESA" ? "Despesas" : "Receitas"}</Text>
                    <Text style={{ fontSize: 20, color: chartType === "DESPESA" ? '#EF4444' : '#10B981', fontWeight: 'bold' }}>
                      {formatCurrency(chartType === "DESPESA" ? totalDespesas : totalReceitas)}
                    </Text>
                  </View>
                );
              }}
            />
          ) : (
            <View style={styles.ringContainer}>
              <View style={styles.ringInner}>
                <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600' }}>{chartType === "DESPESA" ? "Despesas" : "Receitas"}</Text>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0F172A' }}>
                  {formatCurrency(chartType === "DESPESA" ? totalDespesas : totalReceitas)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Category Cards */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {chartType === 'DESPESA' ? 'Gastos por Categoria' : 'Receitas por Categoria'}
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
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

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transações Recentes</Text>
        </View>

        {loadingData ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
        ) : recentTransactions.length === 0 ? (
          <Text style={{ color: '#64748B', textAlign: 'center', marginTop: 20 }}>Nenhuma transação cadastrada.</Text>
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
              data={formatDate(t.data_transacao)}
              style={{ marginBottom: 12 }}
            />
          ))
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => router.push('/transaction-form?carteira=PESSOAL')}>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  dashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  walletToggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, shadowColor: 'black', shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 },
  balanceContainer: { alignItems: 'center', marginBottom: 40 },
  ringContainer: { alignSelf: 'center', width: 200, height: 200, borderRadius: 100, borderWidth: 15, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  ringInner: { alignItems: 'center' },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  fab: { position: 'absolute', bottom: 100, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5, zIndex: 1000 },
});
