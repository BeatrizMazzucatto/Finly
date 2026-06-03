import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { format, parseISO } from "date-fns";
import { Transaction } from "@/src/types/api";

import { TransactionItem } from "@/components/ui/TransactionItem";
import { CategoryCard } from "@/components/CategoryCard";
import { TransactionModal, TransactionPayload } from "@/components/TransactionModal";
import { getCategoryColor } from "@/constants/categories";
import { PieChart } from "react-native-gifted-charts";
import { Chip } from "@/components/ui";

// Variável de ambiente
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "dd/MM");
  } catch {
    return dateStr;
  }
}

export default function DashboardScreen() {
  const { user, logout } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [focusedCat, setFocusedCat] = useState<{name: string, value: number} | null>(null);
  
  const [periodFilter, setPeriodFilter] = useState<'month' | '3months' | 'year' | 'all'>('month');
  const [chartType, setChartType] = useState<'DESPESA' | 'RECEITA'>('DESPESA');
  const [walletFilter, setWalletFilter] = useState<'AMBAS' | 'PESSOAL' | 'CONJUNTA'>('AMBAS');

  useEffect(() => {
    if (user?.id_usuario) {
      loadDashboardData(user.id_usuario);
    }
  }, [user?.id_usuario]);

  async function loadDashboardData(id: number, isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoadingData(true);
    
    try {
      const res = await fetch(`${API_URL}/transacoes/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setTransactions(data);
        else setTransactions([]);
      }
    } catch (err) {
      Alert.alert("Erro", "Falha ao carregar transações");
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  }

  async function createTransaction(payload: TransactionPayload) {
    if (!user) return;
    
    try {
      const today = new Date().toISOString().split("T")[0]; // Still useful to send to API in this format, or let DB handle it.
      const id_carteira = payload.carteira === 'CONJUNTA' 
        ? (user.id_carteira_conjunta || 3) 
        : (user.id_carteira_pessoal || 1); 
      const catMap: any = { "Alimentação": 1, "Transporte": 5, "Saúde": 7, "Moradia": 3, "Salário": 17 };
      
      const res = await fetch(`${API_URL}/transacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_carteira,
          id_usuario: user.id_usuario,
          id_categoria: catMap[payload.categoria] || 1,
          titulo: payload.titulo,
          tipo: payload.tipo,
          valor: payload.valor,
          data_transacao: today,
        }),
      });
      
      if (!res.ok) throw new Error("Erro ao salvar");
      setModalVisible(false);
      Alert.alert("Sucesso", "Transação salva com sucesso!");
      loadDashboardData(user.id_usuario);
    } catch (err: any) {
      Alert.alert("Erro", err.message);
      throw err; // throw to prevent modal from closing and clearing state
    }
  }

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions.filter(t => {
      // Wallet filter
      if (walletFilter === 'PESSOAL' && t.id_carteira !== user?.id_carteira_pessoal) return false;
      if (walletFilter === 'CONJUNTA' && t.id_carteira !== user?.id_carteira_conjunta) return false;

      // Period filter
      if (periodFilter === 'all') return true;

      const parts = t.data_transacao.split('-');
      if (parts.length < 2) return true;
      const transYear = parseInt(parts[0], 10);
      const transMonth = parseInt(parts[1], 10) - 1;

      if (periodFilter === 'month') {
        return transYear === currentYear && transMonth === currentMonth;
      }
      
      if (periodFilter === 'year') {
        return transYear === currentYear;
      }
      
      if (periodFilter === '3months') {
        const transDate = new Date(transYear, transMonth, 1);
        const threeMonthsAgo = new Date(currentYear, currentMonth - 2, 1);
        const endOfCurrent = new Date(currentYear, currentMonth + 1, 0);
        return transDate >= threeMonthsAgo && transDate <= endOfCurrent;
      }
      
      return true;
    });
  }, [transactions, periodFilter]);

  const { saldo, totalDespesas, totalReceitas, expensesByCategory, incomesByCategory } = useMemo(() => {
    let s = 0;
    let d = 0;
    let r = 0;
    let expCats: Record<string, number> = {};
    let incCats: Record<string, number> = {};

    filteredTransactions.forEach(t => {
      const val = Number(t.valor);
      const c = t.categoria || "Outros";
      if (t.tipo === "RECEITA") {
        s += val;
        r += val;
        incCats[c] = (incCats[c] || 0) + val;
      } else {
        s -= val;
        d += val;
        expCats[c] = (expCats[c] || 0) + val;
      }
    });
    return { saldo: s, totalDespesas: d, totalReceitas: r, expensesByCategory: expCats, incomesByCategory: incCats };
  }, [filteredTransactions]);

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {if(user) loadDashboardData(user.id_usuario, true)}} />}
      >
        <View style={styles.dashHeader}>
          <View>
            <Text style={{color: '#64748B', fontSize: 12, fontWeight: '600'}}>Olá, de novo!</Text>
            <Text style={{fontSize: 18, fontWeight: 'bold', color: '#0F172A'}}>{user?.nome}</Text>
          </View>
          <View style={{flexDirection: 'row', gap: 15, alignItems: 'center'}}>
            <Pressable onPress={async () => { await logout(); router.replace("/login"); }} style={styles.logoutBtn}>
              <Text style={{color: '#EF4444', fontWeight: 'bold'}}>Sair</Text>
            </Pressable>
          </View>
        </View>

        {/* Wallet Filter Toggle (Only show if user has joint wallet) */}
        {user?.id_carteira_conjunta && (
          <View style={{flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, marginBottom: 20}}>
            <Pressable style={[styles.walletToggleBtn, walletFilter === 'PESSOAL' && {backgroundColor: 'white', shadowOpacity: 0.1}]} onPress={() => setWalletFilter('PESSOAL')}>
              <Text style={{color: walletFilter === 'PESSOAL' ? '#4F46E5' : '#64748B', fontWeight: 'bold'}}>Pessoal</Text>
            </Pressable>
            <Pressable style={[styles.walletToggleBtn, walletFilter === 'AMBAS' && {backgroundColor: 'white', shadowOpacity: 0.1}]} onPress={() => setWalletFilter('AMBAS')}>
              <Text style={{color: walletFilter === 'AMBAS' ? '#0F172A' : '#64748B', fontWeight: 'bold'}}>Geral</Text>
            </Pressable>
            <Pressable style={[styles.walletToggleBtn, walletFilter === 'CONJUNTA' && {backgroundColor: 'white', shadowOpacity: 0.1}]} onPress={() => setWalletFilter('CONJUNTA')}>
              <Text style={{color: walletFilter === 'CONJUNTA' ? '#9333EA' : '#64748B', fontWeight: 'bold'}}>Conjunta</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.balanceContainer}>
          <Text style={{color: '#64748B', fontSize: 14, fontWeight: '600', textTransform: 'uppercase'}}>Balanço do Período</Text>
          <Text style={{fontSize: 38, fontWeight: 'bold', color: '#0F172A'}}>{formatCurrency(saldo)}</Text>
        </View>

        <View style={{flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 30}}>
          <Chip label="Este Mês" size="sm" selected={periodFilter === 'month'} onPress={() => setPeriodFilter('month')} />
          <Chip label="3 Meses" size="sm" selected={periodFilter === '3months'} onPress={() => setPeriodFilter('3months')} />
          <Chip label="Este Ano" size="sm" selected={periodFilter === 'year'} onPress={() => setPeriodFilter('year')} />
          <Chip label="Tudo" size="sm" selected={periodFilter === 'all'} onPress={() => setPeriodFilter('all')} />
        </View>

        <View style={{flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20}}>
          <Pressable onPress={() => {setChartType("DESPESA"); setFocusedCat(null);}} style={[{paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20}, chartType === "DESPESA" ? {backgroundColor: '#FEE2E2'} : {backgroundColor: 'transparent'}]}>
            <Text style={{color: chartType === "DESPESA" ? '#EF4444' : '#64748B', fontWeight: 'bold'}}>Despesas</Text>
          </Pressable>
          <Pressable onPress={() => {setChartType("RECEITA"); setFocusedCat(null);}} style={[{paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20}, chartType === "RECEITA" ? {backgroundColor: '#D1FAE5'} : {backgroundColor: 'transparent'}]}>
            <Text style={{color: chartType === "RECEITA" ? '#10B981' : '#64748B', fontWeight: 'bold'}}>Receitas</Text>
          </Pressable>
        </View>

        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          {chartType === "DESPESA" ? (
            Object.entries(expensesByCategory).length > 0 ? (
              <PieChart
                data={Object.entries(expensesByCategory).map(([cat, val]) => ({
                  value: val,
                  color: getCategoryColor(cat),
                  focused: focusedCat?.name === cat,
                  onPress: () => {
                    if (focusedCat?.name === cat) {
                      setFocusedCat(null);
                    } else {
                      setFocusedCat({ name: cat, value: val });
                    }
                  }
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
                      <View style={{justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{fontSize: 12, color: getCategoryColor(focusedCat.name), fontWeight: 'bold'}}>{focusedCat.name}</Text>
                        <Text style={{fontSize: 20, color: '#0F172A', fontWeight: 'bold'}}>{formatCurrency(focusedCat.value)}</Text>
                      </View>
                    );
                  }
                  return (
                    <View style={{justifyContent: 'center', alignItems: 'center'}}>
                      <Text style={{fontSize: 12, color: '#64748B', fontWeight: 'bold'}}>Despesas</Text>
                      <Text style={{fontSize: 20, color: '#EF4444', fontWeight: 'bold'}}>{formatCurrency(totalDespesas)}</Text>
                    </View>
                  );
                }}
              />
            ) : (
              <View style={styles.ringContainer}>
                <View style={styles.ringInner}>
                  <Text style={{color: '#64748B', fontSize: 12, fontWeight: '600'}}>Despesas</Text>
                  <Text style={{fontSize: 24, fontWeight: 'bold', color: '#0F172A'}}>{formatCurrency(totalDespesas)}</Text>
                </View>
              </View>
            )
          ) : (
            Object.entries(incomesByCategory).length > 0 ? (
              <PieChart
                data={Object.entries(incomesByCategory).map(([cat, val]) => ({
                  value: val,
                  color: getCategoryColor(cat),
                  focused: focusedCat?.name === cat,
                  onPress: () => {
                    if (focusedCat?.name === cat) {
                      setFocusedCat(null);
                    } else {
                      setFocusedCat({ name: cat, value: val });
                    }
                  }
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
                      <View style={{justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{fontSize: 12, color: getCategoryColor(focusedCat.name), fontWeight: 'bold'}}>{focusedCat.name}</Text>
                        <Text style={{fontSize: 20, color: '#0F172A', fontWeight: 'bold'}}>{formatCurrency(focusedCat.value)}</Text>
                      </View>
                    );
                  }
                  return (
                    <View style={{justifyContent: 'center', alignItems: 'center'}}>
                      <Text style={{fontSize: 12, color: '#64748B', fontWeight: 'bold'}}>Receitas</Text>
                      <Text style={{fontSize: 20, color: '#10B981', fontWeight: 'bold'}}>{formatCurrency(totalReceitas)}</Text>
                    </View>
                  );
                }}
              />
            ) : (
              <View style={styles.ringContainer}>
                <View style={styles.ringInner}>
                  <Text style={{color: '#64748B', fontSize: 12, fontWeight: '600'}}>Receitas</Text>
                  <Text style={{fontSize: 24, fontWeight: 'bold', color: '#0F172A'}}>{formatCurrency(totalReceitas)}</Text>
                </View>
              </View>
            )
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Gastos por Categoria</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 12, paddingBottom: 16}}>
          {Object.entries(expensesByCategory).length === 0 ? (
            <Text style={{color: '#64748B', paddingHorizontal: 16}}>Nenhum gasto registrado.</Text>
          ) : (
            Object.entries(expensesByCategory).map(([cat, val]) => (
              <CategoryCard key={cat} category={cat} value={val} formatCurrency={formatCurrency} />
            ))
          )}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transações Recentes</Text>
        </View>
        
        {loadingData ? (
          <ActivityIndicator size="large" color="#4F46E5" style={{marginVertical: 20}} />
        ) : transactions.length === 0 ? (
          <Text style={{color: '#64748B', textAlign: 'center', marginTop: 20}}>Nenhuma transação cadastrada.</Text>
        ) : (
          transactions.slice(0, 5).map((t, idx) => (
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
              style={{marginBottom: 12}}
            />
          ))
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={{color: 'white', fontSize: 24, fontWeight: 'bold'}}>+</Text>
      </Pressable>

      <TransactionModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onSave={createTransaction}
        hasJointWallet={!!user?.id_carteira_conjunta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  dashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logoutBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#FEE2E2', borderRadius: 8 },
  walletToggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, shadowColor: 'black', shadowOffset: {width: 0, height: 2}, shadowRadius: 4 },
  balanceContainer: { alignItems: 'center', marginBottom: 40 },
  ringContainer: { alignSelf: 'center', width: 200, height: 200, borderRadius: 100, borderWidth: 15, borderColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  ringInner: { alignItems: 'center' },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
});
