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

import { TransactionItem } from "@/components/TransactionItem";
import { CategoryCard } from "@/components/CategoryCard";
import { TransactionModal, TransactionPayload } from "@/components/TransactionModal";

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
      const id_carteira = user.id_carteira_pessoal || 1; 
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

  const { saldo, totalDespesas, expensesByCategory } = useMemo(() => {
    let s = 0;
    let d = 0;
    let cats: Record<string, number> = {};

    transactions.forEach(t => {
      const val = Number(t.valor);
      if (t.tipo === "RECEITA") {
        s += val;
      } else {
        s -= val;
        d += val;
        const c = t.categoria || "Outros";
        cats[c] = (cats[c] || 0) + val;
      }
    });
    return { saldo: s, totalDespesas: d, expensesByCategory: cats };
  }, [transactions]);

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
            <Pressable onPress={() => Alert.alert("Notificações", "Você não tem novas notificações no momento.")}>
              <Feather name="bell" size={24} color="#0F172A" />
            </Pressable>
            <Pressable onPress={async () => { await logout(); router.replace("/login"); }} style={styles.logoutBtn}>
              <Text style={{color: '#EF4444', fontWeight: 'bold'}}>Sair</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.balanceContainer}>
          <Text style={{color: '#64748B', fontSize: 14, fontWeight: '600', textTransform: 'uppercase'}}>Saldo Disponível</Text>
          <Text style={{fontSize: 38, fontWeight: 'bold', color: '#0F172A'}}>{formatCurrency(saldo)}</Text>
        </View>

        <View style={styles.ringContainer}>
          <View style={styles.ringInner}>
            <Text style={{color: '#64748B', fontSize: 12, fontWeight: '600'}}>Despesas</Text>
            <Text style={{fontSize: 24, fontWeight: 'bold', color: '#0F172A'}}>{formatCurrency(totalDespesas)}</Text>
          </View>
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
              transaction={t} 
              formatCurrency={formatCurrency} 
              formatDate={formatDate} 
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  dashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  logoutBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#FEE2E2', borderRadius: 8 },
  balanceContainer: { alignItems: 'center', marginBottom: 40 },
  ringContainer: { alignSelf: 'center', width: 200, height: 200, borderRadius: 100, borderWidth: 15, borderColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  ringInner: { alignItems: 'center' },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
});