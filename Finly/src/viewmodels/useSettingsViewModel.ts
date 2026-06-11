import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/src/services/categories";
import { getTransactionsByUser } from "@/src/services/transactions";
import { Colors } from "@/constants/theme";
import { formatMoneyInput } from "@/utils/formatters";

const LIMITE_KEY = "finly_limite_gastos";

export function useSettingsViewModel() {
  const { user, logout } = useAuth();
  const [limite, setLimite] = useState("3.000,00");
  const [editingLimite, setEditingLimite] = useState(false);
  const [categories, setCategories] = useState<{ id_categoria: number; nome: string; cor_hex: string; icone: string }[]>([]);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
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
      const loadedCategories = await getCategories([user?.id_carteira_pessoal || null, user?.id_carteira_conjunta || null]).catch(() => []);
      setCategories(loadedCategories);
      setLoadingCategories(false);
    }
    if (user) loadSettings();
  }, [user]);

  async function handleAddCategory() {
    if (!newCategoryName.trim()) { Alert.alert("Erro", "Digite o nome da categoria."); return; }
    try {
      if (editingCategoryId) {
        const updated = await updateCategory(editingCategoryId, { nome: newCategoryName.trim(), icone: newCategoryIcon, cor_hex: Colors.categories?.outros || "#94A3B8" });
        setCategories((prev) => prev.map(c => c.id_categoria === editingCategoryId ? updated : c));
        Alert.alert("Sucesso", "Categoria atualizada!");
      } else {
        const created = await createCategory({ nome: newCategoryName.trim(), icone: newCategoryIcon, cor_hex: Colors.categories?.outros || "#94A3B8", id_carteira: user?.id_carteira_pessoal || undefined });
        setCategories((prev) => [...prev, created]);
        Alert.alert("Sucesso", "Categoria criada!");
      }
      setNewCategoryName("");
      setEditingCategoryId(null);
    } catch (err) {
      Alert.alert("Erro", err instanceof Error ? err.message : "Não foi possível salvar a categoria.");
    }
  }

  async function handleDeleteCategory(id: number) {
    const executeDelete = async () => {
      try {
        await deleteCategory(id);
        setCategories((prev) => prev.filter(c => c.id_categoria !== id));
        if (editingCategoryId === id) {
          setEditingCategoryId(null);
          setNewCategoryName("");
        }
        Alert.alert("Sucesso", "Categoria excluída.");
      } catch (err: any) {
        Alert.alert("Erro", err.message || "Não foi possível excluir a categoria.");
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Tem certeza que deseja excluir esta categoria?")) executeDelete();
    } else {
      Alert.alert("Excluir", "Deseja excluir esta categoria?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: executeDelete },
      ]);
    }
  }

  function handleEditCategory(cat: { id_categoria: number; nome: string; icone: string }) {
    setEditingCategoryId(cat.id_categoria);
    setNewCategoryName(cat.nome);
    setNewCategoryIcon(cat.icone as keyof typeof Feather.glyphMap);
  }

  function handleCancelEditCategory() {
    setEditingCategoryId(null);
    setNewCategoryName("");
  }

  async function handleSaveLimite() {
    const limiteNum = parseFloat(limite.replace(/\./g, "").replace(",", ".")) || 0;
    if (limiteNum <= 0) { Alert.alert("Erro", "Digite um valor válido para o limite."); return; }
    await AsyncStorage.setItem(LIMITE_KEY, String(limiteNum));
    setEditingLimite(false);
    Alert.alert("Sucesso", "Limite atualizado!");
  }

  async function handleLogout() {
    if (Platform.OS === "web") {
      if (window.confirm("Tem certeza que deseja sair?")) { await logout(); router.replace("/login"); }
      return;
    }
    Alert.alert("Sair da conta", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: async () => { await logout(); router.replace("/login"); } },
    ]);
  }

  async function handleUpdatePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) { Alert.alert("Erro", "Preencha todos os campos."); return; }
    if (newPassword !== confirmPassword) { Alert.alert("Erro", "A nova senha e a confirmação não coincidem."); return; }
    Alert.alert("Sucesso", "Sua senha foi atualizada!");
    setShowSecurity(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
  }

  async function handleExportBackup(carteiraType: "PESSOAL" | "CONJUNTA") {
    if (!user) return;
    try {
      setExporting(true);
      const allTransactions = await getTransactionsByUser(user.id_usuario);
      const jointId = user.id_carteira_conjunta ?? 3;

      const transactions = allTransactions.filter(t =>
        carteiraType === "CONJUNTA" ? t.id_carteira === jointId : t.id_carteira !== jointId
      );

      const header = "ID,Titulo,Valor,Data,Tipo,Categoria\n";
      const csvContent = transactions.map(t => `${t.id_transacao},"${t.titulo}",${t.valor},${t.data_transacao},${t.tipo},"${t.categoria || ''}"`).join("\n");
      const fullCsv = header + csvContent;
      if (Platform.OS === 'web') {
        const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url); link.setAttribute("download", `finly_backup_${carteiraType.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        Alert.alert("Sucesso", `Backup da carteira ${carteiraType.toLowerCase()} efetuado com sucesso (CSV baixado).`);
      } else {
        Alert.alert("Backup Gerado!", "Em um ambiente real (app nativo), aqui o arquivo CSV seria salvo ou compartilhado.");
      }
    } catch (err) { console.error(err); Alert.alert("Erro", "Não foi possível gerar o backup."); }
    finally { setExporting(false); }
  }

  function handleLimiteChange(text: string) { setLimite(formatMoneyInput(text)); }

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nome ?? "Lucas")}&background=4F46E5&color=fff`;

  return {
    user, limite, editingLimite, categories, newCategoryName, newCategoryIcon,
    showCategories, loadingCategories, showSecurity, currentPassword, newPassword,
    confirmPassword, showBackup, exporting, avatarUrl, editingCategoryId,
    setLimite, setEditingLimite, setNewCategoryName, setNewCategoryIcon,
    setShowCategories, setShowSecurity, setCurrentPassword, setNewPassword,
    setConfirmPassword, setShowBackup,
    handleAddCategory, handleDeleteCategory, handleEditCategory, handleCancelEditCategory,
    handleSaveLimite, handleLogout, handleUpdatePassword,
    handleExportBackup, handleLimiteChange,
  };
}
