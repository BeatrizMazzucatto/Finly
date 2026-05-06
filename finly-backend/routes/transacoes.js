const express = require("express");
const router = express.Router();
const db = require("../database/connection");

const FALLBACK_TRANSACTIONS = [
  {
    id_transacao: 1,
    titulo: "Salário",
    tipo: "RECEITA",
    valor: 3500.0,
    data_transacao: "2026-04-01",
    categoria: "Salário",
  },
  {
    id_transacao: 2,
    titulo: "Mercado",
    tipo: "DESPESA",
    valor: 320.45,
    data_transacao: "2026-04-10",
    categoria: "Mercado",
  },
  {
    id_transacao: 3,
    titulo: "Uber",
    tipo: "DESPESA",
    valor: 35.0,
    data_transacao: "2026-04-12",
    categoria: "Transporte",
  },
  {
    id_transacao: 4,
    titulo: "Farmácia",
    tipo: "DESPESA",
    valor: 89.9,
    data_transacao: "2026-04-15",
    categoria: "Farmácia",
  },
  {
    id_transacao: 5,
    titulo: "Spotify",
    tipo: "DESPESA",
    valor: 21.9,
    data_transacao: "2026-04-18",
    categoria: "Assinaturas e TV",
  },
];

// CRIAR TRANSAÇÃO
router.post("/", (req, res) => {
  const {
    id_carteira,
    id_usuario,
    id_categoria,
    titulo,
    descricao,
    tipo,
    valor,
    data_transacao,
    forma_pagamento,
    status,
  } = req.body;

  if (!id_carteira || !id_usuario || !id_categoria || !titulo || valor === undefined || !data_transacao || !tipo) {
    return res.status(400).json({ erro: "Campos obrigatórios não preenchidos" });
  }

  if (isNaN(Number(valor)) || Number(valor) <= 0) {
    return res.status(400).json({ erro: "Valor inválido" });
  }

  if (!["RECEITA", "DESPESA"].includes(tipo)) {
    return res.status(400).json({ erro: "Tipo deve ser RECEITA ou DESPESA" });
  }

  const sql = `
    INSERT INTO transacoes
    (id_carteira, id_usuario, id_categoria, titulo, descricao, tipo, valor, data_transacao, forma_pagamento, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      id_carteira,
      id_usuario,
      id_categoria,
      titulo,
      descricao ?? null,
      tipo,
      Number(valor),
      data_transacao,
      forma_pagamento ?? null,
      status ?? "PAGO",
    ],
    (err, result) => {
      if (err) {
        console.error("Erro ao criar transação:", err);
        return res.status(500).json({ erro: "Erro ao salvar transação" });
      }
      res.status(201).json({
        mensagem: "Transação criada com sucesso",
        id_transacao: result.insertId,
      });
    }
  );
});

// LISTAR TRANSAÇÕES POR USUÁRIO (com filtros opcionais)
router.get("/:id_usuario", (req, res) => {
  const { id_usuario } = req.params;
  const { categoria, data_inicio, data_fim } = req.query;

  let sql = `
    SELECT
      t.id_transacao,
      t.titulo,
      t.tipo,
      t.valor,
      DATE_FORMAT(t.data_transacao, '%Y-%m-%d') AS data_transacao,
      c.nome AS categoria
    FROM transacoes t
    LEFT JOIN categorias c ON t.id_categoria = c.id_categoria
    WHERE t.id_usuario = ?
  `;

  const params = [id_usuario];

  if (categoria) {
    sql += " AND c.nome = ?";
    params.push(categoria);
  }

  if (data_inicio && data_fim) {
    sql += " AND t.data_transacao BETWEEN ? AND ?";
    params.push(data_inicio, data_fim);
  }

  sql += " ORDER BY t.data_transacao DESC";

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Erro ao buscar transações:", err);
      // Fallback para ambiente sem MySQL
      if (Number(id_usuario) === 1) {
        return res.json(FALLBACK_TRANSACTIONS);
      }
      return res.status(500).json({ erro: "Erro ao buscar transações" });
    }

    if (!results || results.length === 0) {
      return res.json({ mensagem: "Nenhuma transação encontrada" });
    }

    res.json(results);
  });
});

// ATUALIZAR TRANSAÇÃO
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { titulo, valor, tipo, id_categoria, data_transacao, descricao, forma_pagamento, status } = req.body;

  if (!titulo || valor === undefined || !data_transacao || !tipo) {
    return res.status(400).json({ erro: "Campos obrigatórios não preenchidos" });
  }

  if (isNaN(Number(valor)) || Number(valor) <= 0) {
    return res.status(400).json({ erro: "Valor inválido" });
  }

  const sql = `
    UPDATE transacoes
    SET titulo = ?, valor = ?, tipo = ?, id_categoria = ?, data_transacao = ?, descricao = ?, forma_pagamento = ?, status = ?
    WHERE id_transacao = ?
  `;

  db.query(
    sql,
    [titulo, Number(valor), tipo, id_categoria ?? null, data_transacao, descricao ?? null, forma_pagamento ?? null, status ?? "PAGO", id],
    (err, result) => {
      if (err) {
        console.error("Erro ao atualizar transação:", err);
        return res.status(500).json({ erro: "Erro ao atualizar transação" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ erro: "Transação não encontrada" });
      }
      res.json({ mensagem: "Transação atualizada com sucesso" });
    }
  );
});

// EXCLUIR TRANSAÇÃO
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ erro: "ID inválido" });
  }

  db.query("DELETE FROM transacoes WHERE id_transacao = ?", [id], (err, result) => {
    if (err) {
      console.error("Erro ao excluir transação:", err);
      return res.status(500).json({ erro: "Erro ao excluir transação" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Transação não encontrada" });
    }
    res.json({ mensagem: "Transação excluída com sucesso" });
  });
});

module.exports = router;