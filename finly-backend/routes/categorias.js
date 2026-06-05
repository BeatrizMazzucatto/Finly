const express = require("express");
const router = express.Router();
const db = require("../database/connection");



// GET /categorias — lista todas as categorias padrão do sistema
router.get("/", (req, res) => {
  const sql = `
    SELECT id_categoria, nome, cor_hex, icone, id_carteira
    FROM categorias
    WHERE id_carteira IS NULL
    ORDER BY nome ASC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Erro ao buscar categorias:", err);
      return res.status(500).json({ erro: "Erro ao buscar categorias" });
    }

    if (!result || result.rows.length === 0) {
      return res.json([]);
    }

    res.json(result.rows);
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

// GET /categorias/:id_carteira — categorias de uma carteira específica
router.get("/:id_carteira", (req, res) => {
  const { id_carteira } = req.params;

  const sql = `
    SELECT id_categoria, nome, cor_hex, icone, id_carteira
    FROM categorias
    WHERE id_carteira IS NULL OR id_carteira = $1
    ORDER BY nome ASC
  `;

  db.query(sql, [id_carteira], (err, result) => {
    if (err) {
      console.error("Erro ao buscar categorias:", err);
      return res.status(500).json({ erro: "Erro ao buscar categorias" });
    }

    res.json(result ? result.rows : []);
  });
});

// PUT /categorias/:id — editar categoria customizada
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { nome, icone, cor_hex } = req.body;

  if (!nome || !icone || !cor_hex) {
    return res.status(400).json({ erro: "Nome, ícone e cor são obrigatórios" });
  }

  const sql = `
    UPDATE categorias
    SET nome = $1, icone = $2, cor_hex = $3
    WHERE id_categoria = $4 AND id_carteira IS NOT NULL
    RETURNING id_categoria, nome, cor_hex, icone, id_carteira
  `;

  db.query(sql, [nome.trim(), icone, cor_hex, id], (err, result) => {
    if (err) {
      console.error("Erro ao editar categoria:", err);
      if (err.code === "23505" || err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ erro: "Categoria já existe" });
      }
      return res.status(500).json({ erro: "Erro ao editar categoria" });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Categoria não encontrada ou você não tem permissão para editá-la" });
    }

    res.json(result.rows[0]);
  });
});

// DELETE /categorias/:id — excluir categoria customizada
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    DELETE FROM categorias
    WHERE id_categoria = $1 AND id_carteira IS NOT NULL
    RETURNING id_categoria
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Erro ao deletar categoria:", err);
      if (err.code === "23503") { // foreign key violation
        return res.status(400).json({ erro: "Não é possível excluir esta categoria porque há transações vinculadas a ela." });
      }
      return res.status(500).json({ erro: "Erro ao deletar categoria" });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Categoria não encontrada ou você não tem permissão para deletá-la" });
    }

    res.json({ mensagem: "Categoria deletada com sucesso" });
  });
});

module.exports = router;