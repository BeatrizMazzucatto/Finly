const fetch = require("node-fetch");
async function run() {
  const payload = {
    id_carteira: 2, // From previous script
    id_usuario: 2,
    id_categoria: 17,
    titulo: "Meu Salário",
    tipo: "RECEITA",
    valor: 5000,
    data_transacao: "2026-06-07"
  };
  try {
    const res = await fetch("http://localhost:3000/transacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("Status:", res.status, "Data:", data);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}
run();
