const express = require("express");
const router = express.Router();
const pool = require("../database/connection");

async function registrarLog(id_usuario, acao, tabela, id_registro, detalhes) {
  try {
    await pool.query(
      `INSERT INTO logs_auditoria (id_usuario, acao, tabela, id_registro, detalhes) VALUES ($1, $2, $3, $4, $5)`,
      [id_usuario, acao, tabela, id_registro, JSON.stringify(detalhes)]
    );
  } catch (err) {
    console.error("Erro ao registrar log:", err.message);
  }
}

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
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id_transacao
  `;

  pool.query(
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
        id_transacao: result.rows[0].id_transacao,
      });
    }
  );
});

// LISTAR TRANSAÇÕES POR USUÁRIO (com filtros opcionais)
router.get("/:id_usuario", (req, res) => {
  const { id_usuario } = req.params;
  const { categoria, data_inicio, data_fim } = req.query;

  let paramCount = 1;
  let sql = `
    SELECT
      t.id_transacao,
      t.id_carteira,
      t.id_usuario,
      u.nome AS usuario_nome,
      t.titulo,
      t.tipo,
      t.valor,
      TO_CHAR(t.data_transacao, 'YYYY-MM-DD') AS data_transacao,
      c.nome AS categoria
    FROM transacoes t
    LEFT JOIN categorias c ON t.id_categoria = c.id_categoria
    LEFT JOIN usuarios u ON t.id_usuario = u.id_usuario
    WHERE t.id_carteira IN (
      SELECT id_carteira FROM usuarios_carteiras WHERE id_usuario = $${paramCount++}
    )
  `;

  const params = [id_usuario];

  if (categoria) {
    sql += ` AND c.nome = $${paramCount++}`;
    params.push(categoria);
  }

  if (data_inicio && data_fim) {
    sql += ` AND t.data_transacao BETWEEN $${paramCount++} AND $${paramCount++}`;
    params.push(data_inicio, data_fim);
  }

  sql += " ORDER BY t.data_transacao DESC";

  pool.query(sql, params, (err, result) => {
    if (err) {
      console.error("Erro ao buscar transações:", err);
      return res.status(500).json({ erro: "Erro ao buscar transações" });
    }

    if (!result || result.rows.length === 0) {
      return res.json([]);
    }

    res.json(result.rows);
  });
});

// ATUALIZAR TRANSAÇÃO
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { titulo, valor, tipo, id_categoria, data_transacao, descricao, forma_pagamento, status, updated_at } = req.body;

  if (!titulo || valor === undefined || !data_transacao || !tipo) {
    return res.status(400).json({ erro: "Campos obrigatórios não preenchidos" });
  }

  if (isNaN(Number(valor)) || Number(valor) <= 0) {
    return res.status(400).json({ erro: "Valor inválido" });
  }

  // Controle de concorrência: verificar se a versão bate
  const checkSql = updated_at
    ? `SELECT id_transacao FROM transacoes WHERE id_transacao = $1 AND data_registro <= $2`
    : `SELECT id_transacao FROM transacoes WHERE id_transacao = $1`;
  const checkParams = updated_at ? [id, updated_at] : [id];

  pool.query(checkSql, checkParams, (checkErr, checkResult) => {
    if (checkErr || checkResult.rowCount === 0) {
      return res.status(409).json({ erro: "Conflito: esta transação foi alterada por outro usuário. Recarregue e tente novamente." });
    }

    const sql = `
      UPDATE transacoes
      SET titulo = $1, valor = $2, tipo = $3, id_categoria = $4, data_transacao = $5, descricao = $6, forma_pagamento = $7, status = $8
      WHERE id_transacao = $9
    `;

    pool.query(
      sql,
      [titulo, Number(valor), tipo, id_categoria ?? null, data_transacao, descricao ?? null, forma_pagamento ?? null, status ?? "PAGO", id],
      (err, result) => {
        if (err) {
          console.error("Erro ao atualizar transação:", err);
          return res.status(500).json({ erro: "Erro ao atualizar transação" });
        }
        if (result.rowCount === 0) {
          return res.status(404).json({ erro: "Transação não encontrada" });
        }
        res.json({ mensagem: "Transação atualizada com sucesso" });
      }
    );
  });
});

// EXCLUIR TRANSAÇÃO
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { id_usuario } = req.body; // Quem está excluindo (para auditoria)

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ erro: "ID inválido" });
  }

  try {
    // Buscar dados da transação antes de excluir (para o log)
    const { rows } = await pool.query(
      `SELECT id_transacao, titulo, valor, tipo, id_carteira, id_usuario as dono FROM transacoes WHERE id_transacao = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Transação não encontrada" });
    }

    const transacao = rows[0];
    await pool.query("DELETE FROM transacoes WHERE id_transacao = $1", [id]);

    // Registrar log de auditoria
    await registrarLog(
      id_usuario || transacao.dono,
      "DELETE",
      "transacoes",
      Number(id),
      { titulo: transacao.titulo, valor: transacao.valor, tipo: transacao.tipo, id_carteira: transacao.id_carteira }
    );

    res.json({ mensagem: "Transação excluída com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir transação:", err);
    res.status(500).json({ erro: "Erro ao excluir transação" });
  }
});

module.exports = router;