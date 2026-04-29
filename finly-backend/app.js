const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const transacoesRoutes = require("./routes/transacoes");
const usuariosRoutes = require("./routes/usuarios");

app.use("/transacoes", transacoesRoutes);
app.use("/usuarios", usuariosRoutes);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});