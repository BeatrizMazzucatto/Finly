const express = require("express");
const router = express.Router();
const db = require("../database/connection");

const FALLBACK_USER = {
  id_usuario: 1,
  nome: "Julia",
  email: "julia@gmail.com",
  senha_hash: "12345",
};

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

  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error(err);
      // Fallback temporario para ambiente sem MySQL ativo.
      if (email === FALLBACK_USER.email && senha === FALLBACK_USER.senha_hash) {
        return res.json({
          id_usuario: FALLBACK_USER.id_usuario,
          nome: FALLBACK_USER.nome,
          email: FALLBACK_USER.email,
        });
      }
      return res.status(500).json({ erro: "Erro ao autenticar usuário" });
    }

    if (!results.length) {
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    const usuario = results[0];
    const senhaValida = usuario.senha_hash === senha;

    if (!senhaValida) {
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    return res.json({
      id_usuario: usuario.id_usuario,
      nome: usuario.nome,
      email: usuario.email,
    });
  });
});

module.exports = router;
