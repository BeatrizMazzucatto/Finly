const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const transacoesRoutes = require("./routes/transacoes");
const usuariosRoutes = require("./routes/usuarios");
const categoriasRoutes = require("./routes/categorias");

app.use("/transacoes", transacoesRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/categorias", categoriasRoutes);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});