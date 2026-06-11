const express = require("express");
const router = express.Router();
const db = require("../database/connection");

// GET /carteiras/:id/limite
router.get("/:id/limite", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      "SELECT nome, limite_gastos_mensal FROM carteiras WHERE id_carteira = $1",
      [id]
    );
    if (result.rowCount === 0) return res.status(404).json({ erro: "Carteira não encontrada" });
    res.json({ nome: result.rows[0].nome, limite: result.rows[0].limite_gastos_mensal });
  } catch (err) {
    console.error("Erro ao buscar limite da carteira:", err);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

// GET /carteiras/:id/membros
router.get("/:id/membros", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      `SELECT u.id_usuario, u.nome, u.email, uc.papel 
       FROM usuarios_carteiras uc
       JOIN usuarios u ON uc.id_usuario = u.id_usuario
       WHERE uc.id_carteira = $1`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar membros da carteira:", err);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

// GET /carteiras/:id/codigo
router.get("/:id/codigo", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query("SELECT codigo_convite FROM carteiras WHERE id_carteira = $1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ erro: "Carteira não encontrada" });
    res.json({ codigo: result.rows[0].codigo_convite });
  } catch (err) {
    console.error("Erro ao buscar código de convite:", err);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

// POST /carteiras
router.post("/", async (req, res) => {
  const { nome, limite_gastos_mensal, id_usuario } = req.body;
  if (!nome || !id_usuario) return res.status(400).json({ erro: "Nome e id_usuario são obrigatórios" });
  
  try {
    // Generate a random 6-character code
    const randomHash = Math.random().toString(36).substring(2, 8).toUpperCase();
    const codigo_convite = `JOIN-${randomHash}`;

    // Insert wallet
    const result = await db.query(
      "INSERT INTO carteiras (nome, tipo, limite_gastos_mensal, codigo_convite) VALUES ($1, $2, $3, $4) RETURNING id_carteira",
      [nome, "CONJUNTA", limite_gastos_mensal || 0, codigo_convite]
    );
    const id_carteira = result.rows[0].id_carteira;

    // Link user as PROPRIETARIO
    await db.query(
      "INSERT INTO usuarios_carteiras (id_usuario, id_carteira, papel, renda_mensal_alocada) VALUES ($1, $2, $3, $4)",
      [id_usuario, id_carteira, "PROPRIETARIO", 0]
    );

    res.status(201).json({ id_carteira, codigo_convite });
  } catch (err) {
    console.error("Erro ao criar carteira:", err);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

// POST /carteiras/entrar
router.post("/entrar", async (req, res) => {
  const { codigo_convite, id_usuario } = req.body;
  if (!codigo_convite || !id_usuario) return res.status(400).json({ erro: "Código e id_usuario são obrigatórios" });
  
  try {
    // Find wallet by code
    const walletRes = await db.query(
      "SELECT id_carteira FROM carteiras WHERE codigo_convite = $1 AND tipo = 'CONJUNTA'",
      [codigo_convite.toUpperCase()]
    );

    if (walletRes.rowCount === 0) {
      return res.status(404).json({ erro: "Código de convite inválido ou expirado." });
    }

    const id_carteira = walletRes.rows[0].id_carteira;

    // Link user as MEMBRO
    await db.query(
      "INSERT INTO usuarios_carteiras (id_usuario, id_carteira, papel, renda_mensal_alocada) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING",
      [id_usuario, id_carteira, "MEMBRO", 0]
    );

    res.json({ mensagem: "Você entrou na carteira com sucesso!", id_carteira });
  } catch (err) {
    console.error("Erro ao entrar na carteira:", err);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

// PUT /carteiras/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, limite_gastos_mensal } = req.body;
  try {
    await db.query(
      "UPDATE carteiras SET nome = $1, limite_gastos_mensal = $2 WHERE id_carteira = $3",
      [nome, limite_gastos_mensal, id]
    );
    res.json({ mensagem: "Carteira atualizada com sucesso" });
  } catch (err) {
    console.error("Erro ao atualizar carteira:", err);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

// DELETE /carteiras/:id/membros/:id_usuario
router.delete("/:id/membros/:id_usuario", async (req, res) => {
  const { id, id_usuario } = req.params;
  try {
    await db.query(
      "DELETE FROM usuarios_carteiras WHERE id_carteira = $1 AND id_usuario = $2",
      [id, id_usuario]
    );
    res.json({ mensagem: "Você saiu da carteira." });
  } catch (err) {
    console.error("Erro ao sair da carteira:", err);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

// DELETE /carteiras/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Delete in correct order to avoid FK errors
    await db.query("DELETE FROM transacoes WHERE id_carteira = $1", [id]);
    await db.query("DELETE FROM usuarios_carteiras WHERE id_carteira = $1", [id]);
    await db.query("DELETE FROM carteiras WHERE id_carteira = $1", [id]);
    res.json({ mensagem: "Carteira deletada com sucesso" });
  } catch (err) {
    console.error("Erro ao deletar carteira:", err);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

module.exports = router;
