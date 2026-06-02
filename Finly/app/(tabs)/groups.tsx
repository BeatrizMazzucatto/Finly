import React, { useState, useEffect, useMemo } from "react";
import { StyleSheet, Text, View, StatusBar, Platform, Alert, Modal, TextInput, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { Transaction } from "@/src/types/api";
import { getTransactionsByUser } from "@/src/services/transactions";
import { PieChart } from "react-native-gifted-charts";

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

  async function loadTransactions() {
    if (!user?.id_usuario) return;
    try {
      const data = await getTransactionsByUser(user.id_usuario);
      setTransactions(data);
    } catch (err) {
      console.error("Erro ao carregar transações no grupo:", err);
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

  const totalDespesasConjuntas = useMemo(() => {
    return transactions
      .filter((t) => t.id_carteira === user?.id_carteira_conjunta && t.tipo === "DESPESA")
      .reduce((sum, item) => sum + Number(item.valor), 0);
  }, [transactions, user?.id_carteira_conjunta]);

  const progressPercentage = useMemo(() => {
    if (tetoLimit <= 0) return 0;
    return Math.min(100, Math.round((totalDespesasConjuntas / tetoLimit) * 100));
  }, [totalDespesasConjuntas, tetoLimit]);

  const progressBarColor = useMemo(() => {
    if (progressPercentage >= 100) return Colors.error;
    if (progressPercentage >= 80) return Colors.warning;
    return Colors.jointPrimary;
  }, [progressPercentage]);

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

      <View style={styles.content}>
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
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Limite Mensal do Grupo</Text>
              <PieChart
                donut
                radius={80}
                innerRadius={60}
                data={[
                  {value: totalDespesasConjuntas, color: progressBarColor},
                  {value: Math.max(tetoLimit - totalDespesasConjuntas, 0), color: Colors.border}
                ]}
                centerLabelComponent={() => (
                  <View style={{alignItems: 'center'}}>
                    <Text style={{fontSize: 24, fontWeight: 'bold', color: progressBarColor}}>{progressPercentage}%</Text>
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
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
                <Text style={styles.cardTitle}>Membros do Grupo</Text>
                <Feather name="users" size={24} color={Colors.jointPrimary} />
              </View>
              
              {activeMembers.length > 0 ? (
                activeMembers.map((member) => (
                  <View key={member.id_usuario} style={styles.memberRow}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberInitials}>{member.nome.substring(0, 2).toUpperCase()}</Text>
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={styles.memberName}>{member.nome} {member.id_usuario === user?.id_usuario && "(Você)"}</Text>
                      <Text style={styles.memberRole}>{member.papel === 'PROPRIETARIO' ? 'Administrador' : 'Membro'}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{color: Colors.textMuted}}>Carregando membros...</Text>
              )}

              <View style={styles.inviteButtonContainer}>
                <Text style={styles.inviteLink} onPress={handleShowInviteCode}>
                  <Feather name="plus" size={16} /> Convidar novo membro
                </Text>
              </View>
            </View>
          </>
        )}
      </View>

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
  settingsMenuText: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary }
});
