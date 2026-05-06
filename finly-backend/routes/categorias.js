const express = require("express");
const router = express.Router();
const db = require("../database/connection");

const FALLBACK_CATEGORIAS = [
  { id_categoria: 1, nome: "Alimentação", cor_hex: "#FF6B6B", icone: "fa-utensils" },
  { id_categoria: 2, nome: "Mercado", cor_hex: "#FF8787", icone: "fa-shopping-cart" },
  { id_categoria: 3, nome: "Moradia", cor_hex: "#6BCB77", icone: "fa-home" },
  { id_categoria: 4, nome: "Contas Residenciais", cor_hex: "#4E9F3D", icone: "fa-file-invoice-dollar" },
  { id_categoria: 5, nome: "Transporte", cor_hex: "#4D96FF", icone: "fa-bus" },
  { id_categoria: 6, nome: "Combustível", cor_hex: "#2B4865", icone: "fa-gas-pump" },
  { id_categoria: 7, nome: "Saúde", cor_hex: "#FF4A4A", icone: "fa-heartbeat" },
  { id_categoria: 8, nome: "Farmácia", cor_hex: "#F2789F", icone: "fa-pills" },
  { id_categoria: 9, nome: "Educação", cor_hex: "#FCA652", icone: "fa-graduation-cap" },
  { id_categoria: 10, nome: "Lazer e Diversão", cor_hex: "#9D4EDD", icone: "fa-theater-masks" },
  { id_categoria: 11, nome: "Bares e Restaurantes", cor_hex: "#C77DFF", icone: "fa-glass-cheers" },
  { id_categoria: 12, nome: "Assinaturas e TV", cor_hex: "#E0B0FF", icone: "fa-tv" },
  { id_categoria: 13, nome: "Vestuário", cor_hex: "#FFD166", icone: "fa-tshirt" },
  { id_categoria: 14, nome: "Beleza e Cuidados", cor_hex: "#FF9F1C", icone: "fa-cut" },
  { id_categoria: 15, nome: "Pets", cor_hex: "#8D99AE", icone: "fa-paw" },
  { id_categoria: 16, nome: "Viagem", cor_hex: "#06D6A0", icone: "fa-plane" },
  { id_categoria: 17, nome: "Salário", cor_hex: "#118AB2", icone: "fa-money-check-alt" },
  { id_categoria: 18, nome: "Investimentos", cor_hex: "#073B4C", icone: "fa-chart-line" },
  { id_categoria: 19, nome: "Renda Extra", cor_hex: "#2A9D8F", icone: "fa-hand-holding-usd" },
  { id_categoria: 20, nome: "Transferências", cor_hex: "#7B2CBF", icone: "fa-exchange-alt" },
];

// GET /categorias — lista todas as categorias padrão do sistema
router.get("/", (req, res) => {
  const sql = `
    SELECT id_categoria, nome, cor_hex, icone
    FROM categorias
    WHERE id_carteira IS NULL
    ORDER BY nome ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar categorias:", err);
      return res.json(FALLBACK_CATEGORIAS);
    }

    if (!results || results.length === 0) {
      return res.json(FALLBACK_CATEGORIAS);
    }

    res.json(results);
  });
});

// GET /categorias/:id_carteira — categorias de uma carteira específica
router.get("/:id_carteira", (req, res) => {
  const { id_carteira } = req.params;

  const sql = `
    SELECT id_categoria, nome, cor_hex, icone
    FROM categorias
    WHERE id_carteira IS NULL OR id_carteira = ?
    ORDER BY nome ASC
  `;

  db.query(sql, [id_carteira], (err, results) => {
    if (err) {
      console.error("Erro ao buscar categorias:", err);
      return res.json(FALLBACK_CATEGORIAS);
    }

    res.json(results || FALLBACK_CATEGORIAS);
  });
});

module.exports = router;