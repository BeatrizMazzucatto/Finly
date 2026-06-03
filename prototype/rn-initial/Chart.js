import { View, Text, StyleSheet } from "react-native";

export default function Chart() {
  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        <Text style={styles.value}>$2,538</Text>
        <Text>This month</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 20,
  },
  circle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#DDD",
    justifyContent: "center",
    alignItems: "center",
  },
  value: {
    fontSize: 22,
    fontWeight: "bold",
  },
});