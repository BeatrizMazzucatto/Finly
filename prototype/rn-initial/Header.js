import { View, Text, StyleSheet } from "react-native";

export default function Header() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Statistics</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
});