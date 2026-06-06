/**
 * Smoke de integração: percorre todos os módulos de rota montados no app.
 * Banco mockado — valida contrato HTTP da API Finly.
 */
const request = require("supertest");
const { createMockDb } = require("../helpers/mockDb");

const mockDb = createMockDb();
jest.mock("../../database/connection", () => mockDb);

const app = require("../../app");

beforeEach(() => mockDb.clearQueue());

describe("Smoke de integração da API Finly", () => {
  it("expõe health check", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("integra fluxo transação: criar → listar → atualizar → excluir", async () => {
    mockDb.pushResult({ rows: [{ id_transacao: 100 }], rowCount: 1 });

    const create = await request(app).post("/transacoes").send({
      id_carteira: 1,
      id_usuario: 1,
      id_categoria: 1,
      titulo: "Integração",
      tipo: "DESPESA",
      valor: 99,
      data_transacao: "2024-06-01",
    });
    expect(create.status).toBe(201);

    mockDb.pushResult({
      rows: [{ id_transacao: 100, titulo: "Integração", tipo: "DESPESA", valor: 99, data_transacao: "2024-06-01", categoria: "Alimentação" }],
      rowCount: 1,
    });

    const list = await request(app).get("/transacoes/1");
    expect(list.status).toBe(200);
    expect(list.body[0].titulo).toBe("Integração");

    mockDb.pushResult({ rows: [{ id_transacao: 100 }], rowCount: 1 });
    mockDb.pushResult({ rows: [], rowCount: 1 });

    const update = await request(app).put("/transacoes/100").send({
      titulo: "Integração Editada",
      valor: 120,
      tipo: "DESPESA",
      data_transacao: "2024-06-02",
    });
    expect(update.status).toBe(200);

    mockDb.pushResult({
      rows: [{ id_transacao: 100, titulo: "Integração Editada", valor: 120, tipo: "DESPESA", id_carteira: 1, dono: 1 }],
      rowCount: 1,
    });
    mockDb.pushResult({ rows: [], rowCount: 1 });
    mockDb.pushResult({ rows: [], rowCount: 1 });

    const del = await request(app).delete("/transacoes/100").send({ id_usuario: 1 });
    expect(del.status).toBe(200);
  });

  it("integra fluxo usuário: login e cadastro", async () => {
    const bcrypt = require("bcrypt");
    jest.spyOn(bcrypt, "compare").mockResolvedValue(true);
    jest.spyOn(bcrypt, "hash").mockResolvedValue("hash");

    mockDb.pushResult({
      rows: [{ id_usuario: 1, nome: "Teste", email: "t@e.com", senha_hash: "hash", id_carteira_pessoal: 1, id_carteira_conjunta: null }],
      rowCount: 1,
    });

    const login = await request(app).post("/usuarios/login").send({ email: "t@e.com", senha: "123" });
    expect(login.status).toBe(200);
    expect(login.body.id_usuario).toBe(1);

    mockDb.pushResult({ rows: [{ id_usuario: 2 }], rowCount: 1 });
    mockDb.pushResult({ rows: [], rowCount: 0 });

    const register = await request(app).post("/usuarios").send({ nome: "Novo", email: "novo@e.com", senha: "123456" });
    expect(register.status).toBe(201);
  });

  it("integra fluxo categorias e carteiras conjuntas", async () => {
    mockDb.pushResult({
      rows: [{ id_categoria: 1, nome: "Alimentação", cor_hex: "#F59E0B", icone: "coffee" }],
      rowCount: 1,
    });

    const cats = await request(app).get("/categorias");
    expect(cats.status).toBe(200);
    expect(cats.body).toHaveLength(1);

    mockDb.pushResult({ rows: [{ id_carteira: 7 }], rowCount: 1 });
    mockDb.pushResult({ rows: [], rowCount: 1 });

    const wallet = await request(app).post("/carteiras").send({ nome: "Família", id_usuario: 1 });
    expect(wallet.status).toBe(201);
    expect(wallet.body.codigo_convite).toMatch(/^JOIN-/);

    mockDb.pushResult({ rows: [{ id_carteira: 7 }], rowCount: 1 });
    mockDb.pushResult({ rows: [], rowCount: 1 });

    const join = await request(app).post("/carteiras/entrar").send({
      codigo_convite: wallet.body.codigo_convite,
      id_usuario: 2,
    });
    expect(join.status).toBe(200);
  });
});
