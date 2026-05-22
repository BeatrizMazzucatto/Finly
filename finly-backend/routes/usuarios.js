const express = require("express");
const router = express.Router();
const db = require("../database/connection");



// POST /usuarios/login
router.post("/login", (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: "Email e senha são obrigatórios" });
  }

  const sql = `
    SELECT id_usuario, nome, email, senha_hash
    FROM usuarios
    WHERE email = $1
    LIMIT 1
  `;

  db.query(sql, [email.trim().toLowerCase()], (err, result) => {
    if (err) {
      console.error("Erro ao autenticar:", err);
      return res.status(500).json({ erro: "Erro ao autenticar usuário" });
    }

    if (!result || result.rows.length === 0) {
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    const usuario = result.rows[0];

    // Comparação direta — substituir por bcrypt em produção
    if (usuario.senha_hash !== senha) {
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    return res.json({
      id_usuario: usuario.id_usuario,
      nome: usuario.nome,
      email: usuario.email,
    });
  });
});

// POST /usuarios — Criar usuário
router.post("/", (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "Nome, email e senha são obrigatórios" });
  }

  const sql = `
    INSERT INTO usuarios (nome, email, senha_hash)
    VALUES ($1, $2, $3) RETURNING id_usuario
  `;

  db.query(sql, [nome, email.trim().toLowerCase(), senha], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY" || err.code === "23505") { // 23505 is PostgreSQL unique constraint violation
        return res.status(409).json({ erro: "Email já cadastrado" });
      }
      console.error("Erro ao criar usuário:", err);
      return res.status(500).json({ erro: "Erro ao criar usuário" });
    }

    const newUserId = result.rows[0].id_usuario;

    // Vincula automaticamente às carteiras 1 (Pessoal) e 3 (Conjunta)
    const linkSql = `
      INSERT INTO usuarios_carteiras (id_usuario, id_carteira, papel, renda_mensal_alocada)
      VALUES ($1, 1, 'PROPRIETARIO', 0.00), ($1, 3, 'MEMBRO', 0.00)
      ON CONFLICT (id_usuario, id_carteira) DO NOTHING
    `;
    db.query(linkSql, [newUserId], (linkErr) => {
      if (linkErr) {
        console.error("Erro ao vincular carteiras padrão ao novo usuário:", linkErr);
      }
      return res.status(201).json({
        mensagem: "Usuário criado com sucesso",
        id_usuario: newUserId,
      });
    });
  });
});

module.exports = router;