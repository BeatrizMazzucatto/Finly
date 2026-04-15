import { View, Text, StyleSheet, FlatList, ScrollView } from "react-native";

const transactions = [
  { id: "1", name: "Starbucks", category: "Food", value: 15.38 },
  { id: "2", name: "H&M", category: "Shopping", value: 258.65 },
  { id: "3", name: "Spotify", category: "Subscription", value: 9.99 },
];

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Statistics</Text>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <View style={styles.circle}>
          <Text style={styles.chartValue}>$2,538</Text>
          <Text>This month</Text>
        </View>
      </View>

      {/* Top Movers */}
      <Text style={styles.sectionTitle}>Top Movers</Text>
      <View style={styles.row}>
        <View style={[styles.card, { backgroundColor: "#CDB4DB" }]}>
          <Text>Food</Text><Text>$360</Text>
        </View>
        <View style={[styles.card, { backgroundColor: "#FFC8DD" }]}>
          <Text>Health</Text><Text>$675</Text>
        </View>
        <View style={[styles.card, { backgroundColor: "#BDE0FE" }]}>
          <Text>Car</Text><Text>$268</Text>
        </View>
      </View>

      {/* Transactions */}
      <Text style={styles.sectionTitle}>Transactions</Text>
      {transactions.map((item) => (
        <View key={item.id} style={styles.transactionItem}>
          <View>
            <Text style={{ fontWeight: "bold" }}>{item.name}</Text>
            <Text style={{ color: "#777" }}>{item.category}</Text>
          </View>
          <Text style={{ fontWeight: "bold" }}>${item.value}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F5F5F5" },
  header: { fontSize: 22, fontWeight: "bold", marginTop: 40, marginBottom: 10 },
  chartContainer: { alignItems: "center", marginVertical: 20 },
  circle: {
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: "#DDD", justifyContent: "center", alignItems: "center",
  },
  chartValue: { fontSize: 22, fontWeight: "bold" },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginVertical: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  card: { flex: 1, marginHorizontal: 5, padding: 10, borderRadius: 10 },
  transactionItem: {
    flexDirection: "row", justifyContent: "space-between",
    backgroundColor: "#FFF", padding: 15, borderRadius: 10, marginBottom: 10,
  },
});