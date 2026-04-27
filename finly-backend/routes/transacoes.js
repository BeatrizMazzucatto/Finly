const express = require("express");
const router = express.Router();
const db = require("../database/connection");

// CRIAR TRANSAÇÃO
router.post("/", (req, res) => {
  const { id_usuario, id_categoria, titulo, valor, data_transacao } = req.body;

  // Validação
  if (!id_usuario || !titulo || valor === undefined || !data_transacao) {
    return res.status(400).json({ erro: "Campos obrigatórios não preenchidos" });
  }

  if (isNaN(valor)) {
    return res.status(400).json({ erro: "Valor inválido" });
  }

  const tipo = valor >= 0 ? "RECEITA" : "DESPESA";

  const sql = `
    INSERT INTO transacoes
    (id_usuario, id_categoria, titulo, tipo, valor, data_transacao)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      id_usuario,
      id_categoria || null,
      titulo,
      tipo,
      Math.abs(valor),
      data_transacao,
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ erro: "Erro ao salvar transação" });
      }

      res.status(201).json({
        mensagem: "Transação criada com sucesso",
        id_transacao: result.insertId,
      });
    }
  );
});

// LISTAR / FILTRAR TRANSAÇÕES
router.get("/:id_usuario", (req, res) => {
  const { id_usuario } = req.params;
  const { categoria, data_inicio, data_fim } = req.query;

  let sql = `
    SELECT 
      t.id_transacao,
      t.titulo,
      t.tipo,
      t.valor,
      t.data_transacao,
      c.nome AS categoria
    FROM transacoes t
    LEFT JOIN categorias c ON t.id_categoria = c.id_categoria
    WHERE t.id_usuario = ?
  `;

  const params = [id_usuario];

  // Filtro por categoria
  if (categoria) {
    sql += " AND t.id_categoria = ?";
    params.push(categoria);
  }

  // Filtro por período
  if (data_inicio && data_fim) {
    sql += " AND t.data_transacao BETWEEN ? AND ?";
    params.push(data_inicio, data_fim);
  }

  sql += " ORDER BY t.data_transacao DESC";

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ erro: "Erro ao buscar transações" });
    }

    if (results.length === 0) {
      return res.json({ mensagem: "Nenhuma transação encontrada" });
    }

    res.json(results);
  });
});

// ATUALIZAR TRANSAÇÃO
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { titulo, valor, id_categoria, data_transacao } = req.body;

  if (!titulo || valor === undefined || !data_transacao) {
    return res.status(400).json({ erro: "Campos obrigatórios não preenchidos" });
  }

  if (isNaN(valor)) {
    return res.status(400).json({ erro: "Valor inválido" });
  }

  const tipo = valor >= 0 ? "RECEITA" : "DESPESA";

  const sql = `
    UPDATE transacoes
    SET titulo = ?, valor = ?, tipo = ?, id_categoria = ?, data_transacao = ?
    WHERE id_transacao = ?
  `;

  db.query(
    sql,
    [
      titulo,
      Math.abs(valor),
      tipo,
      id_categoria || null,
      data_transacao,
      id,
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ erro: "Erro ao atualizar transação" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ erro: "Transação não encontrada" });
      }

      res.json({ mensagem: "Transação atualizada com sucesso" });
    }
  );
});

//  EXCLUIR TRANSAÇÃO
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM transacoes WHERE id_transacao = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ erro: "Erro ao excluir transação" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Transação não encontrada" });
    }

    res.json({ mensagem: "Transação excluída com sucesso" });
  });
});

module.exports = router;