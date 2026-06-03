import { View, Text, StyleSheet } from "react-native";

export default function TransactionItem({ item }) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.category}>{item.category}</Text>
      </View>

      <Text style={styles.value}>${item.value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  name: {
    fontWeight: "bold",
  },
  category: {
    color: "#777",
  },
  value: {
    fontWeight: "bold",
  },
});