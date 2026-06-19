const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const transacoesRoutes = require("./routes/transacoes");
const usuariosRoutes = require("./routes/usuarios");
const categoriasRoutes = require("./routes/categorias");
const carteirasRoutes = require("./routes/carteiras");

app.use("/transacoes", transacoesRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/categorias", categoriasRoutes);
app.use("/carteiras", carteirasRoutes);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${port} (0.0.0.0)`);
  });
}