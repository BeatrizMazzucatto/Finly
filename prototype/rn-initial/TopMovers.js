import { View, Text, StyleSheet } from "react-native";

export default function TopMovers() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top Movers</Text>

      <View style={styles.row}>
        <View style={[styles.card, { backgroundColor: "#CDB4DB" }]}>
          <Text>Food</Text>
          <Text>$360</Text>
        </View>

        <View style={[styles.card, { backgroundColor: "#FFC8DD" }]}>
          <Text>Health</Text>
          <Text>$675</Text>
        </View>

        <View style={[styles.card, { backgroundColor: "#BDE0FE" }]}>
          <Text>Car</Text>
          <Text>$268</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  card: {
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
    borderRadius: 10,
  },
});

