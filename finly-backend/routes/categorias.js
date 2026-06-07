const express = require("express");
const router = express.Router();
const db = require("../database/connection");



// GET /categorias — lista todas as categorias padrão e as de carteiras específicas
router.get("/", (req, res) => {
  const carteirasStr = req.query.carteiras;
  let params = [];
  let condition = "";

  if (carteirasStr) {
    const carteiras = carteirasStr.split(",").map(Number).filter(n => !isNaN(n));
    if (carteiras.length > 0) {
      const placeholders = carteiras.map((_, i) => `$${i + 1}`).join(",");
      condition = `OR id_carteira IN (${placeholders})`;
      params = carteiras;
    }
  }

  const sql = `
    SELECT id_categoria, nome, cor_hex, icone
    FROM categorias
    WHERE id_carteira IS NULL ${condition}
    ORDER BY nome ASC
  `;

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar categorias:", err);
      return res.status(500).json({ erro: "Erro ao buscar categorias" });
    }
    res.json(result ? result.rows : []);
  });
});

// POST /categorias — criar nova categoria global
router.post("/", (req, res) => {
  const { nome, icone, cor_hex, id_carteira = null } = req.body;

  if (!nome || !icone || !cor_hex) {
    return res.status(400).json({ erro: "Nome, ícone e cor são obrigatórios" });
  }

  const sql = `
    INSERT INTO categorias (nome, cor_hex, icone, id_carteira)
    VALUES ($1, $2, $3, $4)
    RETURNING id_categoria, nome, cor_hex, icone
  `;

  db.query(sql, [nome.trim(), cor_hex, icone, id_carteira], (err, result) => {
    if (err) {
      console.error("Erro ao criar categoria:", err);
      if (err.code === "23505" || err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ erro: "Categoria já existe" });
      }
      return res.status(500).json({ erro: "Erro ao criar categoria" });
    }

    res.status(201).json(result.rows[0]);
  });
});


// PUT /categorias/:id — editar categoria
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { nome, icone, cor_hex } = req.body;

  if (!nome || !icone || !cor_hex) {
    return res.status(400).json({ erro: "Nome, ícone e cor são obrigatórios" });
  }

  const sql = `
    UPDATE categorias
    SET nome = $1, icone = $2, cor_hex = $3
    WHERE id_categoria = $4
    RETURNING id_categoria, nome, cor_hex, icone
  `;

  db.query(sql, [nome.trim(), icone, cor_hex, id], (err, result) => {
    if (err) {
      console.error("Erro ao atualizar categoria:", err);
      return res.status(500).json({ erro: "Erro ao atualizar categoria" });
    }
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Categoria não encontrada" });
    }
    res.json(result.rows[0]);
  });
});

// DELETE /categorias/:id — excluir categoria
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  // Desvincula a categoria das transações antes de excluir
  const updateSql = `UPDATE transacoes SET id_categoria = NULL WHERE id_categoria = $1`;
  
  db.query(updateSql, [id], (errUpdate) => {
    if (errUpdate) {
      console.error("Erro ao desvincular categoria das transações:", errUpdate);
      return res.status(500).json({ erro: "Erro ao atualizar transações vinculadas" });
    }

    const sql = `DELETE FROM categorias WHERE id_categoria = $1`;

    db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Erro ao excluir categoria:", err);
      // Se a categoria estiver em uso por uma transação (FK violation)
      if (err.code === "23503" || err.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({ erro: "Não é possível excluir uma categoria que já possui transações." });
      }
      return res.status(500).json({ erro: "Erro ao excluir categoria" });
    }
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Categoria não encontrada" });
    }
    res.json({ mensagem: "Categoria excluída com sucesso" });
    });
  });
});

module.exports = router;