import React, { useEffect, useMemo, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  StatusBar, 
  Switch, 
  TextInput, 
  Alert,
  Image,
  Platform
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "@/src/context/AuthContext";
import { getTransactionsByUser } from "@/src/services/transactions";
import type { Transaction } from "@/src/types/api";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing, Shadow } from "@/constants/theme";
import { ProgressBar } from "@/components/ui";
import { formatCurrency } from "@/utils/formatters";

function showAlert(title: string, message: string) {
  if (Platform.OS === "web") {
    alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export default function GroupsScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tetoLimit, setTetoLimit] = useState(2000);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [limitInputValue, setLimitInputValue] = useState("2000");
  const [pendingInvites, setPendingInvites] = useState<{ id: number; nome: string }[]>([]);
  const [activeMembers, setActiveMembers] = useState<string[]>(["Lucas Silva", "Maria Silva"]);
  const [alertEnabled, setAlertEnabled] = useState(true);

  async function loadTransactions() {
    if (!user) return;
    try {
      const data = await getTransactionsByUser(user.id_usuario);
      setTransactions(data);
    } catch (err) {
      console.error("Erro ao carregar transações no grupo:", err);
    }
  }

  useEffect(() => {
    AsyncStorage.getItem("finly_teto_limite").then((val) => {
      if (val) {
        setTetoLimit(Number(val));
        setLimitInputValue(val);
      }
    });
    AsyncStorage.getItem("finly_active_members").then((val) => {
      if (val) {
        setActiveMembers(JSON.parse(val));
      }
    });
    AsyncStorage.getItem("finly_pending_invites").then((val) => {
      if (val) {
        setPendingInvites(JSON.parse(val));
      } else {
        const defaultInvites = [{ id: 1, nome: "Carlos Souza" }];
        setPendingInvites(defaultInvites);
        AsyncStorage.setItem("finly_pending_invites", JSON.stringify(defaultInvites));
      }
    });
    AsyncStorage.getItem("finly_alert_enabled").then((val) => {
      if (val !== null) {
        setAlertEnabled(val === "true");
      }
    });
    loadTransactions();
  }, [user?.id_usuario]);

  const saveTetoLimit = async (val: number) => {
    setTetoLimit(val);
    await AsyncStorage.setItem("finly_teto_limite", String(val));
  };

  const handleAcceptInvite = async (inviteId: number, nome: string) => {
    const updatedInvites = pendingInvites.filter((invite) => invite.id !== inviteId);
    setPendingInvites(updatedInvites);
    await AsyncStorage.setItem("finly_pending_invites", JSON.stringify(updatedInvites));

    const updatedMembers = [...activeMembers, nome];
    setActiveMembers(updatedMembers);
    await AsyncStorage.setItem("finly_active_members", JSON.stringify(updatedMembers));
    showAlert("Sucesso", `${nome} foi adicionado ao grupo!`);
  };

  const handleDeclineInvite = async (inviteId: number) => {
    const updatedInvites = pendingInvites.filter((invite) => invite.id !== inviteId);
    setPendingInvites(updatedInvites);
    await AsyncStorage.setItem("finly_pending_invites", JSON.stringify(updatedInvites));
    showAlert("Recusado", "Convite recusado.");
  };

  const toggleAlert = async (value: boolean) => {
    setAlertEnabled(value);
    await AsyncStorage.setItem("finly_alert_enabled", String(value));
  };

  const handleShowInviteCode = () => {
    if (Platform.OS === "web") {
      const copy = window.confirm(
        "Convidar Membro\n\nCompartilhe o código abaixo para convidar um novo membro para sua carteira conjunta:\n\nSILVA-123-JOIN\n\nDeseja copiar o código?"
      );
      if (copy) {
        showAlert("Copiado!", "Código copiado para a área de transferência.");
      }
    } else {
      Alert.alert(
        "Convidar Membro",
        "Compartilhe o código abaixo para convidar um novo membro para sua carteira conjunta:\n\nSILVA-123-JOIN",
        [
          { text: "Copiar Código", onPress: () => Alert.alert("Copiado!", "Código copiado para a área de transferência.") },
          { text: "Fechar", style: "cancel" }
        ]
      );
    }
  };

  const totalDespesasConjuntas = useMemo(() => {
    return transactions
      .filter((t) => t.id_carteira === 3 && t.tipo === "DESPESA")
      .reduce((sum, item) => sum + Number(item.valor), 0);
  }, [transactions]);

  const progressPercentage = useMemo(() => {
    if (tetoLimit <= 0) return 0;
    return Math.min(100, Math.round((totalDespesasConjuntas / tetoLimit) * 100));
  }, [totalDespesasConjuntas, tetoLimit]);

  const progressBarColor = useMemo(() => {
    if (progressPercentage >= 100) return Colors.error;
    if (progressPercentage >= 80) return Colors.warning;
    return Colors.success;
  }, [progressPercentage]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Carteira Conjunta</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[Colors.jointGradientStart, Colors.jointGradientEnd]} style={styles.heroCard}>
          <Text style={styles.heroTitle}>Família Silva</Text>
          <Text style={styles.heroSubtitle}>Gerencie os gastos compartilhados da casa.</Text>
          <View style={styles.heroFooter}>
            <View style={styles.avatarGroup}>
              {activeMembers.map((member, index) => {
                const nameParam = encodeURIComponent(member);
                const avatarUrl = `https://ui-avatars.com/api/?name=${nameParam}&background=fff&color=9333EA`;
                return (
                  <Image
                    key={member}
                    source={{ uri: avatarUrl }}
                    style={[
                      styles.avatarImage,
                      index > 0 && styles.avatarOverlap,
                    ]}
                  />
                );
              })}
              <Pressable onPress={handleShowInviteCode} style={[styles.addMember, styles.avatarOverlap]}>
                <Feather name="plus" size={16} color={Colors.textInverse} />
              </Pressable>
            </View>
            <Pressable onPress={handleShowInviteCode} style={styles.inviteButton}>
              <Text style={styles.inviteButtonText}>Convidar</Text>
            </Pressable>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Limite Mensal do Grupo</Text>
          <Pressable onPress={() => setIsEditingLimit(true)}>
            <Feather name="edit-2" size={16} color={Colors.textGray} />
          </Pressable>
        </View>

        <View style={styles.card}>
          {isEditingLimit ? (
            <View style={styles.editLimitContainer}>
              <TextInput
                style={styles.limitInput}
                keyboardType="numeric"
                value={limitInputValue}
                onChangeText={setLimitInputValue}
                autoFocus
              />
              <Pressable
                style={styles.saveLimitBtn}
                onPress={() => {
                  const num = parseFloat(limitInputValue);
                  if (!isNaN(num) && num > 0) {
                    saveTetoLimit(num);
                    setIsEditingLimit(false);
                  } else {
                    showAlert("Erro", "Insira um valor válido.");
                  }
                }}
              >
                <Feather name="check" size={16} color={Colors.textInverse} />
              </Pressable>
              <Pressable
                style={styles.cancelLimitBtn}
                onPress={() => {
                  setLimitInputValue(String(tetoLimit));
                  setIsEditingLimit(false);
                }}
              >
                <Feather name="x" size={16} color={Colors.textPrimary} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.limitRow}>
              <Text style={styles.limitCurrent}>
                Gasto Atual: {formatCurrency(totalDespesasConjuntas)}
              </Text>
              <Text style={styles.limitTotal}>Teto: {formatCurrency(tetoLimit)}</Text>
            </View>
          )}
          <ProgressBar progress={progressPercentage} color={progressBarColor} height={8} backgroundColor="#E2E8F0" />
          {alertEnabled && progressPercentage >= 100 ? (
            <Text style={[styles.limitWarning, { color: Colors.error }]}>
              🚨 Limite Atingido: Vocês ultrapassaram {progressPercentage}% do teto configurado!
            </Text>
          ) : alertEnabled && progressPercentage >= 80 ? (
            <Text style={[styles.limitWarning, { color: Colors.warning }]}>
              ⚠️ Atenção: Vocês atingiram {progressPercentage}% do limite!
            </Text>
          ) : (
            <Text style={[styles.limitWarning, { color: Colors.success }]}>
              ✅ Saudável: Gastos sob controle ({progressPercentage}% consumido).
            </Text>
          )}
        </View>

        {pendingInvites.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: Spacing.xxl }]}>
              <Text style={styles.sectionTitle}>Solicitações Pendentes</Text>
            </View>
            <View style={styles.card}>
              {pendingInvites.map((invite) => (
                <View key={invite.id} style={styles.inviteRow}>
                  <View style={styles.inviteInfo}>
                    <View style={styles.inviteAvatar}>
                      <Text style={styles.inviteAvatarText}>
                        {invite.nome.split(" ").map(n => n[0]).join("")}
                      </Text>
                    </View>
                    <View style={{ gap: 2 }}>
                      <Text style={styles.inviteName}>{invite.nome}</Text>
                      <Text style={styles.inviteMeta}>Quer entrar no seu grupo</Text>
                    </View>
                  </View>
                  <View style={styles.inviteActions}>
                    <Pressable
                      style={[styles.actionBtn, styles.acceptBtn]}
                      onPress={() => handleAcceptInvite(invite.id, invite.nome)}
                    >
                      <Feather name="check" size={16} color={Colors.textInverse} />
                    </Pressable>
                    <Pressable
                      style={[styles.actionBtn, styles.declineBtn]}
                      onPress={() => handleDeclineInvite(invite.id)}
                    >
                      <Feather name="x" size={16} color={Colors.textPrimary} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={[styles.sectionHeader, { marginTop: Spacing.xxl }]}>
          <Text style={styles.sectionTitle}>Regras do Grupo</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.ruleRow}>
            <View style={styles.ruleIcon}>
              <Feather name="bell" size={18} color={Colors.textPrimary} />
            </View>
            <View style={styles.ruleText}>
              <Text style={styles.ruleTitle}>Notificações de Alerta</Text>
              <Text style={styles.ruleSubtitle}>Avisar em 80% e 100% do limite</Text>
            </View>
            <Switch
              value={alertEnabled}
              onValueChange={toggleAlert}
              trackColor={{ false: Colors.border, true: Colors.jointPrimary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={Colors.border}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  content: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 120,
  },
  heroCard: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    marginBottom: Spacing.xxl,
    ...Shadow.md,
  },
  heroTitle: {
    color: Colors.textInverse,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    color: Colors.textInverse,
    opacity: 0.9,
    marginBottom: Spacing.xl,
  },
  heroFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatarGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  avatarOverlap: {
    marginLeft: -10,
  },
  addMember: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.textInverse,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  inviteButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  inviteButtonText: {
    color: Colors.jointPrimary,
    fontWeight: FontWeight.bold,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    ...Shadow.sm,
  },
  limitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  limitCurrent: {
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  limitTotal: {
    color: Colors.textGray,
    fontSize: FontSize.sm,
  },
  limitWarning: {
    marginTop: Spacing.md,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  editLimitContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  limitInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  saveLimitBtn: {
    backgroundColor: Colors.success,
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelLimitBtn: {
    backgroundColor: Colors.border,
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  inviteInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  inviteAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.jointLight,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteAvatarText: {
    color: Colors.jointPrimary,
    fontWeight: FontWeight.bold,
  },
  inviteName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  inviteMeta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  inviteActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.sm,
  },
  acceptBtn: {
    backgroundColor: Colors.jointPrimary,
  },
  declineBtn: {
    backgroundColor: Colors.borderLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  ruleIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  ruleText: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  ruleSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textGray,
  },
});
