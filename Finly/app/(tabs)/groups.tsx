import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, Text, View, Pressable, StatusBar } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing, Shadow } from "@/constants/theme";
import { ProgressBar } from "@/components/ui";

export default function GroupsScreen() {
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
              <View style={styles.avatarCircle} />
              <View style={[styles.avatarCircle, styles.avatarOverlap]} />
              <View style={[styles.addMember, styles.avatarOverlap]}>
                <Feather name="plus" size={16} color={Colors.textInverse} />
              </View>
            </View>
            <Pressable style={styles.inviteButton}>
              <Text style={styles.inviteButtonText}>Convidar</Text>
            </Pressable>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Limite Mensal do Grupo</Text>
          <Feather name="edit-2" size={16} color={Colors.textGray} />
        </View>

        <View style={styles.card}>
          <View style={styles.limitRow}>
            <Text style={styles.limitCurrent}>Gasto Atual: R$ 1.820</Text>
            <Text style={styles.limitTotal}>Teto: R$ 2.000</Text>
          </View>
          <ProgressBar progress={91} color={Colors.warning} height={8} />
          <Text style={styles.limitWarning}>
            Atenção: Vocês atingiram 91% do limite!
          </Text>
        </View>

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
    color: Colors.warning,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
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
