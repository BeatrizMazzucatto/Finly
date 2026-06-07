import { useState, useEffect, useMemo, useCallback } from "react";
import { Alert, Platform } from "react-native";
import { useAuth } from "@/src/context/AuthContext";
import { Transaction } from "@/src/types/api";
import { getTransactionsByUser, useTransactionSync } from "@/src/services/transactions";
import { apiRequest, API_BASE_URL } from "@/src/services/api";
import { Colors } from "@/constants/theme";
const MONTHS_LABEL = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const showAlert = (title: string, message: string) => {
  if (Platform.OS === "web") { window.alert(`${title}: \n${message}`); }
  else { Alert.alert(title, message); }
};

export function useGroupsViewModel() {
  const { user, updateUser } = useAuth();
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

  const { transactions, refresh } = useTransactionSync(user?.id_usuario);

  async function loadWalletData() {
    if (!user?.id_carteira_conjunta) return;
    try {
      const resLimite = await fetch(`${API_BASE_URL}/carteiras/${user.id_carteira_conjunta}/limite`);
      if (resLimite.ok) { const data = await resLimite.json(); setTetoLimit(Number(data.limite) || 2000); if (data.nome) setCurrentWalletName(data.nome); }
      const resMembros = await fetch(`${API_BASE_URL}/carteiras/${user.id_carteira_conjunta}/membros`);
      if (resMembros.ok) { const data = await resMembros.json(); setActiveMembers(data); }
    } catch (err) { console.error("Erro ao carregar dados da carteira:", err); }
  }

  useEffect(() => { loadWalletData(); }, [user?.id_usuario, user?.id_carteira_conjunta]);

  const currentUserRole = useMemo(() => {
    const m = activeMembers.find(m => m.id_usuario === user?.id_usuario);
    return m?.papel || 'MEMBRO';
  }, [activeMembers, user?.id_usuario]);

  async function handleShowInviteCode() {
    if (!user?.id_carteira_conjunta) return;
    try {
      const res = await fetch(`${API_BASE_URL}/carteiras/${user.id_carteira_conjunta}/codigo`);
      if (res.ok) {
        const data = await res.json();
        showAlert("Código de Convite", `Compartilhe este código: ${data.codigo_convite}`);
      }
    } catch (err) {
      showAlert("Erro", "Não foi possível recuperar o código de convite.");
    }
  }

  const handleCreateWallet = async () => {
    if (!newWalletName.trim()) return showAlert("Erro", "Nome é obrigatório.");
    setLoadingAction(true);
    try {
      const res = await fetch(`${API_BASE_URL}/carteiras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: newWalletName, limite_gastos: Number(newWalletLimit), id_usuario_criador: user?.id_usuario }),
      });
      if (!res.ok) throw new Error("Erro ao criar carteira");
      
      const data = await res.json();
      await updateUser({ ...user!, id_carteira_conjunta: data.id_carteira });
      setModalCreateVisible(false);
      showAlert("Sucesso", `Carteira '${data.nome}' criada. \nCódigo de Convite: ${data.codigo_convite}`);
      loadWalletData();
    } catch (err) {
      showAlert("Erro", "Não foi possível criar a carteira.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleJoinWallet = async () => {
    if (!joinCode.trim()) return showAlert("Erro", "Código é obrigatório.");
    setLoadingAction(true);
    try {
      const res = await fetch(`${API_BASE_URL}/carteiras/entrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo_convite: joinCode, id_usuario: user?.id_usuario }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Código inválido");
      }
      
      const data = await res.json();
      await updateUser({ ...user!, id_carteira_conjunta: data.id_carteira });
      setModalJoinVisible(false);
      showAlert("Sucesso", "Você entrou na carteira conjunta!");
      loadWalletData();
    } catch (err: any) {
      showAlert("Erro", err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEditWallet = async () => {
    setLoadingAction(true);
    try {
      const res = await fetch(`${API_BASE_URL}/carteiras/${user?.id_carteira_conjunta}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: newWalletName, limite_gastos: Number(newWalletLimit) || 0 }),
      });
      if (!res.ok) throw new Error("Erro ao salvar alterações");
      
      setModalEditVisible(false);
      showAlert("Sucesso", "Configurações da carteira atualizadas.");
      loadWalletData();
    } catch (err) {
      showAlert("Erro", "Não foi possível salvar.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleLeaveWallet = async () => {
    const executeLeave = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/carteiras/${user?.id_carteira_conjunta}/membros/${user?.id_usuario}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        await updateUser({ ...user!, id_carteira_conjunta: null }); showAlert("Sucesso", "Você saiu da carteira.");
      } catch (err) { showAlert("Erro", "Falha ao sair."); }
    };
    if (Platform.OS === 'web') { if (window.confirm("Tem certeza que deseja sair desta carteira conjunta?")) executeLeave(); }
    else { Alert.alert("Sair", "Deseja mesmo sair?", [{ text: "Cancelar", style: "cancel" }, { text: "Sair", style: "destructive", onPress: executeLeave }]); }
  };

  const handleDeleteWallet = async () => {
    const executeDelete = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/carteiras/${user?.id_carteira_conjunta}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Erro ao excluir");
        await updateUser({ ...user!, id_carteira_conjunta: null });
        setModalSettingsVisible(false);
        setActiveMembers([]);
        showAlert("Sucesso", "Carteira conjunta excluída.");
      } catch (err) {
        showAlert("Erro", "Não foi possível excluir a carteira.");
      }
    };
    if (Platform.OS === 'web') { if (window.confirm("Apagar carteira e todas despesas vinculadas?")) executeDelete(); }
    else { Alert.alert("Apagar", "Esta ação é irreversível.", [{ text: "Cancelar", style: "cancel" }, { text: "Apagar", style: "destructive", onPress: executeDelete }]); }
  };

  function openEditModal() {
    setModalSettingsVisible(false);
    setNewWalletName(currentWalletName);
    setNewWalletLimit(tetoLimit.toString());
    setModalEditVisible(true);
  }

  function openDeleteFromSettings() { setModalSettingsVisible(false); handleDeleteWallet(); }
  function openLeaveFromSettings() { setModalSettingsVisible(false); handleLeaveWallet(); }

  const jointTransactions = useMemo(() => {
    if (!user?.id_carteira_conjunta) return [];
    return transactions.filter((t) => Number(t.id_carteira) === Number(user.id_carteira_conjunta));
  }, [transactions, user?.id_carteira_conjunta]);

  const { saldo, totalDespesas, totalReceitas, expensesByCategory, incomesByCategory } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let s = 0; let d = 0; let r = 0; let expCats: Record<string, number> = {}; let incCats: Record<string, number> = {};
    jointTransactions.forEach(t => {
      const parts = t.data_transacao.split('-');
      if (parts.length >= 2) {
        const transYear = parseInt(parts[0], 10);
        const transMonth = parseInt(parts[1], 10) - 1;
        if (transYear !== currentYear || transMonth !== currentMonth) return;
      }

      const val = Number(t.valor);
      const c = t.categoria || "Outros";
      if (t.tipo === "RECEITA") {
        s += val; r += val; incCats[c] = (incCats[c] || 0) + val;
      } else {
        s -= val; d += val; expCats[c] = (expCats[c] || 0) + val;
      }
    });
    return { saldo: s, totalDespesas: d, totalReceitas: r, expensesByCategory: expCats, incomesByCategory: incCats };
  }, [jointTransactions]);

  const recentTransactions = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return [...jointTransactions]
      .filter(t => {
        const parts = t.data_transacao.split('-');
        if (parts.length < 2) return false;
        return parseInt(parts[0], 10) === currentYear && parseInt(parts[1], 10) - 1 === currentMonth;
      })
      .sort((a, b) => b.data_transacao.localeCompare(a.data_transacao))
      .slice(0, 5);
  }, [jointTransactions]);

  // --- HISTORY LOGIC ---
  const [historyFilter, setHistoryFilter] = useState("Todos");
  
  const monthFilters = useMemo(() => {
    if (jointTransactions.length === 0) return [];
    const seen = new Set<string>();
    const list: { label: string; month: number; year: number }[] = [];
    for (const t of jointTransactions) {
      const parts = t.data_transacao.split("-");
      if (parts.length < 2) continue;
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const key = `${year}-${month}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ label: `${MONTHS_LABEL[month]}`, month, year });
      }
    }
    return list.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
  }, [jointTransactions]);

  const [activeMonthFilter, setActiveMonthFilter] = useState<{ label: string; month: number; year: number } | null>(null);

  useEffect(() => {
    if (monthFilters.length > 0 && !activeMonthFilter) {
      setActiveMonthFilter(monthFilters[monthFilters.length - 1]);
    }
  }, [monthFilters]);

  const historyTransactions = useMemo(() => {
    let filtered = jointTransactions;
    if (historyFilter === "Receitas") filtered = filtered.filter(t => t.tipo === "RECEITA");
    else if (historyFilter === "Despesas") filtered = filtered.filter(t => t.tipo === "DESPESA");

    if (activeMonthFilter) {
      filtered = filtered.filter(t => {
        const parts = t.data_transacao.split("-");
        return parts.length >= 2 && parseInt(parts[0], 10) === activeMonthFilter.year && parseInt(parts[1], 10) - 1 === activeMonthFilter.month;
      });
    }
    return [...filtered].sort((a, b) => b.data_transacao.localeCompare(a.data_transacao));
  }, [jointTransactions, historyFilter, activeMonthFilter]);

  const { histReceitas, histDespesas, histLucro } = useMemo(() => {
    let r = 0; let d = 0;
    historyTransactions.forEach(t => {
      if (t.tipo === "RECEITA") r += Number(t.valor);
      else d += Number(t.valor);
    });
    return { histReceitas: r, histDespesas: d, histLucro: r - d };
  }, [historyTransactions]);

  const lineDataBalance = useMemo(() => {
    if (historyFilter !== "Todos") return [];
    const grouped: Record<string, number> = {};
    for (const t of historyTransactions) {
      const d = t.data_transacao;
      grouped[d] = (grouped[d] || 0) + (t.tipo === "RECEITA" ? Number(t.valor) : -Number(t.valor));
    }
    const entries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
    if (entries.length === 0) return [];
    
    let currentBalance = 0;
    const data = entries.map(([date, netValue]) => {
      currentBalance += netValue;
      return { value: currentBalance, label: date.split("-")[2] };
    });
    
    return [{ value: 0, label: "" }, ...data];
  }, [historyTransactions, historyFilter]);

  const navigateMonth = useCallback((direction: 'prev'|'next') => {
    if (!activeMonthFilter) return;
    const idx = monthFilters.findIndex(m => m.month === activeMonthFilter.month && m.year === activeMonthFilter.year);
    if (direction === 'prev' && idx > 0) setActiveMonthFilter(monthFilters[idx - 1]);
    if (direction === 'next' && idx < monthFilters.length - 1) setActiveMonthFilter(monthFilters[idx + 1]);
  }, [activeMonthFilter, monthFilters]);

  const canGoPrev = activeMonthFilter ? monthFilters.findIndex(m => m.month === activeMonthFilter.month && m.year === activeMonthFilter.year) > 0 : false;
  const canGoNext = activeMonthFilter ? monthFilters.findIndex(m => m.month === activeMonthFilter.month && m.year === activeMonthFilter.year) < monthFilters.length - 1 : false;

  const formatDateHeader = useCallback((dateStr: string): string => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (dateStr === todayStr) return "Hoje";
    if (dateStr === yesterdayStr) return "Ontem";
    const d = new Date(`${dateStr}T12:00:00`);
    return `${DAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  }, []);
  // ----------------------

  const totalDespesasConjuntas = totalDespesas;

  const progressPercentage = useMemo(() => {
    if (tetoLimit <= 0) return 0;
    return Math.min(100, Math.round((totalDespesasConjuntas / tetoLimit) * 100));
  }, [totalDespesasConjuntas, tetoLimit]);

  const progressBarColor = useMemo(() => {
    if (progressPercentage >= 100) return Colors.error;
    if (progressPercentage >= 80) return Colors.warning;
    return Colors.jointPrimary;
  }, [progressPercentage]);

  const handleEdit = useCallback((item: Transaction) => {
    import("expo-router").then(({ router }) => {
      router.push({
        pathname: "/transaction-form",
        params: {
          id_transacao: String(item.id_transacao),
          titulo: item.titulo,
          valor: String(item.valor),
          tipo: item.tipo,
          categoria_nome: item.categoria ?? "",
          data_transacao: item.data_transacao,
          id_carteira: String(item.id_carteira ?? 3),
        },
      });
    });
  }, []);

  const handleDelete = useCallback((item: Transaction) => {
    const doDelete = async () => {
      try {
        await apiRequest(`/transacoes/${item.id_transacao}`, { method: "DELETE" });
        await refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Não foi possível excluir.";
        if (Platform.OS === "web") alert(`Erro: ${msg}`);
        else Alert.alert("Erro", msg);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Deseja excluir "${item.titulo}"?`)) doDelete();
    } else {
      Alert.alert("Excluir transação", `Deseja excluir "${item.titulo}"?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: doDelete },
      ]);
    }
  }, [refresh]);


  return {
    user, transactions, tetoLimit, activeMembers, currentUserRole,
    modalCreateVisible, modalJoinVisible, modalEditVisible, modalSettingsVisible,
    currentWalletName, newWalletName, newWalletLimit, joinCode, loadingAction,
    totalDespesasConjuntas, progressPercentage, progressBarColor,
    saldo, totalReceitas, expensesByCategory, incomesByCategory, recentTransactions,
    setModalCreateVisible, setModalJoinVisible, setModalEditVisible, setModalSettingsVisible,
    setNewWalletName, setNewWalletLimit, setJoinCode,
    handleShowInviteCode, handleCreateWallet, handleJoinWallet, handleEditWallet,
    openEditModal, openDeleteFromSettings, openLeaveFromSettings,
    historyFilter, setHistoryFilter, activeMonthFilter, historyTransactions,
    histReceitas, histDespesas, histLucro, navigateMonth, canGoPrev, canGoNext,
    lineDataBalance, handleEdit, handleDelete, formatDateHeader,
  };
}
