import React, { useState, useEffect, useMemo } from "react";
import { StyleSheet, Text, View, StatusBar, Platform, Alert, Modal, TextInput, Pressable, ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { Transaction } from "@/src/types/api";
import { getTransactionsByUser } from "@/src/services/transactions";
import { PieChart } from "react-native-gifted-charts";
import { TransactionItem } from "@/components/ui";
import { CATEGORIAS, getCategoryColor } from "@/constants/categories";
import { formatCurrency, formatCurrencyShort } from "@/utils/formatters";
import { router } from "expo-router";
import { apiRequest } from "@/src/services/api";
import { CategoryCard } from "@/components/CategoryCard";

const showAlert = (title: string, message: string) => {
  if (Platform.OS === "web") {
    window.alert(`${title}: \n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function GroupsScreen() {
  const { user, updateUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tetoLimit, setTetoLimit] = useState(0);
  const [activeMembers, setActiveMembers] = useState<{id_usuario: number, nome: string, papel: string}[]>([]);

  const [modalCreateVisible, setModalCreateVisible] = useState(false);
  const [modalJoinVisible, setModalJoinVisible] = useState(false);
  const [modalEditVisible, setModalEditVisible] = useState(false);
  const [modalSettingsVisible, setModalSettingsVisible] = useState(false);

  const [currentWalletName, setCurrentWalletName] = useState("");
  const [newWalletName, setNewWalletName] = useState("");
  const [newWalletLimit, setNewWalletLimit] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [chartType, setChartType] = useState<'DESPESA' | 'RECEITA'>('DESPESA');
  const [focusedCat, setFocusedCat] = useState<{name: string, value: number} | null>(null);

  async function loadTransactions(isPullToRefresh = false) {
    if (!user?.id_usuario || !user?.id_carteira_conjunta) return;
    try {
      if (isPullToRefresh) setRefreshing(true);
      const data = await getTransactionsByUser(user.id_usuario);
      const jointData = data.filter(t => t.id_carteira === user.id_carteira_conjunta);
      // Sort newest first
      jointData.sort((a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime());
      setTransactions(jointData);
    } catch (err) {
      console.error("Erro ao carregar transações no grupo:", err);
    } finally {
      setRefreshing(false);
    }
  }

  async function loadWalletData() {
    if (!user?.id_carteira_conjunta) return;
    try {
      const resLimite = await fetch(`${API_URL}/carteiras/${user.id_carteira_conjunta}/limite`);
      if (resLimite.ok) {
        const data = await resLimite.json();
        setTetoLimit(Number(data.limite) || 2000);
        if (data.nome) setCurrentWalletName(data.nome);
      }
      
      const resMembros = await fetch(`${API_URL}/carteiras/${user.id_carteira_conjunta}/membros`);
      if (resMembros.ok) {
        const data = await resMembros.json();
        setActiveMembers(data);
      }
    } catch (err) {
      console.error("Erro ao carregar dados da carteira:", err);
    }
  }

  useEffect(() => {
    loadTransactions();
    loadWalletData();
  }, [user?.id_usuario, user?.id_carteira_conjunta]);

  const currentUserRole = useMemo(() => {
    const m = activeMembers.find(m => m.id_usuario === user?.id_usuario);
    return m?.papel || 'MEMBRO';
  }, [activeMembers, user?.id_usuario]);

  const handleShowInviteCode = async () => {
    if (!user?.id_carteira_conjunta) return;
    try {
      const res = await fetch(`${API_URL}/carteiras/${user.id_carteira_conjunta}/codigo`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const inviteCode = data.codigo;
      
      if (Platform.OS === "web") {
        const copy = window.confirm(`Convidar Membro\n\nCompartilhe o código abaixo:\n\n${inviteCode}\n\nDeseja copiar?`);
        if (copy) showAlert("Copiado!", "Código copiado para a área de transferência.");
      } else {
        Alert.alert("Convidar Membro", `Código: ${inviteCode}`, [
          { text: "Copiar", onPress: () => Alert.alert("Copiado!") },
          { text: "Fechar", style: "cancel" }
        ]);
      }
    } catch (err) {
      showAlert("Erro", "Não foi possível gerar código de convite.");
    }
  };

  const handleCreateWallet = async () => {
    if (!newWalletName.trim()) return showAlert("Erro", "Nome é obrigatório.");
    setLoadingAction(true);
    try {
      const res = await fetch(`${API_URL}/carteiras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newWalletName, limite_gastos_mensal: Number(newWalletLimit) || 0, id_usuario: user?.id_usuario })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      
      await updateUser({ ...user!, id_carteira_conjunta: data.id_carteira });
      setModalCreateVisible(false);
      showAlert("Sucesso!", `Carteira criada. Seu código de convite é: ${data.codigo_convite}`);
    } catch (err: any) {
      showAlert("Erro", err.message || "Falha ao criar carteira.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleJoinWallet = async () => {
    if (!joinCode.trim()) return showAlert("Erro", "Código é obrigatório.");
    setLoadingAction(true);
    try {
      const res = await fetch(`${API_URL}/carteiras/entrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo_convite: joinCode, id_usuario: user?.id_usuario })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      
      await updateUser({ ...user!, id_carteira_conjunta: data.id_carteira });
      setModalJoinVisible(false);
      showAlert("Sucesso!", "Você entrou na carteira conjunta!");
    } catch (err: any) {
      showAlert("Erro", err.message || "Falha ao entrar na carteira.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEditWallet = async () => {
    // allow empty name to skip update
    setLoadingAction(true);
    try {
      const res = await fetch(`${API_URL}/carteiras/${user?.id_carteira_conjunta}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newWalletName, limite_gastos_mensal: Number(newWalletLimit) || 0 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      
      setModalEditVisible(false);
      showAlert("Sucesso!", "Carteira atualizada.");
      loadWalletData(); // Refresh limit
    } catch (err: any) {
      showAlert("Erro", err.message || "Falha ao editar carteira.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleLeaveWallet = async () => {
    const confirm = Platform.OS === 'web' ? window.confirm("Tem certeza que deseja sair desta carteira conjunta?") : true;
    
    const executeLeave = async () => {
      try {
        const res = await fetch(`${API_URL}/carteiras/${user?.id_carteira_conjunta}/membros/${user?.id_usuario}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        await updateUser({ ...user!, id_carteira_conjunta: null });
        showAlert("Sucesso", "Você saiu da carteira.");
      } catch (err) {
        showAlert("Erro", "Falha ao sair.");
      }
    };

    if (Platform.OS === 'web') {
      if (confirm) executeLeave();
    } else {
      Alert.alert("Sair", "Deseja mesmo sair?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", style: "destructive", onPress: executeLeave }
      ]);
    }
  };

  const handleDeleteWallet = async () => {
    const confirm = Platform.OS === 'web' ? window.confirm("Apagar carteira e todas despesas vinculadas?") : true;
    
    const executeDelete = async () => {
      try {
        const res = await fetch(`${API_URL}/carteiras/${user?.id_carteira_conjunta}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        await updateUser({ ...user!, id_carteira_conjunta: null });
        showAlert("Sucesso", "Carteira apagada.");
      } catch (err) {
        showAlert("Erro", "Falha ao apagar.");
      }
    };

    if (Platform.OS === 'web') {
      if (confirm) executeDelete();
    } else {
      Alert.alert("Apagar", "Esta ação é irreversível.", [
        { text: "Cancelar", style: "cancel" },
        { text: "Apagar", style: "destructive", onPress: executeDelete }
      ]);
    }
  };

  const showSettingsMenu = () => {
    setModalSettingsVisible(true);
  };

  const monthFilters = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    
    const uniqueMonths = new Set<string>();
    const list: {label: string, month: number, year: number}[] = [];
    const currentYear = new Date().getFullYear();
    
    transactions.forEach(t => {
      const parts = t.data_transacao.split("-");
      if (parts.length >= 2) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed
        const key = `${year}-${month}`;
        
        if (!uniqueMonths.has(key)) {
          uniqueMonths.add(key);
          list.push({
            label: year === currentYear ? months[month] : `${months[month]} ${year}`,
            month,
            year
          });
        }
      }
    });
    
    list.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    
    return list;
  }, [transactions]);

  const [activeMonthFilter, setActiveMonthFilter] = useState<{
    label: string;
    month: number;
    year: number;
  } | null>(null);

  useEffect(() => {
    if (monthFilters.length > 0 && !activeMonthFilter) {
      setActiveMonthFilter(monthFilters[monthFilters.length - 1]);
    }
  }, [monthFilters]);

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];
    if (activeMonthFilter) {
      filtered = filtered.filter((t) => {
        const parts = t.data_transacao.split("-");
        if (parts.length >= 2) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          return year === activeMonthFilter.year && month === activeMonthFilter.month;
        }
        return false;
      });
    }
    return filtered;
  }, [transactions, activeMonthFilter]);

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

  const totalDespesasConjuntas = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.tipo === "DESPESA")
      .reduce((sum, item) => sum + Number(item.valor), 0);
  }, [filteredTransactions]);

  const progressPercentage = useMemo(() => {
    if (tetoLimit <= 0) return 0;
    return Math.min(100, Math.round((totalDespesasConjuntas / tetoLimit) * 100));
  }, [totalDespesasConjuntas, tetoLimit]);

  const progressBarColor = useMemo(() => {
    if (progressPercentage >= 100) return Colors.error;
    if (progressPercentage >= 80) return Colors.warning;
    return Colors.jointPrimary;
  }, [progressPercentage]);

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
        id_carteira: String(item.id_carteira ?? 1),
      },
    });
  }

  function handleDelete(item: Transaction) {
    const doDelete = async () => {
      try {
        await apiRequest(`/transacoes/${item.id_transacao}`, { method: "DELETE" });
        await loadTransactions();
      } catch (err) {
        showAlert("Erro", err instanceof Error ? err.message : "Não foi possível excluir.");
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Excluir transação\n\nDeseja excluir "${item.titulo}"?`)) doDelete();
    } else {
      Alert.alert("Excluir transação", `Deseja excluir "${item.titulo}"?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: doDelete },
      ]);
    }
  }

  function formatDateHeader(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === today.toISOString().split("T")[0]) return "Hoje";
    if (dateStr === yesterday.toISOString().split("T")[0]) return "Ontem";
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  }

  // Agrupar transações por data
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((t) => {
      const date = t.data_transacao;
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
    });
    return groups;
  }, [filteredTransactions]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={styles.headerTitle}>Carteira Conjunta</Text>
        {user?.id_carteira_conjunta && (
          <Pressable onPress={showSettingsMenu} style={styles.settingsIcon}>
            <Feather name="settings" size={24} color={Colors.textPrimary} />
          </Pressable>
        )}
      </View>

      <ScrollView 
        style={styles.content} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { loadTransactions(true); loadWalletData(); }} />}
        showsVerticalScrollIndicator={false}
      >
        {!user?.id_carteira_conjunta ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <View style={styles.iconContainer}>
              <Feather name="users" size={40} color={Colors.primary} />
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
            {monthFilters.length > 0 && activeMonthFilter && (
              <View style={styles.monthSelector}>
                <Pressable 
                  style={styles.monthArrow} 
                  onPress={() => {
                    const currentIndex = monthFilters.findIndex(m => m.month === activeMonthFilter.month && m.year === activeMonthFilter.year);
                    if (currentIndex > 0) setActiveMonthFilter(monthFilters[currentIndex - 1]);
                  }}
                >
                  <Feather name="chevron-left" size={24} color={
                    monthFilters.findIndex(m => m.month === activeMonthFilter.month && m.year === activeMonthFilter.year) > 0 
                      ? Colors.textPrimary : Colors.textMuted
                  } />
                </Pressable>
                
                <Text style={styles.monthLabel}>{activeMonthFilter.label}</Text>
                
                <Pressable 
                  style={styles.monthArrow}
                  onPress={() => {
                    const currentIndex = monthFilters.findIndex(m => m.month === activeMonthFilter.month && m.year === activeMonthFilter.year);
                    if (currentIndex < monthFilters.length - 1) setActiveMonthFilter(monthFilters[currentIndex + 1]);
                  }}
                >
                  <Feather name="chevron-right" size={24} color={
                    monthFilters.findIndex(m => m.month === activeMonthFilter.month && m.year === activeMonthFilter.year) < monthFilters.length - 1 
                      ? Colors.textPrimary : Colors.textMuted
                  } />
                </Pressable>
              </View>
            )}

            <View style={[styles.card, { alignItems: 'stretch' }]}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <Text style={{fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary}}>Equipe do Grupo</Text>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  {activeMembers.map((m, i) => (
                    <View key={m.id_usuario} style={{width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.jointPrimary, marginLeft: i > 0 ? -10 : 0, borderWidth: 2, borderColor: 'white', justifyContent: 'center', alignItems: 'center'}}>
                      <Text style={{color: 'white', fontSize: 10, fontWeight: 'bold'}}>{m.nome.substring(0,2).toUpperCase()}</Text>
                    </View>
                  ))}
                  <Pressable onPress={handleShowInviteCode} style={{width: 30, height: 30, borderRadius: 15, backgroundColor: '#F1F5F9', marginLeft: -10, borderWidth: 2, borderColor: 'white', justifyContent: 'center', alignItems: 'center'}}>
                    <Feather name="plus" size={14} color={Colors.jointPrimary} />
                  </Pressable>
                </View>
              </View>

              <View style={{marginTop: 20}}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5}}>
                  <Text style={{fontSize: 12, color: Colors.textSecondary, fontWeight: 'bold', textTransform: 'uppercase'}}>Limite Mensal</Text>
                  <Text style={{fontSize: 12, color: Colors.textPrimary, fontWeight: 'bold'}}>{formatCurrencyShort(totalDespesasConjuntas)} / {formatCurrencyShort(tetoLimit)}</Text>
                </View>
                <View style={{height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden'}}>
                  <View style={{height: '100%', width: `${progressPercentage}%`, backgroundColor: progressBarColor}} />
                </View>
                {progressPercentage >= 80 && (
                  <Text style={{color: Colors.warning, fontSize: 10, marginTop: 5, fontWeight: 'bold'}}>Atenção: O grupo atingiu {progressPercentage}% do limite mensal!</Text>
                )}
              </View>
            </View>

            <View style={styles.balanceContainer}>
              <Text style={{color: '#64748B', fontSize: 14, fontWeight: '600', textTransform: 'uppercase'}}>Balanço do Período</Text>
              <Text style={{fontSize: 38, fontWeight: 'bold', color: '#0F172A'}}>{formatCurrency(saldo)}</Text>
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
              <Text style={styles.sectionTitle}>
                {chartType === 'DESPESA' ? 'Gastos por Categoria' : 'Receitas por Categoria'}
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 12, paddingBottom: 16, marginBottom: 20}}>
              {Object.entries(chartType === 'DESPESA' ? expensesByCategory : incomesByCategory).length === 0 ? (
                <Text style={{color: '#64748B', paddingHorizontal: 16}}>
                  {chartType === 'DESPESA' ? 'Nenhum gasto registrado.' : 'Nenhuma receita registrada.'}
                </Text>
              ) : (
                Object.entries(chartType === 'DESPESA' ? expensesByCategory : incomesByCategory).map(([cat, val]) => (
                  <CategoryCard key={cat} category={cat} value={val} formatCurrency={formatCurrency} />
                ))
              )}
            </ScrollView>

            {/* Histórico Conjunto */}
            <View style={{ width: '100%', marginBottom: 30 }}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
                <Text style={styles.cardTitle}>Últimas Transações</Text>
                <Pressable onPress={() => router.push({ pathname: '/transaction-form', params: { id_carteira: String(user?.id_carteira_conjunta) } })}>
                  <Feather name="plus-circle" size={24} color={Colors.jointPrimary} />
                </Pressable>
              </View>

              {filteredTransactions.length === 0 ? (
                <View style={[styles.card, { alignItems: 'center', paddingVertical: 40 }]}>
                  <Feather name="inbox" size={40} color={Colors.textMuted} />
                  <Text style={{ color: Colors.textPrimary, fontWeight: 'bold', marginTop: 10 }}>Nenhuma transação</Text>
                  <Text style={{ color: Colors.textMuted, textAlign: 'center', marginTop: 5 }}>Nenhuma transação neste mês.</Text>
                </View>
              ) : (
                Object.entries(groupedTransactions).map(([date, items]) => (
                  <View key={date} style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 10 }}>
                      {formatDateHeader(date)}
                    </Text>
                    <View style={{ gap: 10 }}>
                      {items.map((item) => (
                        <TransactionItem
                          key={item.id_transacao}
                          id={item.id_transacao}
                          id_carteira={item.id_carteira}
                          usuario_nome={item.usuario_nome}
                          titulo={item.titulo}
                          valor={Number(item.valor)}
                          tipo={item.tipo}
                          categoria={item.categoria ?? "Outros"}
                          data={item.data_transacao}
                          showActions
                          onEdit={() => handleEdit(item)}
                          onDelete={() => handleDelete(item)}
                        />
                      ))}
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* MODAL: CRIAR CARTEIRA */}
      <Modal visible={modalCreateVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Criar Carteira Conjunta</Text>
            
            <Text style={styles.modalLabel}>Nome da Carteira</Text>
            <TextInput 
              style={styles.modalInput} 
              placeholder="Ex: Viagem pro Chile" 
              value={newWalletName} 
              onChangeText={setNewWalletName} 
            />

            <Text style={styles.modalLabel}>Limite Mensal (R$)</Text>
            <TextInput 
              style={styles.modalInput} 
              placeholder="Ex: 5000" 
              value={newWalletLimit} 
              onChangeText={setNewWalletLimit} 
              keyboardType="numeric" 
            />

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => setModalCreateVisible(false)}>
                <Text style={{color: '#64748B', fontWeight: 'bold'}}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: Colors.jointPrimary }]} onPress={handleCreateWallet} disabled={loadingAction}>
                {loadingAction ? <ActivityIndicator color="white" /> : <Text style={{color: 'white', fontWeight: 'bold'}}>Criar</Text>}
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
            <TextInput 
              style={styles.modalInput} 
              placeholder="Ex: Despesas de Casa" 
              value={newWalletName} 
              onChangeText={setNewWalletName} 
            />

            <Text style={styles.modalLabel}>Novo Limite Mensal (R$)</Text>
            <TextInput 
              style={styles.modalInput} 
              placeholder="Ex: 8000" 
              value={newWalletLimit} 
              onChangeText={setNewWalletLimit} 
              keyboardType="numeric" 
            />

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => setModalEditVisible(false)}>
                <Text style={{color: '#64748B', fontWeight: 'bold'}}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: Colors.jointPrimary }]} onPress={handleEditWallet} disabled={loadingAction}>
                {loadingAction ? <ActivityIndicator color="white" /> : <Text style={{color: 'white', fontWeight: 'bold'}}>Salvar</Text>}
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
            <TextInput 
              style={styles.modalInput} 
              placeholder="Ex: JOIN-A1B2C3" 
              value={joinCode} 
              onChangeText={setJoinCode} 
              autoCapitalize="characters"
            />

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => setModalJoinVisible(false)}>
                <Text style={{color: '#64748B', fontWeight: 'bold'}}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: Colors.jointPrimary }]} onPress={handleJoinWallet} disabled={loadingAction}>
                {loadingAction ? <ActivityIndicator color="white" /> : <Text style={{color: 'white', fontWeight: 'bold'}}>Entrar</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: SETTINGS (Cross-platform) */}
      <Modal visible={modalSettingsVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Opções da Carteira</Text>
            <View style={{ gap: 15, marginTop: 10 }}>
              {currentUserRole === 'PROPRIETARIO' ? (
                <>
                  <Pressable style={styles.settingsMenuBtn} onPress={() => { 
                    setModalSettingsVisible(false); 
                    setNewWalletName(currentWalletName);
                    setNewWalletLimit(tetoLimit.toString());
                    setModalEditVisible(true); 
                  }}>
                    <Feather name="edit" size={20} color={Colors.textPrimary} />
                    <Text style={styles.settingsMenuText}>Editar Carteira</Text>
                  </Pressable>
                  <Pressable style={styles.settingsMenuBtn} onPress={() => { setModalSettingsVisible(false); handleDeleteWallet(); }}>
                    <Feather name="trash-2" size={20} color={Colors.error} />
                    <Text style={[styles.settingsMenuText, { color: Colors.error }]}>Apagar Carteira</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable style={styles.settingsMenuBtn} onPress={() => { setModalSettingsVisible(false); handleLeaveWallet(); }}>
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 50, paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xl },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: Colors.textPrimary },
  settingsIcon: { padding: 8 },
  content: { flex: 1, paddingHorizontal: 20, paddingBottom: 50 },
  
  // Empty State
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center", marginBottom: 20, elevation: 5 },
  title: { fontSize: 22, fontWeight: "bold", color: Colors.textPrimary, marginBottom: 12, textAlign: "center" },
  subtitle: { color: Colors.textGray, textAlign: "center", lineHeight: 24, fontSize: 16 },
  
  // Buttons
  btnPrimary: { flexDirection: 'row', backgroundColor: Colors.jointPrimary, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnPrimaryText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  btnSecondary: { flexDirection: 'row', backgroundColor: Colors.jointLight, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: Colors.jointPrimary },
  btnSecondaryText: { color: Colors.jointPrimary, fontWeight: 'bold', fontSize: 16 },
  
  // Cards
  card: { backgroundColor: Colors.surface, padding: 20, borderRadius: 20, width: '100%', alignItems: 'center', marginBottom: 20, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 20, width: '100%' },
  limitText: { marginTop: 16, color: Colors.textMuted, fontWeight: '600' },
  
  // Alerts & Members
  alertBox: { flexDirection: 'row', backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15, gap: 10, width: '100%' },
  alertText: { color: '#92400E', fontSize: 12, fontWeight: 'bold', flex: 1 },
  memberRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 15, gap: 15 },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.jointPrimary + '20', justifyContent: 'center', alignItems: 'center' },
  memberInitials: { color: Colors.jointPrimary, fontWeight: 'bold' },
  memberName: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary },
  memberRole: { fontSize: 12, color: Colors.textMuted },
  inviteButtonContainer: { width: '100%', marginTop: 10, borderTopWidth: 1, borderColor: Colors.border, paddingTop: 15 },
  inviteLink: { color: Colors.jointPrimary, fontWeight: 'bold', textAlign: 'center', padding: 10 },
  
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', width: '85%', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 20, textAlign: 'center' },
  modalLabel: { fontSize: 12, fontWeight: 'bold', color: Colors.textSecondary, marginBottom: 8, marginTop: 10 },
  modalInput: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 16, fontSize: 16, color: Colors.textPrimary, marginBottom: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 20 },
  modalBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  settingsMenuBtn: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  settingsMenuText: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary },
  
  // Dashboard Styles
  balanceContainer: { alignItems: 'center', marginBottom: 20 },
  ringContainer: { alignSelf: 'center', width: 200, height: 200, borderRadius: 100, borderWidth: 15, borderColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  ringInner: { alignItems: 'center' },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },

  // Month Selector
  monthSelector: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.surface, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: 100, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  monthArrow: { padding: Spacing.xs },
  monthLabel: { fontSize: 16, fontWeight: "bold", color: Colors.textPrimary, textTransform: "capitalize" },
});
