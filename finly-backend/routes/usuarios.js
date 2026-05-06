const express = require("express");
const router = express.Router();
const db = require("../database/connection");

const FALLBACK_USER = {
  id_usuario: 1,
  nome: "Julia",
  email: "julia@finly.com",   
  senha_hash: "hash_senha_123",
};

// POST /usuarios/login
router.post("/login", (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: "Email e senha são obrigatórios" });
  }

  const sql = `
    SELECT id_usuario, nome, email, senha_hash
    FROM usuarios
    WHERE email = ?
    LIMIT 1
  `;

  db.query(sql, [email.trim().toLowerCase()], (err, results) => {
    if (err) {
      console.error("Erro ao autenticar:", err);
      // Fallback para ambiente sem MySQL
      if (
        email.trim().toLowerCase() === FALLBACK_USER.email &&
        senha === FALLBACK_USER.senha_hash
      ) {
        return res.json({
          id_usuario: FALLBACK_USER.id_usuario,
          nome: FALLBACK_USER.nome,
          email: FALLBACK_USER.email,
        });
      }
      return res.status(500).json({ erro: "Erro ao autenticar usuário" });
    }

    if (!results || results.length === 0) {
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    const usuario = results[0];

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
    VALUES (?, ?, ?)
  `;

  db.query(sql, [nome, email.trim().toLowerCase(), senha], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ erro: "Email já cadastrado" });
      }
      console.error("Erro ao criar usuário:", err);
      return res.status(500).json({ erro: "Erro ao criar usuário" });
    }

    return res.status(201).json({
      mensagem: "Usuário criado com sucesso",
      id_usuario: result.insertId,
    });
  });
});

module.exports = router;