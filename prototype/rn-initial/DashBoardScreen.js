import { View, Text, StyleSheet, FlatList } from "react-native";
import Header from "../components/Header";
import Chart from "../components/Chart";
import TopMovers from "../components/TopMovers";
import TransactionItem from "../components/TransactionItem";
import transactions from "../data/transactions";

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Header />
      <Chart />
      <TopMovers />

      <Text style={styles.title}>Transactions</Text>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionItem item={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
});