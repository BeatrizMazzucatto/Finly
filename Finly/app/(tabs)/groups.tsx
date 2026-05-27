import { StyleSheet, Text, View, StatusBar } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "@/constants/theme";

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

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Feather name="tool" size={40} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Em Construção</Text>
        <Text style={styles.subtitle}>
          A funcionalidade de Carteira Conjunta está sendo desenvolvida. Em breve você poderá compartilhar despesas com amigos e familiares!
        </Text>
      </View>
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
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    color: Colors.textGray,
    textAlign: "center",
    lineHeight: 24,
    fontSize: 16,
  },
});
