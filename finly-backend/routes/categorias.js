const express = require("express");
const router = express.Router();
const db = require("../database/connection");



// GET /categorias — lista todas as categorias padrão do sistema
router.get("/", (req, res) => {
  const sql = `
    SELECT id_categoria, nome, cor_hex, icone
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
    SELECT id_categoria, nome, cor_hex, icone
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

module.exports = router;