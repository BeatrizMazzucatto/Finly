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