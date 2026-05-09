import { Redirect } from "expo-router";

// Este componente é apenas um placeholder para a tab "add"
// O clique na tab redireciona diretamente para o transaction-form
export default function AddScreen() {
  return <Redirect href="/transaction-form" />;
}