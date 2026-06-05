const express = require("express");
const router = express.Router();
const db = require("../database/connection");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

// POST /usuarios/login
router.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: "Email e senha são obrigatórios" });
  }

  const sql = `
    SELECT u.id_usuario, u.nome, u.email, u.senha_hash,
      (SELECT id_carteira FROM usuarios_carteiras uc JOIN carteiras c USING(id_carteira) WHERE uc.id_usuario = u.id_usuario AND c.tipo = 'PESSOAL' ORDER BY id_carteira DESC LIMIT 1) as id_carteira_pessoal,
      (SELECT id_carteira FROM usuarios_carteiras uc JOIN carteiras c USING(id_carteira) WHERE uc.id_usuario = u.id_usuario AND c.tipo = 'CONJUNTA' ORDER BY id_carteira DESC LIMIT 1) as id_carteira_conjunta
    FROM usuarios u
    WHERE u.email = $1
    LIMIT 1
  `;

  try {
    const result = await db.query(sql, [email.trim().toLowerCase()]);

    if (!result || result.rows.length === 0) {
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    const usuario = result.rows[0];

    // Verificação segura com bcrypt
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      // Fallback: comparação direta para contas antigas ainda sem hash
      if (usuario.senha_hash !== senha) {
        return res.status(401).json({ erro: "Credenciais inválidas" });
      }
    }

    return res.json({
      id_usuario: usuario.id_usuario,
      nome: usuario.nome,
      email: usuario.email,
      id_carteira_pessoal: usuario.id_carteira_pessoal || null,
      id_carteira_conjunta: usuario.id_carteira_conjunta || null,
    });
  } catch (err) {
    console.error("Erro ao autenticar:", err);
    return res.status(500).json({ erro: "Erro ao autenticar usuário" });
  }
});

// POST /usuarios — Criar usuário
router.post("/", async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "Nome, email e senha são obrigatórios" });
  }

  const sql = `
    INSERT INTO usuarios (nome, email, senha_hash)
    VALUES ($1, $2, $3) RETURNING id_usuario
  `;

  const senhaHashed = await bcrypt.hash(senha, SALT_ROUNDS);
  db.query(sql, [nome, email.trim().toLowerCase(), senhaHashed], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY" || err.code === "23505") { // 23505 is PostgreSQL unique constraint violation
        return res.status(409).json({ erro: "Email já cadastrado" });
      }
      console.error("Erro ao criar usuário:", err);
      return res.status(500).json({ erro: "Erro ao criar usuário" });
    }

    const newUserId = result.rows[0].id_usuario;

    return res.status(201).json({
      mensagem: "Usuário criado com sucesso",
      id_usuario: newUserId,
    });
  });
});

// POST /usuarios/:id/onboarding
router.post("/:id/onboarding", async (req, res) => {
  const { id } = req.params;
  const { renda_mensal } = req.body;

  if (!renda_mensal || isNaN(Number(renda_mensal))) {
    return res.status(400).json({ erro: "Renda mensal inválida" });
  }

  try {
    // Buscar nome do usuario
    const userRes = await db.query("SELECT nome FROM usuarios WHERE id_usuario = $1", [id]);
    if (userRes.rowCount === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }
    const userName = userRes.rows[0].nome;

    // Criar carteira pessoal
    const carteiraRes = await db.query(
      "INSERT INTO carteiras (nome, tipo, limite_gastos_mensal) VALUES ($1, $2, $3) RETURNING id_carteira",
      [`Pessoal - ${userName}`, "PESSOAL", 0]
    );
    const id_carteira = carteiraRes.rows[0].id_carteira;

    // Vincular usuario a carteira
    await db.query(
      "INSERT INTO usuarios_carteiras (id_usuario, id_carteira, papel, renda_mensal_alocada) VALUES ($1, $2, $3, $4)",
      [id, id_carteira, "PROPRIETARIO", Number(renda_mensal)]
    );

    // Criar transacao inicial de salario (categoria 17 é Salário)
    const today = new Date().toISOString().split('T')[0];
    await db.query(
      `INSERT INTO transacoes 
      (id_carteira, id_usuario, id_categoria, titulo, tipo, valor, data_transacao, status) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id_carteira, id, 17, "Salário Inicial", "RECEITA", Number(renda_mensal), today, "PAGO"]
    );

    res.json({ mensagem: "Onboarding concluído com sucesso", id_carteira });
  } catch (err) {
    console.error("Erro no onboarding:", err);
    res.status(500).json({ erro: "Erro ao salvar dados de onboarding" });
  }
});

module.exports = router;